/**
 * moduleManager.js - Gerenciador dos módulos interativos da fazenda
 * 
 * Controla a exibição e interação dos popups de cada módulo,
 * como Posto de Combustível, Armazém de Grãos, etc.
 */

// Importar dependências
import { appState } from '../utils/appState.js';

const moduleManager = (() => {
    // Mapeamento de módulos e seus elementos DOM
    const moduleConfig = {
        fuel: {
            icon: '.fuel-station',
            popup: '#fuel-info-popup',
            closeBtn: '#fuel-info-close',
            pageName: '#fuel-module-page',
            pageBackBtn: '#fuel-module-back',
            tabs: {
                container: '.fuel-info-tabs',
                tabSelector: '.fuel-tab',
                contentSelector: '.fuel-tab-content'
            }
        },
        grain: {
            icon: '.grain-storage',
            popup: '#grain-storage-popup',
            closeBtn: '#grain-storage-close',
            tabs: {
                container: '.grain-storage-tabs',
                tabSelector: '.grain-tab',
                contentSelector: '.grain-tab-content'
            }
        },
        office: {
            icon: '.office',
            popup: '#office-popup',
            closeBtn: '#office-close'
        },
        cattle: {
            icon: '.cattle',
            popup: '#cattle-popup',
            closeBtn: '#cattle-close'
        },
        inventory: {
            icon: '.inventory',
            popup: '#inventory-popup',
            closeBtn: '#inventory-close'
        },
        fields: {
            icon: '.fields',
            popup: '#fields-popup',
            closeBtn: '#fields-close'
        },
        machines: {
            icon: '.machines',
            popup: '#machines-popup',
            closeBtn: '#machines-close'
        },
        biologicals: {
            icon: '.biologicals',
            popup: '#biologicals-popup',
            closeBtn: '#biologicals-close'
        },
        rainfall: {
            icon: '.rainfall',
            popup: '#rainfall-popup',
            closeBtn: '#rainfall-close'
        },
        monitoring: {
            icon: '.monitoring',
            popup: '#monitoring-popup',
            closeBtn: '#monitoring-close'
        }
    };
    
    // Abre um popup específico
    const _openPopup = (moduleKey) => {
        const config = moduleConfig[moduleKey];
        if (!config || !document.querySelector(config.popup)) {
            console.warn(`Popup para o módulo '${moduleKey}' não encontrado.`);
            return;
        }
        
        // Fechar outros popups que possam estar abertos
        Object.keys(moduleConfig).forEach(key => {
            if (key !== moduleKey && document.querySelector(moduleConfig[key].popup)) {
                document.querySelector(moduleConfig[key].popup).classList.remove('active');
            }
        });
        
        // Abrir o popup desejado
        document.querySelector(config.popup).classList.add('active');
        
        // Atualizar o estado da aplicação
        appState.set('activeModule', moduleKey);
        
        console.log(`Popup do módulo '${moduleKey}' aberto.`);
    };
    
    // Fecha um popup específico
    const _closePopup = (moduleKey) => {
        const config = moduleConfig[moduleKey];
        if (!config || !document.querySelector(config.popup)) return;
        
        document.querySelector(config.popup).classList.remove('active');
        
        // Limpar o estado se este era o módulo ativo
        if (appState.get('activeModule') === moduleKey) {
            appState.set('activeModule', null);
        }
        
        console.log(`Popup do módulo '${moduleKey}' fechado.`);
    };
    
    // Inicializa os eventos de clique nas abas
    const _initTabEvents = (moduleKey) => {
        const config = moduleConfig[moduleKey];
        if (!config || !config.tabs) return;
        
        const tabContainer = document.querySelector(config.tabs.container);
        if (!tabContainer) return;
        
        // Adicionar eventos de clique às abas
        const tabs = tabContainer.querySelectorAll(config.tabs.tabSelector);
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                // Remover classe 'active' de todas as abas
                tabs.forEach(t => t.classList.remove('active'));
                
                // Adicionar classe 'active' à aba clicada
                tab.classList.add('active');
                
                // Atualizar conteúdo visível
                const tabId = tab.getAttribute('data-tab');
                const contents = document.querySelectorAll(config.tabs.contentSelector);
                
                contents.forEach(content => {
                    const contentId = content.id || content.getAttribute('data-tab-id');
                    if (contentId === tabId || content.id === `${moduleKey}-${tabId}`) {
                        content.classList.add('active');
                    } else {
                        content.classList.remove('active');
                    }
                });
                
                console.log(`Aba '${tabId}' do módulo '${moduleKey}' ativada.`);
            });
        });
    };
    
    // Inicializa as interações específicas do módulo de combustível
    const _initFuelModuleInteractions = () => {
        // Configuração para a página específica do módulo de combustível
        const fuelModule = moduleConfig.fuel;
        const fuelPage = document.querySelector(fuelModule.pageName);
        
        if (!fuelPage) return;
        
        // Eventos para alternar entre as abas do visor da bomba
        const displayTabs = fuelPage.querySelectorAll('.fuel-display-tab');
        const displayContents = fuelPage.querySelectorAll('.fuel-display-content');
        
        displayTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                // Remover classe 'active' de todas as abas
                displayTabs.forEach(t => t.classList.remove('active'));
                
                // Adicionar classe 'active' à aba clicada
                tab.classList.add('active');
                
                // Atualizar conteúdo visível
                const tabId = tab.getAttribute('data-tab');
                displayContents.forEach(content => {
                    if (content.id === `fuel-${tabId}-display`) {
                        content.style.display = 'block';
                    } else {
                        content.style.display = 'none';
                    }
                });
            });
        });
        
        // Botão de voltar para fechar a página específica
        const backButton = document.querySelector(fuelModule.pageBackBtn);
        if (backButton) {
            backButton.addEventListener('click', () => {
                fuelPage.style.display = 'none';
            });
        }
    };
    
    return {
        /**
         * Inicializa o gerenciador de módulos
         */
        initialize() {
            // Configurar eventos de clique para os ícones
            Object.keys(moduleConfig).forEach(moduleKey => {
                const config = moduleConfig[moduleKey];
                const iconElement = document.querySelector(config.icon);
                
                if (iconElement) {
                    iconElement.addEventListener('click', (e) => {
                        e.stopPropagation();
                        
                        // Não abrir popups se o modo de posicionamento estiver ativo
                        if (appState.get('positioningActive')) return;
                        
                        // Abrir o popup correspondente
                        _openPopup(moduleKey);
                    });
                }
                
                // Configurar evento para o botão de fechar
                const closeButton = document.querySelector(config.closeBtn);
                if (closeButton) {
                    closeButton.addEventListener('click', () => {
                        _closePopup(moduleKey);
                    });
                }
                
                // Inicializar eventos das abas, se existirem
                _initTabEvents(moduleKey);
            });
            
            // Inicializar interações específicas do módulo de combustível
            _initFuelModuleInteractions();
            
            console.log('Gerenciador de módulos inicializado');
        },
        
        /**
         * Abre o popup de um módulo específico
         * 
         * @param {string} moduleKey - Chave do módulo
         */
        openModule(moduleKey) {
            if (moduleConfig[moduleKey]) {
                _openPopup(moduleKey);
            } else {
                console.error(`Módulo '${moduleKey}' não encontrado.`);
            }
        },
        
        /**
         * Fecha o popup de um módulo específico
         * 
         * @param {string} moduleKey - Chave do módulo
         */
        closeModule(moduleKey) {
            if (moduleConfig[moduleKey]) {
                _closePopup(moduleKey);
            }
        },
        
        /**
         * Fecha todos os popups de módulos
         */
        closeAllModules() {
            Object.keys(moduleConfig).forEach(key => {
                _closePopup(key);
            });
        },
        
        /**
         * Verifica se um módulo específico está aberto
         * 
         * @param {string} moduleKey - Chave do módulo
         * @returns {boolean} - true se o módulo estiver aberto
         */
        isModuleOpen(moduleKey) {
            const config = moduleConfig[moduleKey];
            if (!config || !document.querySelector(config.popup)) return false;
            
            return document.querySelector(config.popup).classList.contains('active');
        }
    };
})();

// Exportar usando ES modules para compatibilidade com Vite
export { moduleManager };
