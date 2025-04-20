require('dotenv').config();
const OpenAI = require('openai');

// Configuração da API da OpenAI
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: "https://api.openai.com/v1"
});

async function testOpenAI() {
    console.log('Testando conexão com a API da OpenAI...');
    console.log('API Key configurada:', !!process.env.OPENAI_API_KEY);
    console.log('Primeiros 5 caracteres da API Key:', process.env.OPENAI_API_KEY.substring(0, 5));
    
    try {
        // Listar modelos disponíveis
        console.log('Tentando listar modelos...');
        const models = await openai.models.list();
        console.log('Modelos disponíveis:', models.data.map(model => model.id).slice(0, 5));
        
        // Testar chat completion
        console.log('\nTentando fazer uma chat completion...');
        const completion = await openai.chat.completions.create({
            model: "gpt-4.1-nano-2025-04-14",
            messages: [
                { role: "system", content: "Você é um assistente útil." },
                { role: "user", content: "Olá, tudo bem?" }
            ],
            max_tokens: 50
        });
        
        console.log('Resposta recebida:');
        console.log(completion.choices[0].message.content);
        console.log('\nTeste concluído com sucesso!');
    } catch (error) {
        console.error('Erro ao testar a API da OpenAI:');
        console.error('Mensagem:', error.message);
        console.error('Tipo:', error.constructor.name);
        
        if (error.response) {
            console.error('Detalhes da resposta:', error.response.data);
            console.error('Status:', error.response.status);
        }
        
        console.error('\nStack trace:');
        console.error(error.stack);
    }
}

testOpenAI();
