const bip39 = require('bip39');

// Estados de autenticação
const AUTH_STATES = {
  INITIAL: 'initial',
  WAITING_SEED: 'waiting_seed',
  AUTHENTICATED: 'authenticated'
};

/**
 * Middleware de autenticação para o bot
 * @param {TelegramBot} bot - Instância do bot do Telegram
 * @param {Object} collections - Coleções do MongoDB
 * @param {Object} userStates - Estado dos usuários
 */
function authMiddleware(bot, collections, userStates) {
  // Mensagem de boas-vindas e solicitação de seed phrase
  bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;
    userStates[chatId] = { state: AUTH_STATES.WAITING_SEED };
    
    await bot.sendMessage(
      chatId,
      'Bem-vindo ao Bot de Gestão de Estoque Agrícola!\n\n' +
      'Para acessar sua conta, por favor digite sua seed phrase de 12 palavras.\n' +
      'Se você não possui uma conta, insira uma nova seed phrase e uma conta será criada automaticamente.'
    );
  });
  
  // Intercepta todas as mensagens para verificar autenticação
  bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;
    
    // Ignora comandos durante o processo de autenticação
    if (text && text.startsWith('/') && text !== '/start') {
      // Verifica se o usuário está autenticado
      if (!userStates[chatId] || userStates[chatId].state !== AUTH_STATES.AUTHENTICATED) {
        await bot.sendMessage(
          chatId, 
          'Você precisa autenticar-se primeiro usando uma seed phrase válida.\n' +
          'Use o comando /start para iniciar o processo de autenticação.'
        );
        return;
      }
    }
    
    // Processa a autenticação quando o usuário envia a seed phrase
    if (userStates[chatId] && userStates[chatId].state === AUTH_STATES.WAITING_SEED && !text.startsWith('/')) {
      // Verifica se é uma seed phrase válida (12 palavras e validação do bip39)
      const words = text.trim().split(/\s+/);
      
      if (words.length !== 12 || !bip39.validateMnemonic(text)) {
        await bot.sendMessage(
          chatId,
          'Seed phrase inválida. Por favor, forneça uma seed phrase válida de 12 palavras.'
        );
        return;
      }
      
      try {
        // Procura na base de dados ou cria uma nova conta
        const user = await collections.users.findOne({ seedHash: hashSeed(text) });
        
        if (user) {
          // Usuário encontrado, autenticar
          userStates[chatId] = {
            state: AUTH_STATES.AUTHENTICATED,
            userId: user._id,
            farmId: user.farmId
          };
          
          await bot.sendMessage(
            chatId,
            `Autenticado com sucesso! Bem-vindo de volta à fazenda "${user.farmName}".\n\n` +
            await getHelpText()
          );
        } else {
          // Criar nova conta
          userStates[chatId] = {
            state: AUTH_STATES.AUTHENTICATED,
            tempSeedHash: hashSeed(text),
            newUser: true
          };
          
          await bot.sendMessage(
            chatId,
            'Seed phrase válida! Você está criando uma nova conta.\n' +
            'Por favor, digite um nome para sua fazenda:'
          );
        }
      } catch (error) {
        console.error('Erro na autenticação:', error);
        await bot.sendMessage(
          chatId,
          'Ocorreu um erro durante a autenticação. Por favor, tente novamente.'
        );
      }
    }
    
    // Processa a criação de nova fazenda
    if (userStates[chatId] && 
        userStates[chatId].state === AUTH_STATES.AUTHENTICATED && 
        userStates[chatId].newUser &&
        !text.startsWith('/')) {
      
      try {
        // Criar novo usuário com o nome da fazenda
        const farmName = text.trim();
        const farmId = new Date().getTime().toString();
        
        const newUser = {
          seedHash: userStates[chatId].tempSeedHash,
          farmName: farmName,
          farmId: farmId,
          createdAt: new Date()
        };
        
        await collections.users.insertOne(newUser);
        
        // Atualiza o estado do usuário
        userStates[chatId] = {
          state: AUTH_STATES.AUTHENTICATED,
          userId: newUser._id,
          farmId: farmId
        };
        
        delete userStates[chatId].newUser;
        delete userStates[chatId].tempSeedHash;
        
        await bot.sendMessage(
          chatId,
          `Conta criada com sucesso para a fazenda "${farmName}"!\n\n` +
          await getHelpText()
        );
      } catch (error) {
        console.error('Erro ao criar conta:', error);
        await bot.sendMessage(
          chatId,
          'Ocorreu um erro ao criar sua conta. Por favor, tente novamente.'
        );
      }
    }
  });
}

/**
 * Função para gerar um hash simples da seed phrase
 * Em produção, você deve usar algo mais seguro
 * @param {string} seed - Seed phrase do usuário
 * @returns {string} - Hash da seed phrase
 */
function hashSeed(seed) {
  // Em produção, use uma função de hash mais segura
  return require('crypto').createHash('sha256').update(seed).digest('hex');
}

/**
 * Obter o texto de ajuda com os comandos disponíveis
 * @returns {string} - Texto de ajuda
 */
async function getHelpText() {
  return 'Comandos disponíveis:\n\n' +
    '/ad [categoria] [nome] [quantidade] - Adicionar item ao estoque\n' +
    'Ex: /ad def roundup 100l\n\n' +
    '/e - Listar todo o estoque\n' +
    '/e [categoria] - Listar estoque por categoria (def, ins)\n' +
    '/e [unidade] - Listar estoque por unidade (kg, lt)\n\n' +
    '/r [categoria] [nome] [quantidade] - Remover item do estoque\n' +
    'Ex: /r def roundup 20l\n\n' +
    '/p [categoria] [nome] - Ver detalhes de um produto específico\n' +
    'Ex: /p def roundup\n\n' +
    '/ajuda - Mostrar esta mensagem de ajuda';
}

module.exports = { authMiddleware }; 