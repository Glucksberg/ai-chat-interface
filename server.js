const express = require('express');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const cors = require('cors');
const bodyParser = require('body-parser');
const OpenAI = require('openai');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Configuração da API da OpenAI
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    dangerouslyAllowBrowser: false,
    baseURL: "https://api.openai.com/v1"
});

// Verificar se a API key está configurada
if (!process.env.OPENAI_API_KEY) {
    console.error('AVISO: OPENAI_API_KEY não está configurada no arquivo .env');
}

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'frontend')));

// Endpoint para o assistente de IA
app.post('/api/chat', async (req, res) => {
    try {
        const { messages } = req.body;
        
        console.log('Recebendo mensagens:', JSON.stringify(messages));
        
        if (!messages || !Array.isArray(messages)) {
            console.error('Formato de mensagem inválido:', messages);
            return res.status(400).json({ 
                success: false, 
                message: 'Formato de mensagem inválido' 
            });
        }
        
        // Garantir que as mensagens estão no formato correto
        const formattedMessages = messages.map(msg => ({
            role: msg.role || 'user',
            content: msg.content || ''
        }));
        
        // Adicionar mensagem de sistema para melhor contexto
        formattedMessages.unshift({
            role: 'system',
            content: 'Você é o Agrônomo Virtual Claudinho, um assistente especializado em agricultura e pecuária brasileira. Forneça respostas úteis, precisas e amigáveis sobre cultivos, solo, clima, tecnologias agrícolas e manejo de animais. Use um tom cordial e profissional.'
        });
        
        console.log('API Key configurada:', !!process.env.OPENAI_API_KEY);
        console.log('Mensagens formatadas:', JSON.stringify(formattedMessages));
        
        try {
            // Verificar se a API key está configurada
            if (!process.env.OPENAI_API_KEY) {
                throw new Error('OPENAI_API_KEY não está configurada');
            }

            console.log('Tentando chamar a API OpenAI com a chave configurada');
            
            // Usar o modelo GPT-4o Mini Search Preview
            let modelToUse = 'gpt-4o-mini-search-preview-2025-03-11';
            
            try {
                const completion = await openai.chat.completions.create({
                    model: modelToUse,
                    messages: formattedMessages,
                    temperature: 0.7,
                    max_tokens: 500
                });
                
                const assistantResponse = completion.choices[0].message.content;
                console.log('Resposta recebida da OpenAI com sucesso');
                
                res.json({
                    success: true,
                    message: assistantResponse
                });
            } catch (modelError) {
                console.error(`Erro com o modelo ${modelToUse}:`, modelError.message);
                
                // Tentar com um modelo alternativo mais avançado
                modelToUse = 'o4-mini-2025-04-16';
                console.log(`Tentando com modelo alternativo: ${modelToUse}`);
                
                const completion = await openai.chat.completions.create({
                    model: modelToUse,
                    messages: formattedMessages,
                    temperature: 0.7,
                    max_tokens: 500
                });
                
                const assistantResponse = completion.choices[0].message.content;
                console.log('Resposta recebida da OpenAI com modelo alternativo');
                
                res.json({
                    success: true,
                    message: assistantResponse
                });
            }
        } catch (apiError) {
            console.error('Erro específico da API OpenAI:', apiError.message);
            console.error('Tipo de erro:', apiError.constructor.name);
            console.error('Stack trace:', apiError.stack);
            
            // Tentar extrair detalhes mais específicos do erro
            let errorDetails = 'Detalhes não disponíveis';
            let statusCode = apiError.status || 500;
            
            if (apiError.response) {
                errorDetails = JSON.stringify(apiError.response.data);
            }
            
            console.error('Detalhes completos do erro:', errorDetails);
            
            res.status(statusCode).json({ 
                success: false, 
                message: 'Erro ao se comunicar com a API da OpenAI',
                error: apiError.message,
                details: errorDetails
            });
        }
    } catch (error) {
        console.error('Erro geral no endpoint:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Erro ao processar sua solicitação',
            error: error.message 
        });
    }
});

// Garantir que o diretório de dados exista
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
    console.log('Criando diretório de dados:', dataDir);
    try {
        fs.mkdirSync(dataDir, { recursive: true });
        // Definir permissões (0755) para garantir acesso de escrita
        fs.chmodSync(dataDir, 0o755);
        console.log('Diretório de dados criado com permissões corretas');
    } catch (error) {
        console.error('Erro ao criar diretório de dados:', error);
    }
} else {
    console.log('Diretório de dados já existe:', dataDir);
    // Garantir permissões de escrita
    try {
        fs.chmodSync(dataDir, 0o755);
    } catch (error) {
        console.error('Erro ao atualizar permissões do diretório:', error);
    }
}

// Caminho para a planilha CSV
const dataFilePath = path.join(__dirname, 'data', 'propriedades.csv');

// Verificar se o arquivo CSV existe, caso contrário, criá-lo com os cabeçalhos
if (!fs.existsSync(dataFilePath)) {
    console.log('Arquivo CSV não existe, criando:', dataFilePath);
    const csvWriter = createCsvWriter({
        path: dataFilePath,
        header: [
            { id: 'nome', title: 'Nome' },
            { id: 'telefone', title: 'Telefone' },
            { id: 'email', title: 'Email' },
            { id: 'propriedade', title: 'Propriedade' },
            { id: 'cidade', title: 'Cidade' },
            { id: 'area', title: 'Area (ha)' },
            { id: 'data', title: 'Data de Cadastro' }
        ]
    });
    
    csvWriter.writeRecords([])
        .then(() => {
            console.log('Arquivo CSV criado com sucesso');
            // Definir permissões do arquivo (0644)
            try {
                fs.chmodSync(dataFilePath, 0o644);
                console.log('Permissões do arquivo CSV configuradas');
            } catch (error) {
                console.error('Erro ao configurar permissões do arquivo CSV:', error);
            }
        })
        .catch(error => {
            console.error('Erro ao criar arquivo CSV:', error);
        });
} else {
    console.log('Arquivo CSV já existe:', dataFilePath);
    // Garantir permissões de escrita
    try {
        fs.chmodSync(dataFilePath, 0o644);
        console.log('Permissões do arquivo CSV atualizadas');
    } catch (error) {
        console.error('Erro ao atualizar permissões do arquivo CSV:', error);
    }
}

// Rota para receber os dados do formulário
app.post('/api/submit-form', (req, res) => {
    console.log('Recebendo dados do formulário:', req.body);
    
    const formData = req.body;
    
    // Adicionar data de submissão com GMT-4
    const now = new Date();
    // Ajusta para GMT-4 adicionando o offset correto (GMT-4 = UTC-4)
    const localTime = new Date(now.getTime() - (4 * 60 * 60 * 1000));
    formData.data = localTime.toLocaleString('pt-BR', { timeZone: 'America/Manaus' });
    
    console.log('Dados a serem salvos:', formData);
    console.log('Caminho do arquivo CSV:', dataFilePath);
    
    // Verificar se o diretório existe e tem permissões de escrita
    try {
        fs.accessSync(dataDir, fs.constants.W_OK);
        console.log('Diretório de dados existe e tem permissões de escrita');
    } catch (error) {
        console.error('Erro ao acessar diretório de dados:', error);
        return res.status(500).json({ success: false, message: 'Erro ao acessar diretório de dados' });
    }
    
    // Escrever no arquivo CSV
    const csvWriter = createCsvWriter({
        path: dataFilePath,
        header: [
            { id: 'nome', title: 'Nome' },
            { id: 'telefone', title: 'Telefone' },
            { id: 'email', title: 'Email' },
            { id: 'propriedade', title: 'Propriedade' },
            { id: 'cidade', title: 'Cidade' },
            { id: 'area', title: 'Area (ha)' },
            { id: 'data', title: 'Data de Cadastro' }
        ],
        append: true
    });
    
    csvWriter.writeRecords([formData])
        .then(() => {
            console.log('Novo cadastro adicionado com sucesso');
            res.status(200).json({ success: true, message: 'Dados salvos com sucesso!' });
        })
        .catch(error => {
            console.error('Erro ao salvar dados no CSV:', error);
            res.status(500).json({ success: false, message: 'Erro ao processar o formulário' });
        });
});

// Rota para o chat com a IA (OpenAI)
app.post('/api/chat', async (req, res) => {
    try {
        console.log('Recebida solicitação para /api/chat');
        
        const { messages } = req.body;
        
        // Validar mensagens
        if (!messages || !Array.isArray(messages)) {
            return res.status(400).json({
                success: false,
                message: 'Formato de mensagem inválido. Envie um array de mensagens.'
            });
        }
        
        // Adiciona contexto sobre agricultura como sistema
        const systemContext = {
            role: 'system',
            content: 'Você é um assistente especialista em agronomia e agricultura e ajuda produtores rurais com informações sobre cultivo, solo, clima, tecnologias agrícolas, cálculos agronômicos, manejo de animais e estratégias para aumentar a produtividade de forma sustentável. Responda sempre em português.'
        };
        
        const allMessages = [systemContext, ...messages];
        
        // Chamar a API da OpenAI com o modelo GPT-4o Mini
        const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: allMessages,
            temperature: 0.7,
            max_tokens: 500
        });
        
        // Enviar resposta
        res.json({
            success: true,
            choices: [{
                message: completion.choices[0].message
            }]
        });
    } catch (error) {
        console.error('Erro na API da OpenAI:', error.message);
        
        res.status(500).json({
            success: false,
            message: 'Erro ao processar a solicitação de IA',
            error: error.message
        });
    }
});

// Iniciar o servidor
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
