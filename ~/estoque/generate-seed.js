/**
 * Utilitário para gerar seed phrases válidas para testes
 * 
 * Uso:
 * - node generate-seed.js
 * - node generate-seed.js [número de seeds para gerar]
 */

const bip39 = require('bip39');
const crypto = require('crypto');

// Número de seeds a gerar (padrão: 1)
const count = parseInt(process.argv[2]) || 1;

console.log(`Gerando ${count} seed phrases:\n`);

for (let i = 0; i < count; i++) {
  // Gerar 16 bytes aleatórios (128 bits)
  const randomBytes = crypto.randomBytes(16);
  
  // Gerar a seed phrase com o BIP39
  const mnemonic = bip39.entropyToMnemonic(randomBytes.toString('hex'));
  
  // Verificar se a seed phrase é válida
  const isValid = bip39.validateMnemonic(mnemonic);
  
  console.log(`Seed ${i + 1}: ${mnemonic}`);
  console.log(`Válida: ${isValid ? 'Sim' : 'Não'}`);
  
  // Demonstração de como gerar o hash
  const hash = crypto.createHash('sha256').update(mnemonic).digest('hex');
  console.log(`Hash: ${hash}`);
  
  console.log('-----------------------------------\n');
}

console.log('Como usar estas seed phrases:');
console.log('1. Copie uma das seed phrases geradas');
console.log('2. Inicie o bot com o comando /start');
console.log('3. Cole a seed phrase quando solicitado');
console.log('4. Se for a primeira vez, você será solicitado a nomear sua fazenda');
console.log('5. Nas próximas vezes, use a mesma seed phrase para acessar a mesma fazenda'); 