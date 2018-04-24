source ../env.sh
echo "base-url:" $NODE_BASE_URL
NODE_BASE_URL=$NODE_BASE_URL HTTP_SERVER_PORT=$HTTP_SERVER_PORT npm start --harmony

