// main.js - Arquivo principal que carrega todos os módulos

// Importar os módulos necessários
import { appState } from './utils/appState.js';
import { enhancedState } from './utils/enhancedState.js';
import { middlewares } from './middlewares/index.js';
import { themeManager } from './utils/themeManager.js';
import { positionManager } from './modules/positionManager.js';
import { moduleManager } from './modules/moduleManager.js';
import { chatManager } from './modules/chatManager.js';
import { uiManager } from './modules/uiManager.js';
import { loadComponents } from './utils/componentLoader.js';
import { registerServiceWorker } from './utils/serviceWorkerRegistration.js';

// Importar todos os módulos quando o DOM estiver completamente carregado
document.addEventListener('DOMContentLoaded', async () => {
    // Carregar os componentes HTML
    await loadComponents([
        { path: './components/position-controls.html', target: '#position-controls-component' },
        { path: './components/fuel-popup.html', target: '#fuel-popup-component' },
        { path: './components/grain-popup.html', target: '#grain-popup-component' },
        { path: './components/office-popup.html', target: '#office-popup-component' },
        { path: './components/cattle-popup.html', target: '#cattle-popup-component' },
        { path: './components/chat.html', target: '#chat-component' }
    ]);
    
    // Configurar e inicializar o estado aprimorado
    // Adicionar todos os middlewares
    middlewares.forEach(middleware => {
        enhancedState.addMiddleware(middleware);
    });
    
    // Inicializar o gerenciador de estado aprimorado
    // e integrar com o appState existente para retrocompatibilidade
    const initialState = enhancedState.initialize();
    
    // Criar um proxy para substituir gradualmente o appState
    // Este proxy permitirá a migração suave dos módulos existentes
    const appStateProxy = {
        ...appState,
        get: (key) => enhancedState.get(key),
        set: (key, value) => enhancedState.set(key, value),
        subscribe: (key, callback) => enhancedState.subscribe(key, callback)
    };
    
    // Substituir métodos do appState para usar o enhancedState
    Object.defineProperty(window, 'appState', {
        value: appStateProxy,
        writable: false,
        configurable: true
    });
    
    // Para compatibilidade com módulos existentes, inicializar o appState antigo
    appState.initialize();
    
    // Carregar a configuração inicial e definir o tema
    themeManager.initialize();
    
    // Inicializar o controle de posicionamento dos ícones
    positionManager.initialize();
    
    // Inicializar os popups e interações dos módulos
    moduleManager.initialize();
    
    // Inicializar o assistente de chat
    chatManager.initialize();
    
    // Inicializar os listeners para eventos da UI
    uiManager.initialize();
    
    console.log('CloudFarm.ai - Aplicação inicializada com sucesso!');
    
    // Registrar Service Worker para funcionalidade offline
    registerServiceWorker();
    
    // Iniciar sincronização do estado com o servidor
    syncStateWithServer();
});

/**
 * Sincroniza o estado atual com o servidor
 */
async function syncStateWithServer() {
    try {
        const response = await fetch('/api/state');
        
        if (!response.ok) {
            throw new Error(`Erro na sincronização: ${response.status}`);
        }
        
        const serverState = await response.json();
        
        // Se houver um estado no servidor, mesclamos com o estado local
        if (serverState && Object.keys(serverState).length > 0) {
            // Apenas atualizar propriedades que devem ser sincronizadas
            if (serverState.icons) {
                enhancedState.set('icons', serverState.icons);
            }
            
            if (serverState.chatHistory) {
                enhancedState.set('chatHistory', serverState.chatHistory);
            }
            
            console.log('Estado sincronizado com o servidor');
        }
    } catch (error) {
        console.error('Erro ao sincronizar estado com servidor:', error);
    }
}

// Detecção de tipo de dispositivo e definição do modo
window.detectDeviceType = () => {
    const isMobile = window.innerWidth <= 767;
    appState.set('deviceMode', isMobile ? 'mobile' : 'desktop');
    document.body.classList.toggle('mobile-view', isMobile);
    console.log(`Modo de dispositivo detectado: ${isMobile ? 'mobile' : 'desktop'}`);
    
    // Carregar as posições dos ícones com base no tipo de dispositivo
    positionManager.loadPositions(appState.get('deviceMode'));
    
    return isMobile ? 'mobile' : 'desktop';
};

// Adicionar evento de redimensionamento para ajustar o modo quando necessário
window.addEventListener('resize', () => {
    const currentMode = appState.get('deviceMode');
    const newMode = window.innerWidth <= 767 ? 'mobile' : 'desktop';
    
    if (currentMode !== newMode) {
        console.log(`Alterando modo de dispositivo: ${currentMode} -> ${newMode}`);
        appState.set('deviceMode', newMode);
        positionManager.loadPositions(newMode);
    }
});
