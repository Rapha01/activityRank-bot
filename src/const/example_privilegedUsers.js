/*
4: Owner
3: Developer
2: Moderator
1: Help Staff
*/

const users = {
  production: {
    'uid': 4,
  },
  development: {
  },
};

module.exports.get = () => {
  if (process.env.NODE_ENV == 'production')
    return users.production;
  else
    return users.development;
};
