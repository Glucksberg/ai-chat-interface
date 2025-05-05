/**
 * serviceWorkerRegistration.js - Registro do Service Worker
 * 
 * Gerencia o registro e atualização do Service Worker,
 * possibilitando funcionalidade offline e cache eficiente.
 */

// Verificar se Service Workers são suportados
export const registerServiceWorker = () => {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then(registration => {
          console.log('Service Worker registrado com sucesso:', registration.scope);
          
          // Verificar atualizações periódicas (a cada 1 hora)
          setInterval(() => {
            registration.update();
            console.log('Verificando atualizações do Service Worker...');
          }, 3600000); // 1 hora em milissegundos
        })
        .catch(error => {
          console.error('Erro ao registrar Service Worker:', error);
        });
    });
    
    // Notificar usuário quando há uma nova versão disponível
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!refreshing) {
        refreshing = true;
        console.log('Nova versão disponível! Atualizando...');
        window.location.reload();
      }
    });
  } else {
    console.log('Service Workers não são suportados neste navegador.');
  }
};
