const OpenAI = require('openai');
require('dotenv').config();

// Inicializar cliente OpenAI
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// Função de teste
async function testarGPT4oMini() {
    try {
        console.log('Testando conexão com o modelo GPT-4o Mini...');
        
        const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                { role: 'system', content: 'Você é um assistente especialista em agricultura brasileira.' },
                { role: 'user', content: 'Quais são as melhores culturas para o solo do cerrado?' }
            ],
            max_tokens: 100
        });
        
        console.log('Resposta do GPT-4o Mini:');
        console.log(completion.choices[0].message.content);
        console.log('Teste bem-sucedido!');
    } catch (error) {
        console.error('Erro na API da OpenAI:');
        console.error('Mensagem:', error.message);
        
        if (error.response) {
            console.error('Resposta de erro da API:', error.response.data);
            console.error('Status de erro:', error.response.status);
        }
    }
}

// Executar o teste
testarGPT4oMini();
