const keys = {
  production: {
    botAuth: '',
    botId: '',
    managerApiAuth: '',
    managerHost: '',
    managerDb: {
      dbUser: '',
      dbPassword: '',
      dbName: '',
    },
    shardDb: {
      dbUser: '',
      dbPassword: '',
      dbName: '',
    },
  },
  development: {
    botAuth: '',
    botId: '',
    managerApiAuth: '',
    managerHost: '',
    managerDb: {
      dbUser: '',
      dbPassword: '',
      dbName: '',
    },
    shardDb: {
      dbUser: '',
      dbPassword: '',
      dbName: '',
    },
    admin: {
      serverIds: [''],
      channelIds: [''],
    },
  },
};

export const get = () => {
  if (process.env.NODE_ENV == 'production') return keys.production;
  else return keys.development;
};

// GENERATED: start of generated content by `exports-to-default`.
// [GENERATED: exports-to-default:v0]

export default {
  get,
};

// GENERATED: end of generated content by `exports-to-default`.
