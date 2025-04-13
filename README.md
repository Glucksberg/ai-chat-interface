# CloudFarm.ai

Site de coleta de dados de propriedades rurais para CloudFarm.ai.

## Descrição

Este projeto consiste em um site para o domínio cloudfarm.ai que contém um formulário para coletar informações básicas dos clientes, como:
- Nome completo
- Telefone
- E-mail
- Nome da propriedade
- Cidade/Estado
- Tamanho da área em hectares

As informações coletadas são armazenadas em uma planilha CSV no servidor.

## Estrutura do Projeto

```
cloudfarm-website/
│
├── frontend/           # Arquivos estáticos do site
│   ├── index.html      # Página principal com o formulário
│   └── CNAME           # Arquivo de configuração do domínio
│
├── data/               # Diretório onde serão armazenados os dados
│   └── propriedades.csv # Planilha com os dados coletados
│
├── server.js           # Servidor Node.js para processar os formulários
├── package.json        # Dependências do projeto
└── README.md           # Este arquivo
```

## Requisitos

- Node.js 14.x ou superior
- NPM 6.x ou superior

## Instalação

Para instalar as dependências do projeto, execute:

```bash
npm install
```

## Execução

Para iniciar o servidor, execute:

```bash
npm start
```

O servidor estará disponível em http://localhost:3000

## Deployment para o domínio cloudfarm.ai

1. Certifique-se de que o domínio cloudfarm.ai está configurado para apontar para o servidor onde este aplicativo estará hospedado.
2. Configure seu servidor web (Nginx, Apache, etc.) para servir o diretório `frontend/` e fazer proxy para o servidor Node.js na porta 3000.

### Exemplo de configuração Nginx

```
server {
    listen 80;
    server_name cloudfarm.ai www.cloudfarm.ai;

    location / {
        root /caminho/para/frontend;
        index index.html;
        try_files $uri $uri/ =404;
    }

    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Licença

Todos os direitos reservados - CloudFarm.ai 2025
