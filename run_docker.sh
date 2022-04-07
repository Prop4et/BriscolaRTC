# Setup local configs
chmod +x run_local.sh
./run_local.sh

# Build docker
docker-compose build --no-cache

# Start docker
docker-compose up