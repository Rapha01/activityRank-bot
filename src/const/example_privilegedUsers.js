/*
4: Owner
3: Developer
2: Moderator
1: Help Staff
*/

// Prevent magic numbers
module.exports.PRIVILEGE_LEVELS = {
  'Owner': 4,
  'Developer': 3,
  'Moderator': 2,
  'HelpStaff': 1,
};

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
