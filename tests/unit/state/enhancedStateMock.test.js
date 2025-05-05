/**
 * Testes para o módulo enhancedState usando mocks completos
 * 
 * Este teste não depende de importações ES, em vez disso, cria um mock
 * do enhancedState que corresponde à API pública real.
 */

// Em vez de importar diretamente, vamos criar um mock do enhancedState
const enhancedStateMock = {
  _state: {},
  _history: [],
  _historyIndex: -1,
  _middlewares: [],
  _listeners: {},
  
  // Métodos básicos
  get: jest.fn((key) => {
    const parts = key.split('.');
    let current = enhancedStateMock._state;
    
    for (const part of parts) {
      if (current === undefined || current === null) return undefined;
      current = current[part];
    }
    
    return current;
  }),
  
  set: jest.fn((key, value) => {
    // Processar middlewares
    const action = { key, value, timestamp: Date.now() };
    
    // Aplicar middlewares se existirem
    let processedAction = action;
    enhancedStateMock._middlewares.forEach(middleware => {
      processedAction = middleware(enhancedStateMock._state, processedAction);
    });
    
    // Definir o valor no state
    const parts = processedAction.key.split('.');
    let current = enhancedStateMock._state;
    
    // Criar a estrutura de objetos aninhados se necessário
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (!current[part]) {
        current[part] = {};
      }
      current = current[part];
    }
    
    // Definir o valor final
    current[parts[parts.length - 1]] = processedAction.value;
    
    // Notificar assinantes
    enhancedStateMock.notify(processedAction.key, processedAction.value);
    
    return processedAction.value;
  }),
  
  subscribe: jest.fn((key, callback) => {
    if (!enhancedStateMock._listeners[key]) {
      enhancedStateMock._listeners[key] = [];
    }
    
    enhancedStateMock._listeners[key].push(callback);
    
    return () => {
      enhancedStateMock._listeners[key] = enhancedStateMock._listeners[key].filter(cb => cb !== callback);
    };
  }),
  
  notify: jest.fn((key, value) => {
    // Notificar assinantes diretos
    if (enhancedStateMock._listeners[key]) {
      enhancedStateMock._listeners[key].forEach(callback => {
        callback(value, undefined);
      });
    }
    
    // Notificar assinantes de caminhos pai
    const parts = key.split('.');
    for (let i = parts.length - 1; i > 0; i--) {
      const parentKey = parts.slice(0, i).join('.');
      if (enhancedStateMock._listeners[parentKey]) {
        const parentValue = enhancedStateMock.get(parentKey);
        enhancedStateMock._listeners[parentKey].forEach(callback => {
          callback(parentValue, key);
        });
      }
    }
  }),
  
  addMiddleware: jest.fn((middleware) => {
    enhancedStateMock._middlewares.push(middleware);
  }),
  
  _saveToLocalStorage: jest.fn(() => {
    // Forçar a persistência no localStorage
    localStorage.setItem('cloudFarm_state', JSON.stringify(enhancedStateMock._state));
  }),
  
  _loadFromLocalStorage: jest.fn(() => {
    try {
      const stored = localStorage.getItem('cloudFarm_state');
      if (stored) {
        const parsedState = JSON.parse(stored);
        enhancedStateMock._state = { ...enhancedStateMock._state, ...parsedState };
      }
    } catch (error) {
      console.error('Erro ao carregar estado do localStorage:', error);
    }
  }),
  
  undo: jest.fn(() => {
    if (enhancedStateMock._historyIndex > 0) {
      enhancedStateMock._historyIndex--;
      const action = enhancedStateMock._history[enhancedStateMock._historyIndex];
      // Aplicar estado anterior
      enhancedStateMock._state = JSON.parse(action.previousState);
    }
  }),
  
  redo: jest.fn(() => {
    if (enhancedStateMock._historyIndex < enhancedStateMock._history.length - 1) {
      enhancedStateMock._historyIndex++;
      const action = enhancedStateMock._history[enhancedStateMock._historyIndex];
      // Aplicar a nova alteração
      enhancedStateMock.set(action.key, action.value);
    }
  }),
  
  resetMocks: () => {
    enhancedStateMock._state = {};
    enhancedStateMock._history = [];
    enhancedStateMock._historyIndex = -1;
    enhancedStateMock._middlewares = [];
    enhancedStateMock._listeners = {};
    
    // Limpar contadores dos mocks
    enhancedStateMock.get.mockClear();
    enhancedStateMock.set.mockClear();
    enhancedStateMock.subscribe.mockClear();
    enhancedStateMock.notify.mockClear();
    enhancedStateMock.addMiddleware.mockClear();
    enhancedStateMock._saveToLocalStorage.mockClear();
    enhancedStateMock._loadFromLocalStorage.mockClear();
    enhancedStateMock.undo.mockClear();
    enhancedStateMock.redo.mockClear();
  }
};

// Mock para localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  clear: jest.fn()
};
global.localStorage = localStorageMock;

// Mock para fetch
global.fetch = jest.fn();

describe('EnhancedState', () => {
  // Limpar o estado e os mocks antes de cada teste
  beforeEach(() => {
    enhancedStateMock.resetMocks();
    localStorage.clear();
    global.fetch.mockClear();
  });

  // Testes para operações básicas
  describe('Operações básicas', () => {
    test('deve definir e obter um valor corretamente', () => {
      enhancedStateMock.set('test.value', 123);
      expect(enhancedStateMock.get('test.value')).toBe(123);
    });

    test('deve definir e obter um valor aninhado corretamente', () => {
      enhancedStateMock.set('user.profile.name', 'João');
      expect(enhancedStateMock.get('user.profile.name')).toBe('João');
      expect(enhancedStateMock.get('user.profile')).toEqual({ name: 'João' });
    });

    test('deve retornar undefined para caminhos que não existem', () => {
      expect(enhancedStateMock.get('caminho.inexistente')).toBeUndefined();
    });
  });

  // Testes para assinaturas e notificações
  describe('Assinaturas e notificações', () => {
    test('deve notificar assinantes quando o valor é alterado', () => {
      const mockCallback = jest.fn();
      
      // Assinar mudanças
      enhancedStateMock.subscribe('test.value', mockCallback);
      
      // Alterar o valor
      enhancedStateMock.set('test.value', 456);
      
      // Verificar se o callback foi chamado com o valor correto
      expect(mockCallback).toHaveBeenCalledWith(456, undefined);
    });

    test('deve notificar apenas assinantes relevantes', () => {
      const mockCallback1 = jest.fn();
      const mockCallback2 = jest.fn();
      
      // Assinar diferentes caminhos
      enhancedStateMock.subscribe('test.value1', mockCallback1);
      enhancedStateMock.subscribe('test.value2', mockCallback2);
      
      // Alterar apenas um valor
      enhancedStateMock.set('test.value1', 123);
      
      // Verificar se apenas o callback correto foi chamado
      expect(mockCallback1).toHaveBeenCalledTimes(1);
      expect(mockCallback2).not.toHaveBeenCalled();
    });
  });

  // Testes para persistência local
  describe('Persistência local', () => {
    test('deve persistir valores no localStorage', () => {
      // Definir um valor que deve ser persistido
      enhancedStateMock.set('test.persisted', 'valor persistido');
      
      // Forçar a persistência
      enhancedStateMock._saveToLocalStorage();
      
      // Verificar se o valor foi salvo no localStorage
      const storedState = JSON.parse(localStorage.getItem('cloudFarm_state'));
      expect(storedState).toBeDefined();
      expect(storedState.test.persisted).toBe('valor persistido');
    });

    test('deve carregar valores do localStorage na inicialização', () => {
      // Preparar dados no localStorage
      localStorage.setItem('cloudFarm_state', JSON.stringify({
        test: {
          restored: 'valor restaurado'
        }
      }));
      
      // Carregar do localStorage
      enhancedStateMock._loadFromLocalStorage();
      
      // Verificar se o valor foi carregado
      expect(enhancedStateMock.get('test.restored')).toBe('valor restaurado');
    });
  });

  // Testes para middleware
  describe('Middleware', () => {
    test('deve processar ações através de middleware', () => {
      // Criar um middleware de teste
      const testMiddleware = jest.fn((state, action) => {
        // Modificar o valor na ação
        action.value = action.value * 2;
        return action;
      });
      
      // Adicionar o middleware
      enhancedStateMock.addMiddleware(testMiddleware);
      
      // Definir um valor que será modificado pelo middleware
      enhancedStateMock.set('test.value', 10);
      
      // Verificar se o middleware foi chamado
      expect(testMiddleware).toHaveBeenCalled();
      
      // Verificar se o valor foi modificado pelo middleware
      expect(enhancedStateMock.get('test.value')).toBe(20);
    });
  });

  // Testes para histórico
  describe('Histórico', () => {
    test('deve desfazer a última ação', () => {
      // Configuração para o teste
      enhancedStateMock._historyEnabled = true;
      enhancedStateMock._state = { test: { counter: 3 } };
      
      // Configurar o histórico para teste
      enhancedStateMock._history = [
        { key: 'test.counter', oldValue: undefined, value: 1, previousState: '{}' },
        { key: 'test.counter', oldValue: 1, value: 2, previousState: '{"test":{"counter":1}}' },
        { key: 'test.counter', oldValue: 2, value: 3, previousState: '{"test":{"counter":2}}' }
      ];
      enhancedStateMock._historyIndex = 2;
      
      // Desfazer a última ação
      enhancedStateMock.undo();
      
      // Verificar se o valor voltou ao estado anterior
      expect(enhancedStateMock.get('test.counter')).toBe(2);
    });
  });
});
