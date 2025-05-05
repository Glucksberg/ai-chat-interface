/**
 * iconPositionMiddleware.js - Middleware para gerenciar posições dos ícones
 * 
 * Este middleware intercepta e processa ações relacionadas às posições dos ícones,
 * validando e aplicando regras específicas para garantir posicionamento adequado.
 */

/**
 * Middleware para gerenciar posições dos ícones
 * 
 * @param {Object} state - Estado atual da aplicação
 * @param {Object} action - Ação a ser processada
 * @returns {Object} - Ação possivelmente modificada
 */
export const iconPositionMiddleware = (state, action) => {
  // Verificar se a ação está relacionada com posições de ícones
  if (action.key.startsWith('icons.') && 
      (action.key.endsWith('.top') || action.key.endsWith('.left'))) {
    
    // Extrair informações da chave
    const parts = action.key.split('.');
    const iconKey = parts[1]; // Nome do ícone (fuel, grain, etc.)
    const property = parts[2]; // Propriedade (top ou left)
    
    // Obter o modo do dispositivo atual
    const deviceMode = state.deviceMode || 'desktop';
    
    // Aplicar limites baseados no modo do dispositivo
    if (deviceMode === 'desktop') {
      // Limites para desktop
      if (property === 'top') {
        // Limite superior e inferior para posição vertical
        if (action.value < 10) action.value = 10;
        if (action.value > 900) action.value = 900;
      } else if (property === 'left') {
        // Limite esquerdo e direito para posição horizontal
        if (action.value < 10) action.value = 10;
        if (action.value > 1800) action.value = 1800;
      }
    } else if (deviceMode === 'mobile') {
      // Limites para dispositivos móveis (mais restritivos)
      if (property === 'top') {
        if (action.value < 10) action.value = 10;
        if (action.value > 500) action.value = 500;
      } else if (property === 'left') {
        if (action.value < 10) action.value = 10;
        if (action.value > 300) action.value = 300;
      }
    }
    
    // Registrar mudança de posição para depuração
    console.log(`Posição ajustada: ${iconKey}.${property} = ${action.value} (${deviceMode})`);
  }
  
  return action;
};
