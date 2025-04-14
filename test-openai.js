const OpenAI = require('openai');
require('dotenv').config();

// Mostrar informações básicas
console.log('Testando conexão com OpenAI API');
console.log('Node.js version:', process.version);
// Verificando a versão de maneira mais simples
console.log('OpenAI SDK instalado:', require.resolve('openai') ? 'Sim' : 'Não');
console.log('API Key configurada:', process.env.OPENAI_API_KEY ? `Sim (começa com ${process.env.OPENAI_API_KEY.substring(0, 12)}...)` : 'Não');

// Inicializar cliente OpenAI
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// Função de teste
async function testarOpenAI() {
    try {
        console.log('Enviando requisição de teste para a API da OpenAI...');
        
        const completion = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: [
                { role: 'system', content: 'Você é um assistente útil.' },
                { role: 'user', content: 'Diga "Conexão com a OpenAI funcionando corretamente!" em português.' }
            ],
            max_tokens: 50
        });
        
        console.log('Resposta recebida da OpenAI:');
        console.log(completion.choices[0].message.content);
        console.log('Teste concluído com sucesso!');
    } catch (error) {
        console.error('Erro ao conectar com a API da OpenAI:');
        console.error('Mensagem:', error.message);
        
        if (error.response) {
            console.error('Resposta de erro da API:', error.response.data);
            console.error('Status de erro:', error.response.status);
        }
    }
}

// Executar o teste
testarOpenAI();
