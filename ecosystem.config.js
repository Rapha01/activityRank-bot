module.exports = {
  apps: [{
    name: "activityrankbackup",
    script: "app.js",
    args: "",
    env: {
      NODE_ENV: "development"
    },
    env_production: {
      NODE_ENV: "production",
    }
  }]
}
