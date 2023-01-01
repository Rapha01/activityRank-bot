const keys = {
  production: {
    dblApiKey:'',
    botId: '',
    managerApiAuth: '',
    managerHost: '',
    managerDb: {
      dbUser: '',
      dbPassword: '',
      dbName: ''
    },
    shardDb: {
      dbUser: '',
      dbPassword: '',
      dbName: ''
    },
    patreonAccessToken: ''
  },
  development: {
    dblApiKey:'',
    botId: '',
    managerApiAuth: '',
    managerHost: '',
    managerDb: {
      dbUser: '',
      dbPassword: '',
      dbName: ''
    },
    shardDb: {
      dbUser: '',
      dbPassword: '',
      dbName: ''
    },
    patreonAccessToken: ''
  }
};

module.exports.get = () => {
  if (process.env.NODE_ENV == 'production')
    return keys.production;
  else
    return keys.development;
}
