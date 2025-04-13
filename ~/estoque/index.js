require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const { MongoClient } = require('mongodb');
const bip39 = require('bip39');
const { authMiddleware } = require('./middlewares/auth');
const { setupCommands } = require('./commands');

// Token do bot Telegram
const token = process.env.TELEGRAM_BOT_TOKEN;

// URI do MongoDB
const mongoUri = process.env.MONGODB_URI;

// Inicializa o bot
const bot = new TelegramBot(token, { polling: true });

// Estado dos usuários (temporário, até autenticação)
const userStates = {};

// Função para iniciar o bot
async function startBot() {
  try {
    // Conecta ao MongoDB
    const client = new MongoClient(mongoUri);
    await client.connect();
    console.log('Conectado ao MongoDB');
    
    const db = client.db();
    
    // Configura as coleções no banco de dados
    const collections = {
      users: db.collection('users'),
      inventory: db.collection('inventory')
    };
    
    // Configurar os comandos do bot
    setupCommands(bot, collections, userStates);
    
    // Middleware de autenticação
    authMiddleware(bot, collections, userStates);
    
    console.log('Bot iniciado com sucesso!');
  } catch (error) {
    console.error('Erro ao iniciar o bot:', error);
  }
}

// Inicia o bot
startBot(); 