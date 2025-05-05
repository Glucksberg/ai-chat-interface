/**
 * componentLoader.js - Carregador de componentes HTML
 * 
 * Responsável por carregar os componentes HTML nos elementos de destino
 * utilizando fetch e injeção de HTML.
 */

/**
 * Carrega um componente HTML em um elemento alvo
 * 
 * @param {string} componentPath - Caminho para o arquivo de componente
 * @param {string} targetSelector - Seletor do elemento onde o componente será carregado
 * @returns {Promise} - Promise que resolve quando o componente for carregado
 */
export const loadComponent = async (componentPath, targetSelector) => {
    try {
        const targetElement = document.querySelector(targetSelector);
        if (!targetElement) {
            console.error(`Elemento alvo ${targetSelector} não encontrado.`);
            return;
        }
        
        // Carregar o conteúdo do componente
        const response = await fetch(componentPath);
        if (!response.ok) {
            throw new Error(`Erro ao carregar componente: ${response.statusText}`);
        }
        
        const html = await response.text();
        targetElement.innerHTML = html;
        
        console.log(`Componente ${componentPath} carregado com sucesso em ${targetSelector}`);
        return true;
    } catch (error) {
        console.error(`Falha ao carregar componente ${componentPath}:`, error);
        return false;
    }
};

/**
 * Carrega múltiplos componentes de uma vez
 * 
 * @param {Array} components - Array de objetos {path, target}
 * @returns {Promise} - Promise que resolve quando todos os componentes forem carregados
 */
export const loadComponents = async (components) => {
    const promises = components.map(component => 
        loadComponent(component.path, component.target)
    );
    
    return Promise.all(promises);
};
