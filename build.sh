source ./env.sh
echo "base-url:" $NODE_BASE_URL
NODE_BASE_URL=$NODE_BASE_URL npm run build --harmony
