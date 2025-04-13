#!/bin/bash
# Script de implantação para CloudFarm.ai
# Execute este script no servidor com o IP 107.189.17.128 como usuário com privilégios sudo

# Definir cores para saída
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Função para imprimir mensagens de status
print_status() {
    echo -e "${YELLOW}[*] $1${NC}"
}

# Função para imprimir mensagens de sucesso
print_success() {
    echo -e "${GREEN}[+] $1${NC}"
}

# Verificar se está sendo executado como root ou com sudo
if [ "$EUID" -ne 0 ]; then
    echo "Por favor, execute este script como root ou com sudo"
    exit 1
fi

# Atualizar os pacotes do sistema
print_status "Atualizando pacotes do sistema..."
apt update && apt upgrade -y
print_success "Pacotes atualizados com sucesso!"

# Instalar dependências
print_status "Instalando dependências..."
apt install -y nginx curl software-properties-common gnupg
print_success "Dependências instaladas com sucesso!"

# Instalar Node.js 18.x LTS
print_status "Instalando Node.js..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt install -y nodejs
    print_success "Node.js instalado com sucesso: $(node -v)"
else
    print_success "Node.js já está instalado: $(node -v)"
fi

# Criar diretório da aplicação
print_status "Configurando diretórios..."
mkdir -p /var/www/cloudfarm.ai/data
mkdir -p /var/www/cloudfarm.ai/frontend
print_success "Diretórios criados com sucesso!"

# Copiar arquivos da aplicação
print_status "Copiando arquivos da aplicação..."
cp -r /home/myuser/webagent/frontend/* /var/www/cloudfarm.ai/frontend/
cp /home/myuser/webagent/server.js /var/www/cloudfarm.ai/
cp /home/myuser/webagent/package.json /var/www/cloudfarm.ai/
cp /home/myuser/webagent/package-lock.json /var/www/cloudfarm.ai/
print_success "Arquivos copiados com sucesso!"

# Instalar dependências do Node.js
print_status "Instalando dependências Node.js..."
cd /var/www/cloudfarm.ai
npm install --production
print_success "Dependências Node.js instaladas com sucesso!"

# Configurar Nginx
print_status "Configurando Nginx..."
cp /home/myuser/webagent/nginx-cloudfarm.conf /etc/nginx/sites-available/cloudfarm.ai
ln -sf /etc/nginx/sites-available/cloudfarm.ai /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
print_success "Nginx configurado com sucesso!"

# Configurar serviço systemd
print_status "Configurando serviço systemd para o aplicativo Node.js..."
cp /home/myuser/webagent/cloudfarm.service /etc/systemd/system/
systemctl daemon-reload
systemctl enable cloudfarm.service
systemctl start cloudfarm.service
print_success "Serviço configurado e iniciado com sucesso!"

# Configurar permissões
print_status "Configurando permissões..."
chown -R www-data:www-data /var/www/cloudfarm.ai
chmod -R 755 /var/www/cloudfarm.ai
print_success "Permissões configuradas com sucesso!"

# Instalar e configurar Let's Encrypt para HTTPS
print_status "Configurando HTTPS com Let's Encrypt..."
apt install -y certbot python3-certbot-nginx
certbot --nginx -d cloudfarm.ai -d www.cloudfarm.ai --non-interactive --agree-tos --email admin@cloudfarm.ai
print_success "HTTPS configurado com sucesso!"

# Verificar status do serviço
print_status "Verificando status do serviço..."
systemctl status cloudfarm.service
print_success "Implantação concluída! O site CloudFarm.ai está disponível em https://cloudfarm.ai"
