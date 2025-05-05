/**
 * uiManager.js - Gerenciador de interface do usuário
 * 
 * Responsável por configurar interações gerais da UI,
 * como menu móvel, eventos globais e elementos da interface.
 */

// Importar dependências
import { appState } from '../utils/appState.js';
import { chatManager } from './chatManager.js';
import { moduleManager } from './moduleManager.js';

const uiManager = (() => {
    // Configurações do menu móvel
    let menuOpen = false;
    
    // Alternar o menu móvel
    const _toggleMobileMenu = () => {
        const navMenu = document.querySelector('.nav-menu');
        const menuBtn = document.querySelector('.mobile-menu-btn');
        
        if (!navMenu || !menuBtn) return;
        
        menuOpen = !menuOpen;
        navMenu.classList.toggle('active', menuOpen);
        
        // Atualizar ícone do botão
        if (menuOpen) {
            menuBtn.innerHTML = '<i class="fas fa-times"></i>';
        } else {
            menuBtn.innerHTML = '<i class="fas fa-bars"></i>';
        }
    };
    
    // Fechar o menu móvel quando uma opção é selecionada
    const _setupMenuItemClickHandlers = () => {
        const menuItems = document.querySelectorAll('.nav-menu a');
        
        menuItems.forEach(item => {
            item.addEventListener('click', () => {
                if (window.innerWidth <= 992 && menuOpen) {
                    _toggleMobileMenu();
                }
            });
        });
    };
    
    // Configurar eventos para links de navegação ativos
    const _setupActiveNavLinks = () => {
        const navLinks = document.querySelectorAll('.nav-menu a');
        const currentPath = window.location.pathname;
        
        navLinks.forEach(link => {
            const href = link.getAttribute('href');
            
            // Definir link atual como ativo
            if (href === currentPath || 
                (currentPath === '/' && href === 'index.html') ||
                (href !== '/' && href !== 'index.html' && currentPath.includes(href))) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
            
            // Eventos de clique para links internos
            if (href.startsWith('#')) {
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    const targetId = href.substring(1);
                    const targetElement = document.getElementById(targetId);
                    
                    if (targetElement) {
                        // Rolar suavemente até o elemento
                        targetElement.scrollIntoView({ behavior: 'smooth' });
                        
                        // Atualizar URL sem recarregar a página
                        history.pushState(null, null, href);
                    }
                });
            }
        });
    };
    
    // Configurar botão do chat
    const _setupChatButton = () => {
        const chatButton = document.querySelector('.chat-button');
        const chatIcon = document.querySelector('.chat-icon');
        
        if (chatButton && chatIcon) {
            // Configurar efeito de hover
            chatButton.addEventListener('mouseenter', () => {
                chatIcon.classList.add('bounce');
            });
            
            chatButton.addEventListener('mouseleave', () => {
                chatIcon.classList.remove('bounce');
            });
            
            // Configurar evento de clique
            chatButton.addEventListener('click', () => {
                chatManager.openChat();
            });
        }
    };
    
    // Configurar interação de fechamento de popups ao clicar fora
    const _setupOutsideClickHandlers = () => {
        document.addEventListener('click', (e) => {
            // Se clicar fora de um popup ativo, fechá-lo
            const activeModule = appState.get('activeModule');
            
            if (activeModule) {
                const config = moduleManager.getModuleConfig(activeModule);
                const popup = document.querySelector(config.popup);
                
                // Verificar se o clique foi fora do popup
                if (popup && !popup.contains(e.target) && 
                    !document.querySelector(config.icon).contains(e.target)) {
                    moduleManager.closeModule(activeModule);
                }
            }
        });
    };
    
    // Configurar evento para redimensionamento da janela
    const _setupResizeHandlers = () => {
        window.addEventListener('resize', () => {
            // Fechar menu móvel se a janela for redimensionada para desktop
            if (window.innerWidth > 992 && menuOpen) {
                _toggleMobileMenu();
            }
        });
    };
    
    // Configurar atalhos de teclado
    const _setupKeyboardShortcuts = () => {
        document.addEventListener('keydown', (e) => {
            // Tecla Escape para fechar popups ativos
            if (e.key === 'Escape') {
                // Fechar o chat se estiver aberto
                if (appState.get('chatVisible')) {
                    chatManager.closeChat();
                } 
                // Fechar módulo ativo se houver
                else if (appState.get('activeModule')) {
                    moduleManager.closeModule(appState.get('activeModule'));
                }
            }
            
            // Tecla P para alternar o painel de posicionamento
            if (e.key === 'p' && !appState.get('chatVisible') && !appState.get('activeModule')) {
                const positionControls = document.getElementById('position-controls');
                const isVisible = positionControls.style.display === 'block';
                positionControls.style.display = isVisible ? 'none' : 'block';
                appState.set('positioningActive', !isVisible);
                
                if (!isVisible) {
                    positionManager.updatePositionInfo();
                }
            }
        });
    };
    
    return {
        /**
         * Inicializa o gerenciador de UI
         */
        initialize() {
            // Configurar botão do menu móvel
            const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
            if (mobileMenuBtn) {
                mobileMenuBtn.addEventListener('click', _toggleMobileMenu);
            }
            
            // Configurar handlers para itens do menu
            _setupMenuItemClickHandlers();
            
            // Configurar links de navegação ativos
            _setupActiveNavLinks();
            
            // Configurar botão do chat
            _setupChatButton();
            
            // Configurar handlers para cliques fora de popups
            _setupOutsideClickHandlers();
            
            // Configurar handlers para redimensionamento
            _setupResizeHandlers();
            
            // Configurar atalhos de teclado
            _setupKeyboardShortcuts();
            
            console.log('Gerenciador de UI inicializado');
        },
        
        /**
         * Alterna a visibilidade do menu móvel
         */
        toggleMobileMenu: _toggleMobileMenu,
        
        /**
         * Atualiza os links de navegação ativos
         */
        updateActiveNavLinks: _setupActiveNavLinks
    };
})();

// Exportar usando ES modules para compatibilidade com Vite
export { uiManager };
