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
    apiKey: process.env.OPENAI_API_KEY
});

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'frontend')));

// Caminho para a planilha CSV
const dataFilePath = path.join(__dirname, 'data', 'propriedades.csv');

// Garantir que o diretório de dados exista
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir);
}

// Verificar se o arquivo CSV existe, caso contrário, criá-lo com os cabeçalhos
if (!fs.existsSync(dataFilePath)) {
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
        .then(() => console.log('Arquivo CSV criado com sucesso'));
}

// Rota para receber os dados do formulário
app.post('/api/submit-form', (req, res) => {
    const formData = req.body;
    
    // Adicionar data de submissão
    formData.data = new Date().toLocaleString('pt-BR');
    
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
            console.log('Novo cadastro adicionado');
            res.status(200).json({ success: true, message: 'Dados salvos com sucesso!' });
        })
        .catch(error => {
            console.error('Erro ao salvar dados:', error);
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
            content: 'Você é um assistente especialista em agricultura e pecuária brasileira. Você ajuda produtores rurais com informações sobre cultivo, solo, clima, tecnologias agrícolas, manejo de animais e estratégias para aumentar a produtividade de forma sustentável. Responda sempre em português.'
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
