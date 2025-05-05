/**
 * Testes de integração para a sincronização do estado com a API
 */

import { enhancedState } from '../../../frontend/js/utils/enhancedState.js';

// Mock para o módulo fetch
global.fetch = jest.fn();

describe('Sincronização de Estado com a API', () => {
  // Configurar mocks e limpar estado antes de cada teste
  beforeEach(() => {
    // Limpar o mock do fetch
    global.fetch.mockClear();
    
    // Resetar o estado para teste
    enhancedState._state = {};
    enhancedState._listeners = {};
    enhancedState._middlewares = [];
  });

  test('deve carregar o estado inicial do servidor durante a inicialização', async () => {
    // Configurar resposta simulada da API
    const mockServerState = {
      icons: {
        fuel: { top: 100, left: 200 },
        grain: { top: 300, left: 400 }
      },
      chatHistory: [
        { sender: 'user', text: 'Olá!' },
        { sender: 'assistant', text: 'Como posso ajudar?' }
      ]
    };
    
    // Mock da resposta da API
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockServerState)
    });
    
    // Chamar a função de carregamento do servidor
    await enhancedState.loadFromServer();
    
    // Verificar se a API foi chamada corretamente
    expect(global.fetch).toHaveBeenCalledWith('/api/state', expect.any(Object));
    
    // Verificar se o estado foi atualizado com os dados do servidor
    expect(enhancedState.get('icons.fuel.top')).toBe(100);
    expect(enhancedState.get('icons.grain.left')).toBe(400);
    expect(enhancedState.get('chatHistory').length).toBe(2);
  });

  test('deve salvar o estado atual no servidor', async () => {
    // Configurar estado inicial
    enhancedState._state = {
      icons: {
        fuel: { top: 150, left: 250 },
        grain: { top: 350, left: 450 }
      },
      user: {
        preferences: {
          theme: 'dark'
        }
      }
    };
    
    // Mock da resposta da API
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true })
    });
    
    // Chamar a função de sincronização com o servidor
    await enhancedState.syncWithServer();
    
    // Verificar se a API foi chamada corretamente
    expect(global.fetch).toHaveBeenCalledWith('/api/state', expect.objectContaining({
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: expect.any(String)
    }));
    
    // Verificar se o corpo da requisição contém os dados esperados
    const requestBody = JSON.parse(global.fetch.mock.calls[0][1].body);
    expect(requestBody.state).toEqual(enhancedState._state);
  });

  test('deve atualizar apenas um caminho específico no servidor', async () => {
    // Configurar estado inicial
    enhancedState._state = {
      icons: {
        fuel: { top: 150, left: 250 }
      }
    };
    
    // Mock da resposta da API
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true })
    });
    
    // Chamar a função de atualização de caminho específico
    await enhancedState.updateServerPath('icons.fuel.top', 200);
    
    // Verificar se a API foi chamada corretamente
    expect(global.fetch).toHaveBeenCalledWith('/api/state/icons.fuel.top', expect.objectContaining({
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: expect.stringContaining('200')
    }));
  });

  test('deve lidar com erros da API durante o carregamento', async () => {
    // Mock de erro da API
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Erro interno do servidor'
    });
    
    // Espiar o console.error
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    
    // Tentar carregar do servidor deve capturar o erro
    await enhancedState.loadFromServer();
    
    // Verificar se o erro foi registrado
    expect(consoleErrorSpy).toHaveBeenCalled();
    
    // Restaurar console.error
    consoleErrorSpy.mockRestore();
  });

  test('deve resolver conflitos entre estado local e do servidor', async () => {
    // Configurar estado inicial local
    enhancedState._state = {
      icons: {
        fuel: { top: 150, left: 250, updated: Date.now() - 1000 } // Mais antigo
      },
      user: {
        preferences: {
          theme: 'dark',
          updated: Date.now() // Mais recente
        }
      }
    };
    
    // Mock do estado do servidor com timestamps diferentes
    const mockServerState = {
      icons: {
        fuel: { top: 200, left: 300, updated: Date.now() } // Mais recente
      },
      user: {
        preferences: {
          theme: 'light',
          updated: Date.now() - 2000 // Mais antigo
        }
      }
    };
    
    // Mock da resposta da API
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockServerState)
    });
    
    // Carregar e mesclar com o estado do servidor
    await enhancedState.loadFromServer(true); // true para mesclar
    
    // Verificar se o estado foi mesclado corretamente, com base nos timestamps
    expect(enhancedState.get('icons.fuel.top')).toBe(200); // Servidor é mais recente
    expect(enhancedState.get('user.preferences.theme')).toBe('dark'); // Local é mais recente
  });
});
