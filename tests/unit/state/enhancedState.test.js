/**
 * Testes para o módulo enhancedState
 */

// Importar o módulo a ser testado
import { enhancedState } from '../../../frontend/js/utils/enhancedState.js';

// Mock para o módulo appState
jest.mock('../../../frontend/js/utils/appState.js', () => ({
  appState: {
    get: jest.fn(() => ({})),
    set: jest.fn(),
    subscribe: jest.fn(),
    notify: jest.fn(),
    initialize: jest.fn()
  }
}));

// Mock para fetch global - já definido no setup.js, mas podemos sobrescrever aqui para testes específicos
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
  })
);

describe('EnhancedState', () => {
  // Limpar o estado e os mocks antes de cada teste
  beforeEach(() => {
    // Limpar localStorage
    localStorage.clear();
    // Limpar fetch mock
    global.fetch.mockClear();
    // Resetar o estado para teste
    enhancedState._state = {};
    enhancedState._history = [];
    enhancedState._historyIndex = -1;
    enhancedState._middlewares = [];
  });

  // Testes para operações básicas
  describe('Operações básicas', () => {
    test('deve definir e obter um valor corretamente', () => {
      enhancedState.set('test.value', 123);
      expect(enhancedState.get('test.value')).toBe(123);
    });

    test('deve definir e obter um valor aninhado corretamente', () => {
      enhancedState.set('user.profile.name', 'João');
      expect(enhancedState.get('user.profile.name')).toBe('João');
      expect(enhancedState.get('user.profile')).toEqual({ name: 'João' });
    });

    test('deve retornar undefined para caminhos que não existem', () => {
      expect(enhancedState.get('caminho.inexistente')).toBeUndefined();
    });
  });

  // Testes para assinaturas e notificações
  describe('Assinaturas e notificações', () => {
    test('deve notificar assinantes quando o valor é alterado', () => {
      const mockCallback = jest.fn();
      
      // Assinar mudanças
      enhancedState.subscribe('test.value', mockCallback);
      
      // Alterar o valor
      enhancedState.set('test.value', 456);
      
      // Verificar se o callback foi chamado com o valor correto
      expect(mockCallback).toHaveBeenCalledWith(456, undefined);
    });

    test('deve notificar apenas assinantes relevantes', () => {
      const mockCallback1 = jest.fn();
      const mockCallback2 = jest.fn();
      
      // Assinar diferentes caminhos
      enhancedState.subscribe('test.value1', mockCallback1);
      enhancedState.subscribe('test.value2', mockCallback2);
      
      // Alterar apenas um valor
      enhancedState.set('test.value1', 123);
      
      // Verificar se apenas o callback correto foi chamado
      expect(mockCallback1).toHaveBeenCalledTimes(1);
      expect(mockCallback2).not.toHaveBeenCalled();
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
      enhancedState.addMiddleware(testMiddleware);
      
      // Definir um valor que será modificado pelo middleware
      enhancedState.set('test.value', 10);
      
      // Verificar se o middleware foi chamado
      expect(testMiddleware).toHaveBeenCalled();
      
      // Verificar se o valor foi modificado pelo middleware
      expect(enhancedState.get('test.value')).toBe(20);
    });
  });

  // Testes para histórico (undo/redo)
  describe('Histórico (undo/redo)', () => {
    test('deve salvar ações no histórico', () => {
      // Configurar para salvar histórico
      enhancedState.enableHistory();
      
      // Executar algumas ações
      enhancedState.set('test.counter', 1);
      enhancedState.set('test.counter', 2);
      enhancedState.set('test.counter', 3);
      
      // Verificar se as ações foram salvas no histórico
      expect(enhancedState._history.length).toBe(3);
    });

    test('deve desfazer a última ação', () => {
      // Configurar para salvar histórico
      enhancedState.enableHistory();
      
      // Executar algumas ações
      enhancedState.set('test.counter', 1);
      enhancedState.set('test.counter', 2);
      enhancedState.set('test.counter', 3);
      
      // Desfazer a última ação
      enhancedState.undo();
      
      // Verificar se o valor voltou ao estado anterior
      expect(enhancedState.get('test.counter')).toBe(2);
    });

    test('deve refazer uma ação desfeita', () => {
      // Configurar para salvar histórico
      enhancedState.enableHistory();
      
      // Executar algumas ações
      enhancedState.set('test.counter', 1);
      enhancedState.set('test.counter', 2);
      enhancedState.set('test.counter', 3);
      
      // Desfazer a última ação
      enhancedState.undo();
      
      // Refazer a ação
      enhancedState.redo();
      
      // Verificar se o valor voltou ao estado anterior ao desfazer
      expect(enhancedState.get('test.counter')).toBe(3);
    });
  });

  // Testes para persistência local
  describe('Persistência local', () => {
    test('deve persistir valores no localStorage', () => {
      // Configurar para persistir no localStorage
      enhancedState.set('app.persistence.keys', ['test.persisted']);
      
      // Definir um valor que deve ser persistido
      enhancedState.set('test.persisted', 'valor persistido');
      
      // Forçar a persistência
      enhancedState.persist();
      
      // Verificar se o valor foi salvo no localStorage
      const storedState = JSON.parse(localStorage.getItem('cloudfarm_state'));
      expect(storedState).toBeDefined();
      expect(storedState.test.persisted).toBe('valor persistido');
    });

    test('deve carregar valores do localStorage na inicialização', () => {
      // Preparar dados no localStorage
      localStorage.setItem('cloudfarm_state', JSON.stringify({
        test: {
          restored: 'valor restaurado'
        }
      }));
      
      // Inicializar o estado, que deve carregar do localStorage
      enhancedState.initialize();
      
      // Verificar se o valor foi carregado
      expect(enhancedState.get('test.restored')).toBe('valor restaurado');
    });
  });

  // Testes para sincronização com o servidor
  describe('Sincronização com o servidor', () => {
    test('deve enviar o estado para o servidor', async () => {
      // Configurar mock para fetch
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true })
      });
      
      // Definir alguns valores
      enhancedState.set('user.name', 'João');
      enhancedState.set('user.email', 'joao@exemplo.com');
      
      // Sincronizar com o servidor
      await enhancedState.syncWithServer();
      
      // Verificar se a API foi chamada corretamente
      expect(global.fetch).toHaveBeenCalledWith('/api/state', expect.objectContaining({
        method: 'POST',
        headers: expect.any(Object),
        body: expect.stringContaining('João')
      }));
    });

    test('deve carregar o estado do servidor', async () => {
      // Configurar mock para fetch
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          user: {
            name: 'Maria',
            email: 'maria@exemplo.com'
          }
        })
      });
      
      // Carregar do servidor
      await enhancedState.loadFromServer();
      
      // Verificar se os valores foram carregados
      expect(enhancedState.get('user.name')).toBe('Maria');
      expect(enhancedState.get('user.email')).toBe('maria@exemplo.com');
    });
  });
});
