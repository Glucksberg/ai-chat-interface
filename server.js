const express = require('express');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3000;

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

// Iniciar o servidor
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
