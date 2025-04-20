#!/bin/bash
# Script para atualizar apenas os arquivos do frontend sem precisar de sudo

echo "Copiando arquivo index.html para o servidor..."
scp /home/myuser/webagent/frontend/index.html usuario@107.189.17.128:/tmp/index.html

echo "Conectando ao servidor para mover o arquivo..."
ssh usuario@107.189.17.128 "sudo cp /tmp/index.html /var/www/cloudfarm.ai/frontend/"

echo "Atualização concluída!"
