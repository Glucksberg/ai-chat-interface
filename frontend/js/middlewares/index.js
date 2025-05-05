/**
 * index.js - Agregador de middlewares do sistema de estado
 * 
 * Este arquivo centraliza todos os middlewares do sistema de estado,
 * permitindo fácil adição de novos middlewares no futuro.
 */

import { iconPositionMiddleware } from './iconPositionMiddleware.js';

// Lista de todos os middlewares disponíveis
export const middlewares = [
  // Middleware para logging (desenvolvimento)
  (state, action) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Estado] Alteração: ${action.key}`);
    }
    return action;
  },
  
  // Middleware para posicionamento de ícones
  iconPositionMiddleware,
  
  // Middleware para autenticação e permissões
  (state, action) => {
    // Apenas propriedades específicas exigem autenticação
    const authRequiredProps = ['userProfile', 'preferences'];
    
    if (authRequiredProps.some(prop => action.key.startsWith(prop + '.'))) {
      // Verificar se usuário está autenticado
      if (!state.auth || !state.auth.isAuthenticated) {
        console.warn(`Tentativa de alterar ${action.key} sem autenticação`);
        // Não bloquear em ambiente de desenvolvimento
        if (process.env.NODE_ENV !== 'development') {
          // Anular a operação retornando o valor antigo
          action.value = action.oldValue;
        }
      }
    }
    
    return action;
  }
];
