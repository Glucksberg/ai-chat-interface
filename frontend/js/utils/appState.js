/**
 * appState.js - Gerenciador de estado centralizado da aplicação
 * 
 * Este módulo implementa um padrão de Gerenciamento de Estado simples usando
 * o padrão Observer para notificar componentes sobre mudanças no estado.
 */

const appState = (() => {
    // Estado privado da aplicação
    let _state = {
        deviceMode: 'desktop', // 'desktop' ou 'mobile'
        currentTheme: 'light', // 'light' ou 'dark'
        
        // Icones da fazenda e suas posições
        icons: {
            fuel: { top: 0, left: 0 },
            grain: { top: 0, left: 0 },
            office: { top: 0, left: 0 },
            cattle: { top: 0, left: 0 },
            inventory: { top: 0, left: 0 },
            fields: { top: 0, left: 0 },
            machines: { top: 0, left: 0 },
            biologicals: { top: 0, left: 0 },
            rainfall: { top: 0, left: 0 },
            monitoring: { top: 0, left: 0 }
        },
        
        // Estado dos módulos e popups
        activeModule: null, // Módulo atualmente ativo ou null se nenhum
        
        // Estado do assistente de chat
        chatHistory: [],
        chatVisible: false,
        
        // Estado da ferramenta de posicionamento
        positioningActive: false
    };
    
    // Armazena os listeners por chave de estado
    const _listeners = {};
    
    // Notificar todos os listeners de uma determinada chave
    const _notify = (key, newValue, oldValue) => {
        if (!_listeners[key]) return;
        
        _listeners[key].forEach(callback => {
            try {
                callback(newValue, oldValue);
            } catch (error) {
                console.error(`Erro ao notificar listener para a chave ${key}:`, error);
            }
        });
    };
    
    // Funções públicas do módulo
    return {
        /**
         * Inicializa o estado da aplicação
         */
        initialize() {
            // Carregar valores do localStorage se existirem
            const savedTheme = localStorage.getItem('cloudFarm_theme');
            if (savedTheme) {
                this.set('currentTheme', savedTheme);
            }
            
            console.log('AppState inicializado');
        },
        
        /**
         * Obtém o valor atual de uma propriedade do estado
         * Suporta acesso a propriedades aninhadas com notação de ponto
         * 
         * @param {string} key - Chave do estado (ex: 'icons.fuel')
         * @returns {any} - Valor atual
         */
        get(key) {
            if (!key) return {..._state};
            
            // Suporte a acesso com notação de ponto (ex: 'icons.fuel')
            const parts = key.split('.');
            let value = _state;
            
            for (const part of parts) {
                if (value === undefined || value === null) return undefined;
                value = value[part];
            }
            
            // Retorna uma cópia para evitar modificações diretas
            return value !== undefined && typeof value === 'object' 
                ? JSON.parse(JSON.stringify(value)) 
                : value;
        },
        
        /**
         * Define um novo valor para uma propriedade do estado
         * 
         * @param {string} key - Chave do estado
         * @param {any} value - Novo valor
         */
        set(key, value) {
            // Guarda o valor antigo para o callback
            const oldValue = this.get(key);
            
            // Suporte a acesso com notação de ponto
            const parts = key.split('.');
            const lastPart = parts.pop();
            
            let target = _state;
            for (const part of parts) {
                // Cria o objeto se não existir
                if (!target[part] || typeof target[part] !== 'object') {
                    target[part] = {};
                }
                target = target[part];
            }
            
            // Atualiza o valor
            target[lastPart] = value;
            
            // Notifica os listeners
            _notify(key, value, oldValue);
            
            // Também notifica listeners de níveis superiores
            if (parts.length > 0) {
                let parentKey = '';
                for (const part of parts) {
                    parentKey = parentKey ? `${parentKey}.${part}` : part;
                    _notify(parentKey, this.get(parentKey), oldValue);
                }
            }
            
            return value;
        },
        
        /**
         * Inscreve um listener para ser notificado quando uma chave específica do estado mudar
         * 
         * @param {string} key - Chave do estado a observar
         * @param {Function} callback - Função a chamar quando o valor mudar
         * @returns {Function} - Função para cancelar a inscrição
         */
        subscribe(key, callback) {
            if (!_listeners[key]) {
                _listeners[key] = [];
            }
            
            _listeners[key].push(callback);
            
            // Retorna função para cancelar a inscrição
            return () => {
                _listeners[key] = _listeners[key].filter(cb => cb !== callback);
            };
        },
        
        /**
         * Salva o estado atual no localStorage
         * 
         * @param {string} key - Chave opcional para salvar apenas uma parte do estado
         */
        saveToLocalStorage(key) {
            if (key) {
                localStorage.setItem(`cloudFarm_${key}`, JSON.stringify(this.get(key)));
            } else {
                localStorage.setItem('cloudFarm_state', JSON.stringify(_state));
            }
        },
        
        /**
         * Carrega o estado do localStorage
         * 
         * @param {string} key - Chave opcional para carregar apenas uma parte do estado
         */
        loadFromLocalStorage(key) {
            if (key) {
                const savedState = localStorage.getItem(`cloudFarm_${key}`);
                if (savedState) {
                    this.set(key, JSON.parse(savedState));
                }
            } else {
                const savedState = localStorage.getItem('cloudFarm_state');
                if (savedState) {
                    const parsedState = JSON.parse(savedState);
                    Object.keys(parsedState).forEach(key => {
                        this.set(key, parsedState[key]);
                    });
                }
            }
        }
    };
})();

// Exportar usando ES modules para compatibilidade com Vite
export { appState };
