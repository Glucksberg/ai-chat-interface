/**
 * Configura os comandos do Bot de Gestão de Estoque
 * @param {TelegramBot} bot - Instância do bot do Telegram
 * @param {Object} collections - Coleções do MongoDB
 * @param {Object} userStates - Estado dos usuários
 */
function setupCommands(bot, collections, userStates) {
  // Comando de ajuda
  bot.onText(/\/ajuda/, async (msg) => {
    const chatId = msg.chat.id;
    await bot.sendMessage(chatId, await getHelpText());
  });

  // Comando para adicionar item ao estoque
  // Formato: /ad [categoria] [nome] [quantidade]
  // Ex: /ad def roundup 100l
  bot.onText(/\/ad(?:\s+(.+))?/, async (msg, match) => {
    const chatId = msg.chat.id;
    const params = match[1]?.trim();
    
    if (!userStates[chatId] || userStates[chatId].state !== 'authenticated') {
      return; // O middleware de auth já vai lidar com isso
    }
    
    if (!params) {
      await bot.sendMessage(
        chatId,
        'Formato correto: /ad [categoria] [nome] [quantidade]\n' +
        'Exemplo: /ad def roundup 100l'
      );
      return;
    }
    
    const parts = params.split(/\s+/);
    
    if (parts.length < 3) {
      await bot.sendMessage(
        chatId,
        'Formato incorreto. Use: /ad [categoria] [nome] [quantidade]\n' +
        'Exemplo: /ad def roundup 100l'
      );
      return;
    }
    
    const category = parts[0].toLowerCase();
    const quantity = parts[parts.length - 1];
    const name = parts.slice(1, parts.length - 1).join(' ');
    
    // Extrair valor numérico e unidade (kg ou l)
    const quantityMatch = quantity.match(/^(\d+(?:\.\d+)?)(kg|l|lt)$/i);
    
    if (!quantityMatch) {
      await bot.sendMessage(
        chatId,
        'Formato de quantidade inválido. Use números seguidos de "kg" ou "l".\n' +
        'Exemplo: 100kg ou 50l'
      );
      return;
    }
    
    const value = parseFloat(quantityMatch[1]);
    let unit = quantityMatch[2].toLowerCase();
    
    // Normalizar unidade
    if (unit === 'lt') unit = 'l';
    
    try {
      // Verificar se o item já existe no estoque
      const existingItem = await collections.inventory.findOne({
        farmId: userStates[chatId].farmId,
        category,
        name: { $regex: new RegExp(`^${name}$`, 'i') }, // Case insensitive
        unit
      });
      
      if (existingItem) {
        // Atualizar item existente
        await collections.inventory.updateOne(
          { _id: existingItem._id },
          { $inc: { quantity: value } }
        );
        
        await bot.sendMessage(
          chatId,
          `Item atualizado: ${name} (${category})\n` +
          `Quantidade anterior: ${existingItem.quantity}${unit}\n` +
          `Nova quantidade: ${existingItem.quantity + value}${unit}`
        );
      } else {
        // Criar novo item
        const newItem = {
          farmId: userStates[chatId].farmId,
          category,
          name,
          quantity: value,
          unit,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        await collections.inventory.insertOne(newItem);
        
        await bot.sendMessage(
          chatId,
          `Item adicionado: ${name} (${category})\n` +
          `Quantidade: ${value}${unit}`
        );
      }
    } catch (error) {
      console.error('Erro ao adicionar item:', error);
      await bot.sendMessage(
        chatId,
        'Ocorreu um erro ao adicionar o item. Por favor, tente novamente.'
      );
    }
  });
  
  // Comando para listar estoque
  // Formatos:
  // /e - Listar todo estoque
  // /e [categoria] - Listar por categoria (def, ins)
  // /e [unidade] - Listar por unidade (kg, lt)
  bot.onText(/\/e(?:\s+(.+))?/, async (msg, match) => {
    const chatId = msg.chat.id;
    const filter = match[1]?.trim().toLowerCase();
    
    if (!userStates[chatId] || userStates[chatId].state !== 'authenticated') {
      return; // O middleware de auth já vai lidar com isso
    }
    
    try {
      let query = { farmId: userStates[chatId].farmId };
      let filterDescription = 'Estoque completo';
      
      // Aplicar filtros se especificados
      if (filter) {
        // Verificar se é filtro de categoria
        if (['def', 'defensivos', 'ins', 'insumos'].includes(filter)) {
          if (filter === 'def' || filter === 'defensivos') {
            query.category = 'def';
            filterDescription = 'Categoria: Defensivos';
          } else if (filter === 'ins' || filter === 'insumos') {
            query.category = 'ins';
            filterDescription = 'Categoria: Insumos';
          }
        } 
        // Verificar se é filtro de unidade
        else if (['kg', 'l', 'lt'].includes(filter)) {
          query.unit = filter === 'lt' ? 'l' : filter;
          filterDescription = `Unidade: ${query.unit === 'kg' ? 'Quilogramas (kg)' : 'Litros (l)'}`;
        } else {
          await bot.sendMessage(
            chatId,
            'Filtro inválido. Use:\n' +
            '/e - Todo estoque\n' +
            '/e def - Defensivos\n' +
            '/e ins - Insumos\n' +
            '/e kg - Itens em kg\n' +
            '/e lt - Itens em litros'
          );
          return;
        }
      }
      
      // Buscar itens no banco de dados
      const items = await collections.inventory.find(query).toArray();
      
      if (items.length === 0) {
        await bot.sendMessage(
          chatId,
          `Nenhum item encontrado para o filtro: ${filterDescription}`
        );
        return;
      }
      
      // Agrupar por categoria
      const groupedItems = {};
      
      items.forEach(item => {
        if (!groupedItems[item.category]) {
          groupedItems[item.category] = [];
        }
        
        groupedItems[item.category].push(item);
      });
      
      // Montar mensagem de resposta
      let response = `📊 *${filterDescription}*\n\n`;
      
      Object.keys(groupedItems).forEach(category => {
        const categoryName = category === 'def' ? 'Defensivos' : 
                             category === 'ins' ? 'Insumos' : category;
        
        response += `*${categoryName}:*\n`;
        
        groupedItems[category].forEach(item => {
          response += `- ${item.name}: ${item.quantity}${item.unit}\n`;
        });
        
        response += '\n';
      });
      
      // Adicionar totais por unidade
      const totalsByUnit = {};
      
      items.forEach(item => {
        if (!totalsByUnit[item.unit]) {
          totalsByUnit[item.unit] = 0;
        }
        
        totalsByUnit[item.unit] += item.quantity;
      });
      
      response += '*Totais:*\n';
      
      Object.keys(totalsByUnit).forEach(unit => {
        const unitName = unit === 'kg' ? 'kg' : 'litros';
        response += `Total em ${unitName}: ${totalsByUnit[unit]}${unit}\n`;
      });
      
      await bot.sendMessage(chatId, response, { parse_mode: 'Markdown' });
    } catch (error) {
      console.error('Erro ao listar estoque:', error);
      await bot.sendMessage(
        chatId,
        'Ocorreu um erro ao listar o estoque. Por favor, tente novamente.'
      );
    }
  });
  
  // Comando para remover item do estoque
  // Formato: /r [categoria] [nome] [quantidade]
  // Ex: /r def roundup 20l
  bot.onText(/\/r(?:\s+(.+))?/, async (msg, match) => {
    const chatId = msg.chat.id;
    const params = match[1]?.trim();
    
    if (!userStates[chatId] || userStates[chatId].state !== 'authenticated') {
      return; // O middleware de auth já vai lidar com isso
    }
    
    if (!params) {
      await bot.sendMessage(
        chatId,
        'Formato correto: /r [categoria] [nome] [quantidade]\n' +
        'Exemplo: /r def roundup 20l'
      );
      return;
    }
    
    const parts = params.split(/\s+/);
    
    if (parts.length < 3) {
      await bot.sendMessage(
        chatId,
        'Formato incorreto. Use: /r [categoria] [nome] [quantidade]\n' +
        'Exemplo: /r def roundup 20l'
      );
      return;
    }
    
    const category = parts[0].toLowerCase();
    const quantity = parts[parts.length - 1];
    const name = parts.slice(1, parts.length - 1).join(' ');
    
    // Extrair valor numérico e unidade (kg ou l)
    const quantityMatch = quantity.match(/^(\d+(?:\.\d+)?)(kg|l|lt)$/i);
    
    if (!quantityMatch) {
      await bot.sendMessage(
        chatId,
        'Formato de quantidade inválido. Use números seguidos de "kg" ou "l".\n' +
        'Exemplo: 20kg ou 10l'
      );
      return;
    }
    
    const value = parseFloat(quantityMatch[1]);
    let unit = quantityMatch[2].toLowerCase();
    
    // Normalizar unidade
    if (unit === 'lt') unit = 'l';
    
    try {
      // Verificar se o item existe no estoque
      const existingItem = await collections.inventory.findOne({
        farmId: userStates[chatId].farmId,
        category,
        name: { $regex: new RegExp(`^${name}$`, 'i') },
        unit
      });
      
      if (!existingItem) {
        await bot.sendMessage(
          chatId,
          `Item não encontrado: ${name} (${category}) em ${unit}`
        );
        return;
      }
      
      // Verificar se há quantidade suficiente
      if (existingItem.quantity < value) {
        await bot.sendMessage(
          chatId,
          `Quantidade insuficiente. Disponível: ${existingItem.quantity}${unit}`
        );
        return;
      }
      
      // Atualizar quantidade ou remover item
      if (existingItem.quantity === value) {
        // Remover item completamente
        await collections.inventory.deleteOne({ _id: existingItem._id });
        
        await bot.sendMessage(
          chatId,
          `Item removido completamente: ${name} (${category})`
        );
      } else {
        // Diminuir quantidade
        await collections.inventory.updateOne(
          { _id: existingItem._id },
          { 
            $inc: { quantity: -value },
            $set: { updatedAt: new Date() }
          }
        );
        
        await bot.sendMessage(
          chatId,
          `Item atualizado: ${name} (${category})\n` +
          `Quantidade anterior: ${existingItem.quantity}${unit}\n` +
          `Nova quantidade: ${existingItem.quantity - value}${unit}`
        );
      }
    } catch (error) {
      console.error('Erro ao remover item:', error);
      await bot.sendMessage(
        chatId,
        'Ocorreu um erro ao remover o item. Por favor, tente novamente.'
      );
    }
  });

  // Comando para consultar um produto específico
  // Formato: /p [categoria] [nome]
  // Ex: /p def roundup
  bot.onText(/\/p(?:\s+(.+))?/, async (msg, match) => {
    const chatId = msg.chat.id;
    const params = match[1]?.trim();
    
    if (!userStates[chatId] || userStates[chatId].state !== 'authenticated') {
      return; // O middleware de auth já vai lidar com isso
    }
    
    if (!params) {
      await bot.sendMessage(
        chatId,
        'Formato correto: /p [categoria] [nome]\n' +
        'Exemplo: /p def roundup'
      );
      return;
    }
    
    const parts = params.split(/\s+/);
    
    if (parts.length < 2) {
      await bot.sendMessage(
        chatId,
        'Formato incorreto. Use: /p [categoria] [nome]\n' +
        'Exemplo: /p def roundup'
      );
      return;
    }
    
    const category = parts[0].toLowerCase();
    const name = parts.slice(1).join(' ');
    
    try {
      // Buscar todos os itens com esse nome e categoria (independente da unidade)
      const items = await collections.inventory.find({
        farmId: userStates[chatId].farmId,
        category,
        name: { $regex: new RegExp(`^${name}$`, 'i') }
      }).toArray();
      
      if (items.length === 0) {
        await bot.sendMessage(
          chatId,
          `Produto não encontrado: ${name} na categoria ${category}`
        );
        return;
      }
      
      // Formatar resposta com detalhes do(s) produto(s)
      let response = `🔍 *Detalhes do Produto*\n\n`;
      
      // Nome do produto e categoria
      const categoryName = category === 'def' ? 'Defensivos' : 
                          category === 'ins' ? 'Insumos' : category;
      
      response += `*Nome:* ${name}\n`;
      response += `*Categoria:* ${categoryName}\n\n`;
      
      // Detalhes por unidade
      items.forEach(item => {
        const unitName = item.unit === 'kg' ? 'Quilogramas' : 'Litros';
        response += `*Quantidade em ${unitName}:* ${item.quantity}${item.unit}\n`;
        
        // Adicionar data da última atualização
        const updateDate = new Date(item.updatedAt).toLocaleDateString('pt-BR');
        response += `*Última atualização:* ${updateDate}\n\n`;
      });
      
      // Histórico de movimentações (poderia ser implementado no futuro)
      response += `Use /ad ${category} ${name} [quantidade] para adicionar mais unidades\n`;
      response += `Use /r ${category} ${name} [quantidade] para remover unidades`;
      
      await bot.sendMessage(chatId, response, { parse_mode: 'Markdown' });
    } catch (error) {
      console.error('Erro ao buscar detalhes do produto:', error);
      await bot.sendMessage(
        chatId,
        'Ocorreu um erro ao buscar detalhes do produto. Por favor, tente novamente.'
      );
    }
  });
}

/**
 * Obter o texto de ajuda com os comandos disponíveis
 * @returns {string} - Texto de ajuda
 */
async function getHelpText() {
  return 'Comandos disponíveis:\n\n' +
    '/ad [categoria] [nome] [quantidade] - Adicionar item ao estoque\n' +
    'Ex: /ad def roundup 100l\n\n' +
    '/e - Listar todo o estoque\n' +
    '/e [categoria] - Listar estoque por categoria (def, ins)\n' +
    '/e [unidade] - Listar estoque por unidade (kg, lt)\n\n' +
    '/r [categoria] [nome] [quantidade] - Remover item do estoque\n' +
    'Ex: /r def roundup 20l\n\n' +
    '/p [categoria] [nome] - Ver detalhes de um produto específico\n' +
    'Ex: /p def roundup\n\n' +
    '/ajuda - Mostrar esta mensagem de ajuda';
}

module.exports = { setupCommands }; 