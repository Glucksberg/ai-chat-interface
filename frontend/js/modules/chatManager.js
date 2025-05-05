/**
 * chatManager.js - Gerenciador do assistente de chat (Agrônomo Virtual Claudinho)
 * 
 * Controla a interação com o assistente de chat, gerenciando a comunicação
 * com a API no backend e atualizando a interface com as mensagens.
 */

// Importar dependências
import { appState } from '../utils/appState.js';

const chatManager = (() => {
    // Elementos da interface do chat
    let chatOverlay, chatContainer, messagesContainer, inputField, sendButton;
    let chatOpen = false;
    
    // Histórico de mensagens para manter o contexto da conversa
    let messageHistory = [];
    
    // Sugestões predefinidas para mostrar ao usuário
    const defaultSuggestions = [
        "Como melhorar a produtividade da soja?",
        "O que causa ferrugem no milho?",
        "Quando devo plantar trigo na minha região?",
        "Qual a melhor época para aplicar fertilizantes?",
        "Como controlar pragas sem usar muitos agrotóxicos?"
    ];
    
    // Inicializa as referências aos elementos DOM
    const _initDomReferences = () => {
        chatOverlay = document.getElementById('chat-overlay');
        chatContainer = document.querySelector('.chat-container');
        messagesContainer = document.querySelector('.chat-messages');
        inputField = document.querySelector('.chat-input');
        sendButton = document.querySelector('.chat-send');
    };
    
    // Abre a interface do chat
    const _openChat = () => {
        if (!chatOverlay) return;
        
        chatOverlay.style.display = 'flex';
        setTimeout(() => {
            chatOverlay.style.opacity = '1';
            chatContainer.style.transform = 'translateY(0)';
        }, 10);
        
        chatOpen = true;
        appState.set('chatVisible', true);
        
        // Se for a primeira abertura, exibir mensagem de boas vindas
        if (messageHistory.length === 0) {
            _addBotMessage("Olá! Sou o Claudinho, seu agrônomo virtual. Como posso ajudar você com sua fazenda hoje?");
            _showSuggestions(defaultSuggestions);
        }
        
        // Focar no campo de input
        if (inputField) {
            setTimeout(() => {
                inputField.focus();
            }, 300);
        }
    };
    
    // Fecha a interface do chat
    const _closeChat = () => {
        if (!chatOverlay) return;
        
        chatOverlay.style.opacity = '0';
        chatContainer.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
            chatOverlay.style.display = 'none';
        }, 300);
        
        chatOpen = false;
        appState.set('chatVisible', false);
    };
    
    // Adiciona uma mensagem do usuário ao chat
    const _addUserMessage = (message) => {
        if (!messagesContainer || !message.trim()) return;
        
        const messageElement = document.createElement('div');
        messageElement.className = 'message user-message';
        messageElement.textContent = message;
        messagesContainer.appendChild(messageElement);
        
        // Adicionar ao histórico
        messageHistory.push({
            role: 'user',
            content: message
        });
        
        // Atualizar o estado da aplicação
        appState.set('chatHistory', messageHistory);
        
        // Rolar para a última mensagem
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    };
    
    // Adiciona uma mensagem do bot ao chat
    const _addBotMessage = (message) => {
        if (!messagesContainer) return;
        
        // Remover indicador de digitação se existir
        const typingIndicator = document.querySelector('.bot-typing');
        if (typingIndicator) {
            typingIndicator.remove();
        }
        
        const messageElement = document.createElement('div');
        messageElement.className = 'message bot-message';
        
        // Converter quebras de linha para HTML
        message = message.replace(/\\n/g, '<br>');
        
        // Formatar markdown básico
        message = message
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');
            
        messageElement.innerHTML = message;
        messagesContainer.appendChild(messageElement);
        
        // Adicionar ao histórico
        messageHistory.push({
            role: 'assistant',
            content: message
        });
        
        // Atualizar o estado da aplicação
        appState.set('chatHistory', messageHistory);
        
        // Rolar para a última mensagem
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    };
    
    // Mostra o indicador de digitação
    const _showTypingIndicator = () => {
        if (!messagesContainer) return;
        
        const typingElement = document.createElement('div');
        typingElement.className = 'bot-typing';
        typingElement.innerHTML = '<span class="typing-dot"></span><span class="typing-dot"></span><span class="typing-dot"></span>';
        messagesContainer.appendChild(typingElement);
        
        // Rolar para a última mensagem
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    };
    
    // Mostra sugestões de mensagens
    const _showSuggestions = (suggestions) => {
        if (!chatContainer) return;
        
        // Verificar se já existe e remover
        const existingSuggestions = document.querySelector('.suggestion-chips');
        if (existingSuggestions) {
            existingSuggestions.remove();
        }
        
        // Criar novo contêiner de sugestões
        const suggestionsContainer = document.createElement('div');
        suggestionsContainer.className = 'suggestion-chips';
        
        // Adicionar cada sugestão
        suggestions.forEach(suggestion => {
            const chip = document.createElement('div');
            chip.className = 'suggestion-chip';
            chip.textContent = suggestion;
            chip.addEventListener('click', () => {
                // Enviar a sugestão quando clicada
                if (inputField) {
                    inputField.value = suggestion;
                }
                _sendMessage();
            });
            suggestionsContainer.appendChild(chip);
        });
        
        // Adicionar ao contêiner do chat
        chatContainer.appendChild(suggestionsContainer);
    };
    
    // Envia a mensagem para o backend
    const _sendMessage = async () => {
        if (!inputField) return;
        
        const message = inputField.value.trim();
        if (!message) return;
        
        // Adicionar mensagem do usuário ao chat
        _addUserMessage(message);
        
        // Limpar campo de input
        inputField.value = '';
        
        // Mostrar indicador de digitação
        _showTypingIndicator();
        
        try {
            // Enviar mensagem para o backend
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    messages: messageHistory.slice(-10) // Enviar apenas as últimas 10 mensagens para evitar exceder limites
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                // Adicionar resposta do assistente ao chat
                _addBotMessage(data.message);
                
                // Mostrar sugestões relacionadas, se houver
                if (data.suggestions && Array.isArray(data.suggestions) && data.suggestions.length > 0) {
                    _showSuggestions(data.suggestions);
                }
            } else {
                // Mostrar mensagem de erro
                _addBotMessage("Desculpe, tive um problema técnico. Pode tentar novamente mais tarde?");
                console.error('Erro na resposta do assistente:', data.error || 'Erro desconhecido');
            }
        } catch (error) {
            // Mostrar mensagem de erro
            _addBotMessage("Desculpe, não consegui me conectar ao servidor. Verifique sua conexão e tente novamente.");
            console.error('Erro ao enviar mensagem:', error);
        }
    };
    
    return {
        /**
         * Inicializa o gerenciador de chat
         */
        initialize() {
            // Inicializar referências DOM
            _initDomReferences();
            
            // Configurar evento para o botão que abre o chat
            const chatButton = document.querySelector('.chat-button');
            if (chatButton) {
                chatButton.addEventListener('click', _openChat);
            }
            
            // Configurar evento para o botão de fechar o chat
            const closeButton = document.querySelector('.chat-close');
            if (closeButton) {
                closeButton.addEventListener('click', _closeChat);
            }
            
            // Configurar evento para o botão de enviar
            if (sendButton) {
                sendButton.addEventListener('click', _sendMessage);
            }
            
            // Configurar evento para enviar com Enter
            if (inputField) {
                inputField.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        _sendMessage();
                    }
                });
            }
            
            // Carregar histórico do chat do localStorage, se existir
            const savedHistory = localStorage.getItem('cloudFarm_chatHistory');
            if (savedHistory) {
                try {
                    messageHistory = JSON.parse(savedHistory);
                    
                    // Limite a apenas as últimas 50 mensagens para não sobrecarregar
                    if (messageHistory.length > 50) {
                        messageHistory = messageHistory.slice(-50);
                    }
                    
                    // Atualizar o estado da aplicação
                    appState.set('chatHistory', messageHistory);
                } catch (e) {
                    console.error('Erro ao carregar histórico do chat:', e);
                    messageHistory = [];
                }
            }
            
            console.log('Gerenciador de chat inicializado');
        },
        
        /**
         * Abre a interface do chat
         */
        openChat: _openChat,
        
        /**
         * Fecha a interface do chat
         */
        closeChat: _closeChat,
        
        /**
         * Verifica se o chat está aberto
         * 
         * @returns {boolean} - true se o chat estiver aberto
         */
        isOpen() {
            return chatOpen;
        },
        
        /**
         * Limpa o histórico de mensagens
         */
        clearHistory() {
            messageHistory = [];
            
            if (messagesContainer) {
                messagesContainer.innerHTML = '';
            }
            
            localStorage.removeItem('cloudFarm_chatHistory');
            appState.set('chatHistory', []);
            
            // Adicionar mensagem de boas vindas
            _addBotMessage("Olá! Sou o Claudinho, seu agrônomo virtual. Como posso ajudar você com sua fazenda hoje?");
            _showSuggestions(defaultSuggestions);
            
            console.log('Histórico de chat limpo');
        }
    };
})();

// Exportar usando ES modules para compatibilidade com Vite
export { chatManager };
