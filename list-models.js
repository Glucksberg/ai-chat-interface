const OpenAI = require('openai');
require('dotenv').config();

// Inicializar cliente OpenAI
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// Função para listar modelos disponíveis
async function listarModelos() {
    try {
        console.log('Obtendo lista de modelos disponíveis...');
        
        const models = await openai.models.list();
        
        console.log('Modelos disponíveis para o seu projeto:');
        models.data.forEach(model => {
            console.log(`- ${model.id}`);
        });
    } catch (error) {
        console.error('Erro ao obter modelos:');
        console.error('Mensagem:', error.message);
        
        if (error.response) {
            console.error('Resposta de erro da API:', error.response.data);
            console.error('Status de erro:', error.response.status);
        }
    }
}

// Executar
listarModelos();
