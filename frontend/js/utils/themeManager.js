/**
 * themeManager.js - Gerenciador de tema da aplicação
 * 
 * Controla a alternância entre os temas claro e escuro,
 * mantendo a consistência visual em toda a aplicação.
 */

// Importar dependências
import { appState } from './appState.js';

const themeManager = (() => {
    // Temas disponíveis
    const THEMES = {
        LIGHT: 'light',
        DARK: 'dark'
    };
    
    // Configuração do tema atual no DOM
    const _applyTheme = (theme) => {
        document.documentElement.setAttribute('data-theme', theme);
        
        // Atualizar ícones e cores específicas
        if (theme === THEMES.DARK) {
            document.querySelector('.theme-toggle i').classList.remove('fa-moon');
            document.querySelector('.theme-toggle i').classList.add('fa-sun');
        } else {
            document.querySelector('.theme-toggle i').classList.remove('fa-sun');
            document.querySelector('.theme-toggle i').classList.add('fa-moon');
        }
        
        // Salvar preferência no localStorage
        localStorage.setItem('cloudFarm_theme', theme);
        
        // Atualizar o estado da aplicação
        appState.set('currentTheme', theme);
    };
    
    return {
        // Constantes
        THEMES,
        
        /**
         * Inicializa o gerenciador de tema
         */
        initialize() {
            // Verificar preferência do usuário no localStorage
            const savedTheme = localStorage.getItem('cloudFarm_theme');
            
            // Definir tema inicial
            if (savedTheme) {
                _applyTheme(savedTheme);
            } else {
                // Verificar preferência do sistema
                const prefersDarkMode = window.matchMedia && 
                                       window.matchMedia('(prefers-color-scheme: dark)').matches;
                _applyTheme(prefersDarkMode ? THEMES.DARK : THEMES.LIGHT);
            }
            
            // Configurar listener para alteração de tema
            document.querySelector('.theme-toggle').addEventListener('click', this.toggleTheme);
            
            console.log(`Tema inicializado: ${appState.get('currentTheme')}`);
        },
        
        /**
         * Alterna entre os temas claro e escuro
         */
        toggleTheme() {
            const currentTheme = appState.get('currentTheme');
            const newTheme = currentTheme === THEMES.LIGHT ? THEMES.DARK : THEMES.LIGHT;
            _applyTheme(newTheme);
            console.log(`Tema alterado: ${currentTheme} -> ${newTheme}`);
        },
        
        /**
         * Define um tema específico
         * 
         * @param {string} theme - Tema a ser aplicado ('light' ou 'dark')
         */
        setTheme(theme) {
            if (Object.values(THEMES).includes(theme)) {
                _applyTheme(theme);
            } else {
                console.error(`Tema inválido: ${theme}`);
            }
        }
    };
})();

// Exportar usando ES modules para compatibilidade com Vite
export { themeManager };
