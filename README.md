# CloudFarm.ai - Gerenciador de Fazendas Digitais

![Versão](https://img.shields.io/badge/versão-1.0.0-blue)
![Node](https://img.shields.io/badge/node-v16.x-green)

Um aplicativo web moderno para gestão integrada de operações rurais, permitindo o monitoramento e controle interativo de diferentes setores da fazenda através de uma interface gráfica intuitiva.

## 📋 Conteúdo

- [Visão Geral](#visão-geral)
- [Funcionalidades](#funcionalidades)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Requisitos](#requisitos)
- [Instalação](#instalação)
- [Desenvolvimento](#desenvolvimento)
- [Testes](#testes)
- [API](#api)
- [Contribuição](#contribuição)

## 🌐 Visão Geral

O CloudFarm.ai é uma plataforma que digitaliza o gerenciamento de propriedades rurais, integrando diferentes áreas como posto de combustível, armazenamento de grãos, monitoramento de máquinas, controle de gado e mais. O sistema oferece uma interface visual interativa onde cada módulo é representado por um ícone posicionável.

## ✨ Funcionalidades

- **Interface Visual Interativa**: Mapa personalizado da fazenda com ícones posicionáveis
- **Adaptação Responsiva**: Interfaces otimizadas para desktop e mobile
- **Persistência de Posições**: Salvamento e recuperação das posições dos ícones
- **Assistente Virtual**: Chat com IA especializado em agricultura (Agrônomo Virtual Claudinho)
- **Módulos Especializados**: Gestão de combustível, grãos, máquinas, entre outros

## 🏗️ Estrutura do Projeto

```
webagent/
├── frontend/          # Aplicação cliente (HTML, CSS, JavaScript client-side)
│   ├── Images/        # Imagens e recursos visuais
│   └── blog/          # Blog sobre agricultura e tecnologia
├── backend/           # Servidor API (Node.js, Express)
│   ├── utils/         # Utilitários (logging, persistência de dados)
│   ├── __tests__/     # Testes automatizados
│   └── documents/     # Documentos processados pelo sistema
├── data/              # Armazenamento de dados persistentes
├── logs/              # Logs da aplicação
├── .env.example       # Modelo de variáveis de ambiente
├── .gitignore         # Arquivos ignorados pelo git
└── API.md             # Documentação detalhada da API
```

### Separação de Responsabilidades

#### Frontend (frontend/)
- Interface do usuário (UI) e experiência do usuário (UX)
- Lógica de apresentação e manipulação de eventos
- Chamadas de API para o backend
- Renderização de dados e interatividade

#### Backend (backend/)
- API RESTful para consumo do frontend
- Lógica de negócios e processamento
- Persistência de dados (usando LowDB)
- Integração com OpenAI para o assistente virtual
- Sistema de logging estruturado (Winston)

## 📋 Requisitos

- **Node.js**: v16.x ou superior
- **NPM**: v8.x ou superior
- **Variáveis de Ambiente**: Configuração de .env baseada em .env.example

## 🚀 Instalação

1. Clone o repositório
```bash
git clone https://github.com/seu-usuario/cloudfarm.git
cd cloudfarm
```

2. Instale as dependências do projeto
```bash
# Instalar dependências do backend
cd backend
npm install

# Instalar dependências do frontend (opcional)
cd ../frontend
npm install
```

3. Configure as variáveis de ambiente
```bash
cp .env.example .env
# Edite o arquivo .env com suas configurações
```

4. Inicie o servidor
```bash
# Da raiz do projeto
npm run start
```

5. Acesse a aplicação em seu navegador: http://localhost:3002

## 💻 Desenvolvimento

### Iniciando o Ambiente de Desenvolvimento

```bash
# Para iniciar o backend com reinício automático (na raiz do projeto)
npm run dev

# Alternativamente, para iniciar o backend diretamente
cd backend
npm run dev

# Para iniciar apenas o frontend (opcional)
cd frontend
npm run dev
```

### Fluxo de Trabalho

1. O frontend está em HTML/CSS/JavaScript puro, sem frameworks
2. O backend usa Express.js para APIs RESTful
3. As posições dos ícones são salvas no banco de dados LowDB
4. Os logs são gerenciados pelo Winston para melhor depuração

### Exemplos de Comandos Úteis

- Para reiniciar o servidor após alterações: `npm run dev`
- Para verificar logs: `tail -f logs/combined.log`
- Para ver apenas erros: `tail -f logs/error.log`

## 🧪 Testes

O projeto utiliza Jest para testes automatizados no backend:

```bash
# Executar todos os testes
cd backend
npm test

# Executar testes com watch mode (desenvolvimento)
npm run test:watch

# Gerar relatório de cobertura
npm run test:coverage
```

## 📘 API

A documentação completa da API está disponível no arquivo [API.md](API.md). Principais endpoints:

- `POST /api/chat`: Chat com o assistente virtual
- `POST /api/save-positions`: Salva posições dos ícones
- `GET /api/load-positions/:deviceMode`: Carrega posições dos ícones

## 👥 Contribuição

1. Crie um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

---

Desenvolvido com ❤️ pela equipe CloudFarm.ai
