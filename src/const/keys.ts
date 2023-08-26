const keys = {
  production: {
    botAuth: 'ODg4NDg4NTU3MzUyNzQ3MDIw.YUTbcw.LcJdmahTjcuPS0ExdEEMKGxwujQ',
    botId: '888488557352747020',
    adminGuild: '',
    managerApiAuth: '',
    managerHost: 'host.docker.internal',
    managerDb: {
      dbUser: 'root',
      dbPassword: 'Pass4Root',
      dbName: 'manager',
    },
    shardDb: {
      dbUser: 'root',
      dbPassword: 'Pass4Root',
      dbName: 'dbShard',
    },
  },
  development: {
    botAuth: 'ODg4NDg4NTU3MzUyNzQ3MDIw.YUTbcw.LcJdmahTjcuPS0ExdEEMKGxwujQ',
    botId: '888488557352747020',
    adminGuild: '905898879785005106',
    managerApiAuth: '',
    managerHost: 'host.docker.internal',
    managerDb: {
      dbUser: 'root',
      dbPassword: 'Pass4Root',
      dbName: 'manager',
    },
    shardDb: {
      dbUser: 'root',
      dbPassword: 'Pass4Root',
      dbName: 'dbShard',
    },
  },
};

export const get = () => {
  if (process.env.NODE_ENV == 'production') return keys.production;
  else return keys.development;
};

export default {
  get,
};
