// Este arquivo configura o ambiente de testes

// Mock do localStorage para testes
class LocalStorageMock {
  constructor() {
    this.store = {};
  }

  clear() {
    this.store = {};
  }

  getItem(key) {
    return this.store[key] || null;
  }

  setItem(key, value) {
    this.store[key] = String(value);
  }

  removeItem(key) {
    delete this.store[key];
  }
}

// Configurar localStorage global para o ambiente de teste
global.localStorage = new LocalStorageMock();

// Mock para fetch global
global.fetch = jest.fn(() => 
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(''),
    status: 200,
  })
);

// Adicionar matchadores personalizados ao Jest se necessário
expect.extend({
  // Exemplo de matchador personalizado
  toBeWithinRange(received, floor, ceiling) {
    const pass = received >= floor && received <= ceiling;
    if (pass) {
      return {
        message: () => `expected ${received} not to be within range ${floor} - ${ceiling}`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be within range ${floor} - ${ceiling}`,
        pass: false,
      };
    }
  },
});

// Limpar mocks depois de cada teste
afterEach(() => {
  jest.clearAllMocks();
});
