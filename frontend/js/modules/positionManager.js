/**
 * positionManager.js - Gerenciador de posição dos ícones da fazenda
 * 
 * Controla o posicionamento dos ícones na interface da fazenda e
 * permite ajustes com salvamento persistente para desktop e mobile.
 */

// Importar dependências
import { appState } from '../utils/appState.js';

const positionManager = (() => {
    // Mapeamento de ícones e seus elementos DOM
    const iconSelectors = {
        fuel: '.fuel-station',
        grain: '.grain-storage',
        office: '.office',
        cattle: '.cattle',
        inventory: '.inventory',
        fields: '.fields',
        machines: '.machines',
        biologicals: '.biologicals',
        rainfall: '.rainfall',
        monitoring: '.monitoring'
    };
    
    // Posições padrão para quando não houver dados salvos
    const defaultPositions = {
        desktop: {
            fuel: { top: 476, left: 1559 },
            grain: { top: 385, left: 1058 },
            office: { top: 240, left: 950 },
            cattle: { top: 500, left: 750 },
            inventory: { top: 320, left: 650 },
            fields: { top: 450, left: 450 },
            machines: { top: 550, left: 250 },
            biologicals: { top: 300, left: 350 },
            rainfall: { top: 180, left: 550 },
            monitoring: { top: 550, left: 1250 }
        },
        mobile: {
            fuel: { top: 250, left: 270 },
            grain: { top: 200, left: 180 },
            office: { top: 150, left: 100 },
            cattle: { top: 250, left: 100 },
            inventory: { top: 150, left: 270 },
            fields: { top: 300, left: 180 },
            machines: { top: 350, left: 100 },
            biologicals: { top: 300, left: 270 },
            rainfall: { top: 100, left: 180 },
            monitoring: { top: 350, left: 270 }
        }
    };
    
    // Verifica se o elemento DOM de um ícone existe
    const _iconExists = (iconKey) => {
        return !!document.querySelector(iconSelectors[iconKey]);
    };
    
    // Atualiza a posição visual de um ícone na tela
    const _updateIconPosition = (iconKey, position) => {
        const element = document.querySelector(iconSelectors[iconKey]);
        if (!element) {
            console.warn(`Elemento para o ícone '${iconKey}' não encontrado.`);
            return;
        }
        
        element.style.top = `${position.top}px`;
        element.style.left = `${position.left}px`;
        
        // Atualizar o estado da aplicação
        appState.set(`icons.${iconKey}`, position);
    };
    
    // Atualiza o texto de informação de posição no painel de controle
    const _updatePositionInfo = () => {
        Object.keys(iconSelectors).forEach(iconKey => {
            if (!_iconExists(iconKey)) return;
            
            const element = document.querySelector(iconSelectors[iconKey]);
            const positionText = document.querySelector(`#${iconKey}-position-info`);
            
            if (positionText && element) {
                const top = parseFloat(getComputedStyle(element).top);
                const left = parseFloat(getComputedStyle(element).left);
                positionText.textContent = `Top: ${Math.round(top)}px, Left: ${Math.round(left)}px`;
            }
        });
    };
    
    return {
        /**
         * Inicializa o gerenciador de posicionamento
         */
        initialize() {
            // Configurar evento para o botão de toggle do painel de controle
            const toggleButton = document.querySelector('.position-toggle');
            const positionControls = document.getElementById('position-controls');
            
            if (toggleButton && positionControls) {
                toggleButton.addEventListener('click', () => {
                    const isVisible = positionControls.style.display === 'block';
                    positionControls.style.display = isVisible ? 'none' : 'block';
                    appState.set('positioningActive', !isVisible);
                    
                    // Atualizar informações de posição quando o painel é aberto
                    if (!isVisible) {
                        _updatePositionInfo();
                    }
                });
            }
            
            // Configurar eventos para os botões de fechar e salvar
            const closeButton = document.querySelector('#position-controls .position-close');
            if (closeButton) {
                closeButton.addEventListener('click', () => {
                    positionControls.style.display = 'none';
                    appState.set('positioningActive', false);
                });
            }
            
            const saveAllButton = document.querySelector('.save-all-positions-btn');
            if (saveAllButton) {
                saveAllButton.addEventListener('click', this.saveAllPositions);
            }
            
            // Detectar tipo de dispositivo e carregar posições adequadas
            const deviceMode = window.detectDeviceType();
            this.loadPositions(deviceMode);
            
            console.log('Gerenciador de posição inicializado');
        },
        
        /**
         * Carrega as posições salvas do servidor para um modo específico (desktop/mobile)
         * 
         * @param {string} mode - Modo do dispositivo ('desktop' ou 'mobile')
         */
        loadPositions(mode) {
            const apiUrl = `/api/load-positions/${mode}`;
            
            fetch(apiUrl)
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        console.log(`Posições carregadas com sucesso para modo ${mode}`);
                        
                        // Aplicar as posições aos ícones
                        const positions = data.positions || {};
                        
                        Object.keys(iconSelectors).forEach(iconKey => {
                            if (_iconExists(iconKey)) {
                                const position = positions[iconKey] || defaultPositions[mode][iconKey];
                                _updateIconPosition(iconKey, position);
                            }
                        });
                        
                        // Atualizar informações no painel se estiver visível
                        if (document.getElementById('position-controls').style.display === 'block') {
                            _updatePositionInfo();
                        }
                    } else {
                        console.warn(`Falha ao carregar posições: ${data.error}`);
                        // Usar posições padrão em caso de falha
                        this.applyDefaultPositions(mode);
                    }
                })
                .catch(error => {
                    console.error('Erro ao carregar posições:', error);
                    // Usar posições padrão em caso de erro
                    this.applyDefaultPositions(mode);
                });
        },
        
        /**
         * Aplica as posições padrão aos ícones
         * 
         * @param {string} mode - Modo do dispositivo ('desktop' ou 'mobile')
         */
        applyDefaultPositions(mode) {
            console.log(`Aplicando posições padrão para modo ${mode}`);
            
            Object.keys(iconSelectors).forEach(iconKey => {
                if (_iconExists(iconKey) && defaultPositions[mode][iconKey]) {
                    _updateIconPosition(iconKey, defaultPositions[mode][iconKey]);
                }
            });
            
            // Atualizar informações no painel se estiver visível
            if (document.getElementById('position-controls').style.display === 'block') {
                _updatePositionInfo();
            }
        },
        
        /**
         * Salva todas as posições atuais no servidor
         */
        saveAllPositions() {
            const deviceMode = appState.get('deviceMode');
            const positions = {};
            
            // Coletar posições atuais de todos os ícones
            Object.keys(iconSelectors).forEach(iconKey => {
                if (_iconExists(iconKey)) {
                    const element = document.querySelector(iconSelectors[iconKey]);
                    positions[iconKey] = {
                        top: parseFloat(getComputedStyle(element).top),
                        left: parseFloat(getComputedStyle(element).left)
                    };
                }
            });
            
            // Enviar ao servidor
            fetch('/api/save-positions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    deviceMode,
                    positions
                })
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    alert(`Posições salvas com sucesso para modo ${deviceMode}!`);
                    console.log(`Posições salvas com sucesso para modo ${deviceMode}`);
                } else {
                    alert(`Erro ao salvar posições: ${data.error}`);
                    console.error(`Erro ao salvar posições: ${data.error}`);
                }
            })
            .catch(error => {
                alert(`Erro ao salvar posições: ${error.message}`);
                console.error('Erro ao salvar posições:', error);
            });
        },
        
        /**
         * Move um ícone específico na direção indicada
         * 
         * @param {string} iconKey - Chave do ícone a mover
         * @param {string} direction - Direção ('up', 'down', 'left', 'right')
         * @param {number} pixels - Quantidade de pixels para mover (padrão: 10)
         */
        moveIcon(iconKey, direction, pixels = 10) {
            if (!_iconExists(iconKey)) return;
            
            const element = document.querySelector(iconSelectors[iconKey]);
            const currentTop = parseFloat(getComputedStyle(element).top);
            const currentLeft = parseFloat(getComputedStyle(element).left);
            
            let newTop = currentTop;
            let newLeft = currentLeft;
            
            switch (direction) {
                case 'up':
                    newTop = currentTop - pixels;
                    break;
                case 'down':
                    newTop = currentTop + pixels;
                    break;
                case 'left':
                    newLeft = currentLeft - pixels;
                    break;
                case 'right':
                    newLeft = currentLeft + pixels;
                    break;
            }
            
            // Atualizar posição
            _updateIconPosition(iconKey, { top: newTop, left: newLeft });
            
            // Atualizar informações no painel
            _updatePositionInfo();
        },
        
        /**
         * Salva a posição de um ícone específico no servidor
         * 
         * @param {string} iconKey - Chave do ícone
         */
        saveIconPosition(iconKey) {
            if (!_iconExists(iconKey)) return;
            
            const deviceMode = appState.get('deviceMode');
            const element = document.querySelector(iconSelectors[iconKey]);
            
            const position = {
                top: parseFloat(getComputedStyle(element).top),
                left: parseFloat(getComputedStyle(element).left)
            };
            
            // Enviar ao servidor
            fetch('/api/save-icon-position', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    iconType: iconKey,
                    deviceMode,
                    position
                })
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    alert(`Posição do ícone ${iconKey} salva com sucesso!`);
                    console.log(`Posição do ícone ${iconKey} salva:`, position);
                } else {
                    alert(`Erro ao salvar posição do ícone ${iconKey}: ${data.error}`);
                    console.error(`Erro ao salvar posição do ícone ${iconKey}:`, data.error);
                }
            })
            .catch(error => {
                alert(`Erro ao salvar posição: ${error.message}`);
                console.error('Erro ao salvar posição:', error);
            });
        },
        
        /**
         * Função de utilidade para atualizar as informações de posição no painel
         */
        updatePositionInfo: _updatePositionInfo
    };
})();

// Exportar usando ES modules para compatibilidade com Vite
export { positionManager };
