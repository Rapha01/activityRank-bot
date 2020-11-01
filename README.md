pm2 start ecosystem.config.js --env production
pm2 start ecosystem.config.js --env production --watch
NODE_ENV=production forever --watch start -l console.log bot.js
docker-compose -f docker-compose-development.yml up
