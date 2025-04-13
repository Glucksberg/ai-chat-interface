# Bot de Gestão de Estoque Agrícola

Bot para Telegram que gerencia o estoque de defensivos e insumos agrícolas, permitindo que múltiplos usuários acessem e atualizem o mesmo estoque através de seed phrases.

## Recursos

- Autenticação através de seed phrases (mnemonic de 12 palavras)
- Cadastro de múltiplas fazendas com estoques independentes
- Adição e remoção de itens do estoque
- Visualização do estoque com filtros por categoria e unidade
- Consulta detalhada de produtos específicos
- Suporte para diferentes unidades (kg, l)

## Comandos

- `/start` - Iniciar o bot e autenticar-se
- `/ad [categoria] [nome] [quantidade]` - Adicionar item ao estoque
  - Exemplo: `/ad def roundup 100l` (adiciona 100 litros de roundup na categoria defensivos)
- `/e` - Listar todo o estoque
- `/e [categoria]` - Listar estoque por categoria (def, ins)
- `/e [unidade]` - Listar estoque por unidade (kg, lt)
- `/r [categoria] [nome] [quantidade]` - Remover item do estoque
  - Exemplo: `/r def roundup 20l` (remove 20 litros de roundup da categoria defensivos)
- `/p [categoria] [nome]` - Ver detalhes de um produto específico
  - Exemplo: `/p def roundup` (mostra detalhes do produto roundup na categoria defensivos)
- `/ajuda` - Mostrar mensagem de ajuda com todos os comandos

## Categorias e Unidades

- Categorias:
  - `def` - Defensivos (pesticidas, herbicidas, etc.)
  - `ins` - Insumos (fertilizantes, sementes, etc.)
- Unidades:
  - `kg` - Quilogramas (para produtos sólidos)
  - `l` ou `lt` - Litros (para produtos líquidos)

## Como instalar

1. Clone este repositório
2. Instale as dependências: `npm install`
3. Crie um arquivo `.env` com as seguintes variáveis:
   ```
   TELEGRAM_BOT_TOKEN=seu_token_do_bot_aqui
   MONGODB_URI=sua_uri_do_mongodb_aqui
   ```
4. Inicie o bot: `node index.js`

## Requisitos

- Node.js 14+
- MongoDB
- Telegram Bot Token (obtenha através do @BotFather no Telegram)

## Como obter uma seed phrase válida

O bot utiliza seed phrases com 12 palavras que devem ser compatíveis com o padrão BIP39. Você pode gerar uma seed phrase válida usando:

1. Qualquer carteira de criptomoeda que suporte BIP39
2. Geradores online de seed phrases BIP39
3. Bibliotecas como bip39 diretamente no Node.js

Exemplo de seed phrase válida:
```
abandon ability able about above absent absorb abstract absurd abuse access accident
```

## Segurança

- As seed phrases são armazenadas como hashes, não em texto plano
- Cada fazenda tem seu próprio estoque isolado
- Apenas usuários com a seed phrase correta podem acessar o estoque da fazenda 