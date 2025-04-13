# Instruções de Implantação - CloudFarm.ai

Este documento contém instruções passo a passo para implantar o site CloudFarm.ai no servidor.

## Pré-requisitos

- Acesso SSH ao servidor com o IP 107.189.17.128
- Privilégios sudo no servidor
- Domínio cloudfarm.ai já configurado para apontar para o IP 107.189.17.128

## Método 1: Implantação Automatizada (Recomendada)

1. Transferir os arquivos do projeto para o servidor:
```bash
# Execute este comando a partir do diretório do projeto em sua máquina local
scp -r /home/myuser/webagent/* usuario@107.189.17.128:~/cloudfarm-temp/
```

2. Conectar-se ao servidor:
```bash
ssh usuario@107.189.17.128
```

3. Executar o script de implantação:
```bash
cd ~/cloudfarm-temp
sudo ./deploy.sh
```

4. O script automatizará todo o processo e informará quando a implantação estiver concluída.

## Método 2: Implantação Manual

Se preferir fazer a implantação manualmente, siga estas etapas:

### 1. Preparar o servidor

```bash
# Atualizar pacotes
sudo apt update && sudo apt upgrade -y

# Instalar Nginx
sudo apt install -y nginx

# Instalar Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
```

### 2. Configurar diretórios e copiar arquivos

```bash
# Criar diretórios da aplicação
sudo mkdir -p /var/www/cloudfarm.ai/data
sudo mkdir -p /var/www/cloudfarm.ai/frontend

# Copiar arquivos da aplicação
sudo cp -r ~/cloudfarm-temp/frontend/* /var/www/cloudfarm.ai/frontend/
sudo cp ~/cloudfarm-temp/server.js /var/www/cloudfarm.ai/
sudo cp ~/cloudfarm-temp/package.json /var/www/cloudfarm.ai/
sudo cp ~/cloudfarm-temp/package-lock.json /var/www/cloudfarm.ai/

# Instalar dependências
cd /var/www/cloudfarm.ai
sudo npm install --production
```

### 3. Configurar Nginx

```bash
# Copiar arquivo de configuração
sudo cp ~/cloudfarm-temp/nginx-cloudfarm.conf /etc/nginx/sites-available/cloudfarm.ai

# Criar link simbólico
sudo ln -sf /etc/nginx/sites-available/cloudfarm.ai /etc/nginx/sites-enabled/

# Verificar configuração e reiniciar Nginx
sudo nginx -t
sudo systemctl reload nginx
```

### 4. Configurar serviço systemd

```bash
# Copiar arquivo de serviço
sudo cp ~/cloudfarm-temp/cloudfarm.service /etc/systemd/system/

# Habilitar e iniciar o serviço
sudo systemctl daemon-reload
sudo systemctl enable cloudfarm.service
sudo systemctl start cloudfarm.service
```

### 5. Configurar HTTPS

```bash
# Instalar Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obter e configurar certificado
sudo certbot --nginx -d cloudfarm.ai -d www.cloudfarm.ai
```

### 6. Verificar a implantação

```bash
# Verificar status do serviço Node.js
sudo systemctl status cloudfarm.service

# Verificar logs do serviço se necessário
sudo journalctl -u cloudfarm.service -f
```

## Solução de Problemas

### Se o site não carregar:

1. Verifique se o Nginx está em execução:
```bash
sudo systemctl status nginx
```

2. Verifique se o serviço Node.js está em execução:
```bash
sudo systemctl status cloudfarm.service
```

3. Verifique os logs do Nginx:
```bash
sudo tail -f /var/log/nginx/error.log
```

4. Verifique os logs do Node.js:
```bash
sudo journalctl -u cloudfarm.service -f
```

### Se você vir a versão antiga do site:

1. Limpe o cache do navegador ou use uma janela anônima
2. Verifique se os arquivos foram copiados corretamente:
```bash
ls -la /var/www/cloudfarm.ai/frontend/
cat /var/www/cloudfarm.ai/frontend/index.html | head
```

## Manutenção

### Para reiniciar o servidor Node.js:
```bash
sudo systemctl restart cloudfarm.service
```

### Para atualizar o conteúdo do site:
```bash
# Copiar novos arquivos para o servidor
scp -r /caminho/para/novos/arquivos/* usuario@107.189.17.128:~/temp/

# No servidor, copiar os arquivos para o diretório da aplicação
sudo cp -r ~/temp/* /var/www/cloudfarm.ai/frontend/
```
