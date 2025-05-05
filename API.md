# API CloudFarm.ai - Documentação

## Endpoints Disponíveis

### Chat com IA

**Endpoint:** `/api/chat`
**Método:** POST
**Descrição:** Envia mensagens para processamento pela IA e recebe respostas.

**Parâmetros:**
```json
{
  "messages": [
    {
      "role": "user", 
      "content": "Sua mensagem aqui"
    }
  ]
}
```

**Resposta de Sucesso:**
```json
{
  "success": true,
  "message": "Resposta do assistente virtual"
}
```

### Salvar Posições de Ícones

**Endpoint:** `/api/save-positions`
**Método:** POST
**Descrição:** Salva as posições dos ícones da interface para um modo específico de dispositivo.

**Parâmetros:**
```json
{
  "deviceMode": "desktop", // ou "mobile"
  "positions": {
    "fuelStation": {
      "top": "30px",
      "left": "50px"
    },
    // outros ícones...
  }
}
```

**Resposta de Sucesso:**
```json
{
  "success": true,
  "message": "Posições salvas com sucesso"
}
```

### Carregar Posições de Ícones

**Endpoint:** `/api/load-positions/:deviceMode`
**Método:** GET
**Descrição:** Carrega as posições dos ícones para um modo específico de dispositivo.

**Parâmetros de URL:**
- `deviceMode`: "desktop" ou "mobile"

**Resposta de Sucesso:**
```json
{
  "success": true,
  "positions": {
    "fuelStation": {
      "top": "30px",
      "left": "50px"
    },
    // outros ícones...
  }
}
```

## Estrutura de Erros

Todos os endpoints retornam erros no seguinte formato:

```json
{
  "success": false,
  "message": "Mensagem de erro",
  "error": "Detalhes técnicos do erro"
}
```

## Códigos de Status HTTP

- **200 OK**: Requisição processada com sucesso
- **400 Bad Request**: Parâmetros inválidos ou ausentes
- **500 Internal Server Error**: Erro interno no servidor
