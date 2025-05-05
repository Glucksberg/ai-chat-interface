/**
 * Testes para o middleware de posição dos ícones
 */

import { iconPositionMiddleware } from '../../../frontend/js/middlewares/iconPositionMiddleware.js';

describe('IconPositionMiddleware', () => {
  // Estado inicial para os testes
  const mockState = {
    deviceMode: 'desktop',
    icons: {
      fuel: { top: 100, left: 200 },
      grain: { top: 300, left: 400 }
    }
  };

  test('deve permitir posições válidas para desktop', () => {
    // Criar uma ação válida para o modo desktop
    const action = {
      key: 'icons.fuel.top',
      value: 500,
      timestamp: Date.now()
    };

    // Executar o middleware
    const result = iconPositionMiddleware(mockState, action);

    // Verificar se a ação não foi modificada
    expect(result.value).toBe(500);
  });

  test('deve limitar posições muito grandes para desktop', () => {
    // Criar uma ação com valor muito grande
    const action = {
      key: 'icons.fuel.top',
      value: 2000, // Muito grande, deve ser limitado
      timestamp: Date.now()
    };

    // Executar o middleware
    const result = iconPositionMiddleware(mockState, action);

    // Verificar se o valor foi limitado
    expect(result.value).toBe(900); // Limitado conforme a implementação
  });

  test('deve limitar posições muito pequenas para desktop', () => {
    // Criar uma ação com valor muito pequeno
    const action = {
      key: 'icons.fuel.left',
      value: -50, // Muito pequeno, deve ser limitado
      timestamp: Date.now()
    };

    // Executar o middleware
    const result = iconPositionMiddleware(mockState, action);

    // Verificar se o valor foi limitado
    expect(result.value).toBe(10); // Limitado conforme a implementação
  });

  test('deve aplicar limites diferentes para o modo mobile', () => {
    // Estado para o modo mobile
    const mobileState = {
      ...mockState,
      deviceMode: 'mobile'
    };

    // Criar uma ação para o modo mobile
    const action = {
      key: 'icons.fuel.left',
      value: 600, // Muito grande para mobile
      timestamp: Date.now()
    };

    // Executar o middleware
    const result = iconPositionMiddleware(mobileState, action);

    // Verificar se o valor foi limitado conforme as regras para mobile
    expect(result.value).toBe(300); // Limitado conforme a implementação para mobile
  });

  test('deve ignorar chaves que não estão relacionadas a posições de ícones', () => {
    // Criar uma ação para uma chave não relacionada
    const action = {
      key: 'user.preferences.theme',
      value: 'dark',
      timestamp: Date.now()
    };

    // Executar o middleware
    const result = iconPositionMiddleware(mockState, action);

    // Verificar se a ação não foi modificada
    expect(result).toEqual(action);
  });

  test('deve manipular corretamente propriedades "top"', () => {
    // Criar uma ação para a propriedade top
    const action = {
      key: 'icons.grain.top',
      value: 700,
      timestamp: Date.now()
    };

    // Executar o middleware
    const result = iconPositionMiddleware(mockState, action);

    // Verificar se a propriedade foi processada corretamente
    expect(result.value).toBe(700);
  });

  test('deve manipular corretamente propriedades "left"', () => {
    // Criar uma ação para a propriedade left
    const action = {
      key: 'icons.grain.left',
      value: 1000,
      timestamp: Date.now()
    };

    // Executar o middleware
    const result = iconPositionMiddleware(mockState, action);

    // Verificar se a propriedade foi processada corretamente
    expect(result.value).toBe(1000);
  });
});
