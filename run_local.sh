#!/bin/bash
echo "Generating local certificates..."

# Generating local certificates
mkdir -p "./certificates/certbot/conf/live/localhost"
openssl req -x509 -nodes -newkey rsa:4096 -days 1 \
    -keyout './certificates/certbot/conf/live/localhost/privkey.pem' \
    -out './certificates/certbot/conf/live/localhost/fullchain.pem' \
    -subj '/CN=localhost'

# Copy certeficates to the room server
mkdir -p ./room_server/server/certificates/certbot/conf/live/localhost
cp ./certificates/certbot/conf/live/localhost/privkey.pem ./room_server/server/certificates/certbot/conf/live/localhost/privkey.pem 
cp ./certificates/certbot/conf/live/localhost/fullchain.pem ./room_server/server/certificates/certbot/conf/live/localhost/fullchain.pem

# Download recommended TLS parameters
if [ ! -e "./certificates/certbot/conf/options-ssl-nginx.conf" ] || [ ! -e "./certificates/certbot/conf/ssl-dhparams.pem" ]; then
  mkdir -p "./certificates/certbot/conf"
  curl -s https://raw.githubusercontent.com/certbot/certbot/master/certbot-nginx/certbot_nginx/_internal/tls_configs/options-ssl-nginx.conf > "./certificates/certbot/conf/options-ssl-nginx.conf"
  curl -s https://raw.githubusercontent.com/certbot/certbot/master/certbot/certbot/ssl-dhparams.pem > "./certificates/certbot/conf/ssl-dhparams.pem"
  echo
fi

echo "Done"