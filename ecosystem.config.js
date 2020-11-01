module.exports = {
  apps: [{
    name: "activityrankbot",
    script: "bot.js",
    args: "",
    env_development: {
      NODE_ENV: "development",
    },
    env_production: {
      NODE_ENV: "production",
    }
  }]
}
