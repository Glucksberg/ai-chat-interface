/**
 * enhancedState.js - Gerenciador de estado avançado da aplicação
 * 
 * Este módulo implementa um gerenciador de estado centralizado com recursos avançados:
 * - Persistência automática entre sessões (local e remota)
 * - Middleware para interceptação e transformação de ações
 * - Histórico de mudanças com capacidade de desfazer/refazer
 * - Carregamento e salvamento assíncrono no servidor
 */

import { appState } from './appState.js';

class EnhancedState {
  constructor() {
    // Estado inicial é o mesmo do appState
    this._state = appState.get();
    
    // Armazena os listeners por chave de estado
    this._listeners = {};
    
    // Pilha de ações para undo/redo
    this._history = [];
    this._historyIndex = -1;
    this._maxHistorySize = 50;
    
    // Configuração de persistência
    this._persistenceConfig = {
      localStorage: {
        enabled: true,
        prefix: 'cloudFarm_',
        throttleMs: 500 // Limitar frequência de salvamentos
      },
      server: {
        enabled: true,
        endpoint: '/api/state',
        syncInterval: 30000, // Sincronização a cada 30 segundos
        throttleMs: 2000 // Limitar frequência de requisições
      }
    };
    
    // Lista de middlewares
    this._middlewares = [];
    
    // Controle de throttling para persistência
    this._localSaveTimeout = null;
    this._serverSaveTimeout = null;
    
    // Flags de sincronização
    this._isSyncing = false;
    this._pendingChanges = false;
    
    // Mapa de propriedades que devem ser salvas apenas localmente
    this._localOnlyProps = new Set([
      'deviceMode',
      'currentTheme',
      'positioningActive',
      'chatVisible'
    ]);
    
    // Mapa de propriedades que exigem sincronização com servidor
    this._serverSyncProps = new Set([
      'icons',
      'chatHistory'
    ]);
  }
  
  /**
   * Inicializa o gerenciador de estado avançado
   */
  initialize() {
    // Primeiro carregamos do localStorage
    this._loadFromLocalStorage();
    
    // Em seguida sincronizamos com o servidor para obter dados mais atualizados
    this._syncWithServer();
    
    // Configurar sincronização periódica
    if (this._persistenceConfig.server.enabled) {
      setInterval(() => this._syncWithServer(), this._persistenceConfig.server.syncInterval);
    }
    
    console.log('EnhancedState inicializado');
    
    // Retornamos o estado atual para uso imediato
    return this._state;
  }
  
  /**
   * Adiciona um middleware para processar ações de estado
   * 
   * @param {Function} middleware - Função (state, action) => state
   */
  addMiddleware(middleware) {
    if (typeof middleware !== 'function') {
      throw new Error('Middleware deve ser uma função');
    }
    this._middlewares.push(middleware);
    return this; // Para encadeamento
  }
  
  /**
   * Obtém o valor atual de uma propriedade do estado
   * Suporta acesso a propriedades aninhadas com notação de ponto
   * 
   * @param {string} key - Chave do estado (ex: 'icons.fuel') ou vazio para todo estado
   * @returns {any} - Valor atual
   */
  get(key) {
    // Se não houver chave, retorna uma cópia do estado completo
    if (!key) return JSON.parse(JSON.stringify(this._state));
    
    // Suporte a acesso com notação de ponto (ex: 'icons.fuel')
    const parts = key.split('.');
    let value = this._state;
    
    for (const part of parts) {
      if (value === undefined || value === null) return undefined;
      value = value[part];
    }
    
    // Retorna uma cópia para evitar modificações diretas
    return value !== undefined && typeof value === 'object' 
      ? JSON.parse(JSON.stringify(value)) 
      : value;
  }
  
  /**
   * Define um novo valor para uma propriedade do estado
   * 
   * @param {string} key - Chave do estado
   * @param {any} value - Novo valor
   * @param {Object} options - Opções adicionais
   * @param {boolean} options.silent - Se true, não notifica os listeners
   * @param {boolean} options.noHistory - Se true, não registra na pilha de histórico
   * @returns {any} - O novo valor após aplicar middlewares
   */
  set(key, value, options = {}) {
    const oldValue = this.get(key);
    
    // Se o valor é o mesmo, não faz nada
    if (JSON.stringify(oldValue) === JSON.stringify(value)) {
      return value;
    }
    
    // Criar ação para passar pelos middlewares
    let action = {
      type: 'SET_STATE',
      key,
      value,
      oldValue,
      timestamp: Date.now()
    };
    
    // Aplicar middlewares
    if (this._middlewares.length > 0) {
      for (const middleware of this._middlewares) {
        action = middleware(this._state, action) || action;
      }
    }
    
    // Atualizar estado conforme a estrutura da chave
    const parts = key.split('.');
    const lastPart = parts.pop();
    
    let target = this._state;
    for (const part of parts) {
      // Cria o objeto se não existir
      if (!target[part] || typeof target[part] !== 'object') {
        target[part] = {};
      }
      target = target[part];
    }
    
    // Aplicar novo valor
    target[lastPart] = action.value;
    
    // Adicionar ao histórico se necessário
    if (!options.noHistory) {
      this._addToHistory(key, oldValue, action.value);
    }
    
    // Notificar listeners
    if (!options.silent) {
      this._notify(key, action.value, oldValue);
    }
    
    // Acionar persistência se necessário
    this._schedulePersistence(key);
    
    return action.value;
  }
  
  /**
   * Adiciona mudança ao histórico para undo/redo
   * 
   * @private
   */
  _addToHistory(key, oldValue, newValue) {
    // Remover entradas à frente do índice atual (casos de undo seguido de nova ação)
    if (this._historyIndex < this._history.length - 1) {
      this._history = this._history.slice(0, this._historyIndex + 1);
    }
    
    // Adicionar nova ação ao histórico
    this._history.push({
      key,
      oldValue,
      newValue,
      timestamp: Date.now()
    });
    
    // Limitar tamanho do histórico
    if (this._history.length > this._maxHistorySize) {
      this._history = this._history.slice(this._history.length - this._maxHistorySize);
    }
    
    // Atualizar índice para apontar para o último item
    this._historyIndex = this._history.length - 1;
  }
  
  /**
   * Desfaz a última mudança de estado
   * @returns {boolean} - true se a operação foi bem-sucedida
   */
  undo() {
    if (this._historyIndex < 0) return false;
    
    const action = this._history[this._historyIndex];
    this.set(action.key, action.oldValue, { silent: false, noHistory: true });
    this._historyIndex--;
    
    return true;
  }
  
  /**
   * Refaz a última mudança desfeita
   * @returns {boolean} - true se a operação foi bem-sucedida
   */
  redo() {
    if (this._historyIndex >= this._history.length - 1) return false;
    
    this._historyIndex++;
    const action = this._history[this._historyIndex];
    this.set(action.key, action.newValue, { silent: false, noHistory: true });
    
    return true;
  }
  
  /**
   * Inscreve um listener para ser notificado quando uma chave específica do estado mudar
   * 
   * @param {string} key - Chave do estado a observar
   * @param {Function} callback - Função a chamar quando o valor mudar
   * @returns {Function} - Função para cancelar a inscrição
   */
  subscribe(key, callback) {
    if (!this._listeners[key]) {
      this._listeners[key] = [];
    }
    
    this._listeners[key].push(callback);
    
    // Retorna função para cancelar a inscrição
    return () => {
      this._listeners[key] = this._listeners[key].filter(cb => cb !== callback);
    };
  }
  
  /**
   * Notifica todos os listeners de uma determinada chave
   * 
   * @private
   */
  _notify(key, newValue, oldValue) {
    // Notificar listeners exatos para esta chave
    if (this._listeners[key]) {
      this._listeners[key].forEach(callback => {
        try {
          callback(newValue, oldValue);
        } catch (error) {
          console.error(`Erro ao notificar listener para a chave ${key}:`, error);
        }
      });
    }
    
    // Também notificar listeners de níveis superiores
    const parts = key.split('.');
    if (parts.length > 1) {
      let parentKey = '';
      for (let i = 0; i < parts.length - 1; i++) {
        parentKey = parentKey ? `${parentKey}.${parts[i]}` : parts[i];
        
        if (this._listeners[parentKey]) {
          const parentNewValue = this.get(parentKey);
          this._listeners[parentKey].forEach(callback => {
            try {
              callback(parentNewValue, null); // Não temos o valor antigo exato do pai
            } catch (error) {
              console.error(`Erro ao notificar listener pai ${parentKey}:`, error);
            }
          });
        }
      }
    }
    
    // Notificar listeners do estado global
    if (this._listeners['*']) {
      this._listeners['*'].forEach(callback => {
        try {
          callback(this._state);
        } catch (error) {
          console.error('Erro ao notificar listener global:', error);
        }
      });
    }
  }
  
  /**
   * Programa a persistência do estado, com throttling
   * 
   * @private
   */
  _schedulePersistence(key) {
    // Determinar se esta propriedade precisa ser salva localmente
    const isLocalSave = !key || // Se não há chave, salvar tudo
                        this._localOnlyProps.has(key) ||
                        Array.from(this._localOnlyProps).some(prefix => key.startsWith(prefix + '.'));
    
    // Determinar se esta propriedade precisa ser sincronizada com o servidor
    const isServerSync = !key || // Se não há chave, sincronizar tudo
                         this._serverSyncProps.has(key) ||
                         Array.from(this._serverSyncProps).some(prefix => key.startsWith(prefix + '.'));
    
    // Agendar salvamento local com throttling
    if (isLocalSave && this._persistenceConfig.localStorage.enabled) {
      clearTimeout(this._localSaveTimeout);
      this._localSaveTimeout = setTimeout(() => {
        this._saveToLocalStorage();
      }, this._persistenceConfig.localStorage.throttleMs);
    }
    
    // Agendar sincronização com servidor com throttling
    if (isServerSync && this._persistenceConfig.server.enabled) {
      this._pendingChanges = true;
      
      clearTimeout(this._serverSaveTimeout);
      this._serverSaveTimeout = setTimeout(() => {
        if (!this._isSyncing) {
          this._saveToServer();
        }
      }, this._persistenceConfig.server.throttleMs);
    }
  }
  
  /**
   * Salva o estado no localStorage
   * 
   * @private
   */
  _saveToLocalStorage() {
    try {
      const state = this.get(); // Pega uma cópia completa do estado
      
      // Filtrar apenas as propriedades que devem ser salvas localmente
      const stateToSave = {};
      
      // Incluir propriedades que são apenas locais
      this._localOnlyProps.forEach(prop => {
        if (state[prop] !== undefined) {
          stateToSave[prop] = state[prop];
        }
      });
      
      // Incluir também propriedades que são sincronizadas com servidor
      // (para ficar disponível offline)
      this._serverSyncProps.forEach(prop => {
        if (state[prop] !== undefined) {
          stateToSave[prop] = state[prop];
        }
      });
      
      // Salvar no localStorage com o prefixo configurado
      localStorage.setItem(
        `${this._persistenceConfig.localStorage.prefix}state`, 
        JSON.stringify(stateToSave)
      );
      
      console.log('Estado salvo no localStorage', Object.keys(stateToSave));
    } catch (error) {
      console.error('Erro ao salvar estado no localStorage:', error);
    }
  }
  
  /**
   * Carrega o estado do localStorage
   * 
   * @private
   */
  _loadFromLocalStorage() {
    try {
      const savedState = localStorage.getItem(
        `${this._persistenceConfig.localStorage.prefix}state`
      );
      
      if (savedState) {
        const parsedState = JSON.parse(savedState);
        
        // Aplicar cada propriedade individualmente para não sobrescrever
        // propriedades não salvas
        Object.keys(parsedState).forEach(key => {
          this.set(key, parsedState[key], { silent: false, noHistory: true });
        });
        
        console.log('Estado carregado do localStorage', Object.keys(parsedState));
      }
    } catch (error) {
      console.error('Erro ao carregar estado do localStorage:', error);
    }
  }
  
  /**
   * Sincroniza o estado com o servidor
   * 
   * @private
   * @returns {Promise} - Promise que resolve quando a sincronização terminar
   */
  async _syncWithServer() {
    if (this._isSyncing || !this._persistenceConfig.server.enabled) {
      return;
    }
    
    this._isSyncing = true;
    
    try {
      // Se temos mudanças pendentes, salvamos primeiro
      if (this._pendingChanges) {
        await this._saveToServer();
      }
      
      // Em seguida, recuperamos as últimas mudanças do servidor
      const response = await fetch(this._persistenceConfig.server.endpoint);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const serverState = await response.json();
      
      // Aplicar apenas os campos que devem ser sincronizados com o servidor
      this._serverSyncProps.forEach(prop => {
        if (serverState[prop] !== undefined) {
          // Verificar se o valor do servidor é mais recente
          const serverValue = serverState[prop];
          const localValue = this.get(prop);
          
          // Estratégia simples: usar o timestamp para determinar qual valor é mais recente
          if (serverState._lastUpdated && 
              (!this._state._lastUpdated || 
               serverState._lastUpdated[prop] > this._state._lastUpdated[prop])) {
            this.set(prop, serverValue, { silent: false, noHistory: true });
          }
        }
      });
      
      console.log('Estado sincronizado com servidor', Object.keys(serverState));
    } catch (error) {
      console.error('Erro ao sincronizar estado com servidor:', error);
    } finally {
      this._isSyncing = false;
      
      // Se mudanças ocorreram durante a sincronização, reagendar salvamento
      if (this._pendingChanges) {
        this._schedulePersistence();
      }
    }
  }
  
  /**
   * Salva o estado no servidor
   * 
   * @private
   * @returns {Promise} - Promise que resolve quando o salvamento terminar
   */
  async _saveToServer() {
    if (!this._persistenceConfig.server.enabled) {
      return;
    }
    
    try {
      const state = this.get(); // Pega uma cópia completa do estado
      
      // Filtrar apenas as propriedades que devem ser sincronizadas com o servidor
      const stateToSave = {};
      
      this._serverSyncProps.forEach(prop => {
        if (state[prop] !== undefined) {
          stateToSave[prop] = state[prop];
        }
      });
      
      // Adicionar timestamp para cada propriedade
      stateToSave._lastUpdated = {};
      Object.keys(stateToSave).forEach(key => {
        if (key !== '_lastUpdated') {
          stateToSave._lastUpdated[key] = Date.now();
        }
      });
      
      // Salvar no servidor via API
      const response = await fetch(this._persistenceConfig.server.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(stateToSave)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      // Atualizar o estado com os timestamps
      if (!this._state._lastUpdated) {
        this._state._lastUpdated = {};
      }
      
      Object.keys(stateToSave._lastUpdated).forEach(key => {
        this._state._lastUpdated[key] = stateToSave._lastUpdated[key];
      });
      
      this._pendingChanges = false;
      console.log('Estado salvo no servidor', Object.keys(stateToSave));
    } catch (error) {
      console.error('Erro ao salvar estado no servidor:', error);
      // Agendar nova tentativa
      setTimeout(() => {
        if (this._pendingChanges) {
          this._saveToServer();
        }
      }, 5000); // Tentar novamente em 5 segundos
    }
  }
  
  /**
   * Limpa todo o histórico de mudanças
   */
  clearHistory() {
    this._history = [];
    this._historyIndex = -1;
  }
  
  /**
   * Reseta o estado para um valor específico
   * 
   * @param {Object} newState - Novo estado completo
   */
  resetState(newState) {
    // Reset completo do estado
    this._state = JSON.parse(JSON.stringify(newState));
    
    // Limpar histórico
    this.clearHistory();
    
    // Notificar todos os listeners
    this._notify('*', this._state, null);
    
    // Persistir o novo estado
    this._schedulePersistence();
  }
}

// Criar instância única
const enhancedState = new EnhancedState();

// Adicionar middlewares úteis
enhancedState.addMiddleware((state, action) => {
  // Exemplo de middleware para validação
  console.log(`[Middleware] Ação: ${action.type}, Chave: ${action.key}`);
  
  // Validação específica para posições de ícones
  if (action.key.startsWith('icons.') && action.key.includes('.top')) {
    // Garantir que ícones não saiam da tela
    if (action.value < 0) {
      action.value = 0;
    } else if (action.value > 2000) { // Valor arbitrário máximo
      action.value = 2000;
    }
  }
  
  return action;
});

// Middleware para logging
enhancedState.addMiddleware((state, action) => {
  // Registro para depuração
  if (process.env.NODE_ENV === 'development') {
    console.log(`[State] ${action.key} = `, action.value);
  }
  
  return action;
});

export { enhancedState };
