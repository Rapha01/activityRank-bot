/*
4: Owner
3: Developer
2: Moderator
1: Help Staff
*/

// Prevent magic numbers
export const PRIVILEGE_LEVELS = {
  Owner: 4,
  Developer: 3,
  Moderator: 2,
  HelpStaff: 1,
};

const users = {
  production: {
    uid: 4,
  },
  development: {},
};

export const userLevels = process.env.NODE_ENV === 'production' ? users.production : users.development;

export const users = process.env.NODE_ENV === 'production'
  ? Object.keys(users.production)
  : Object.keys(users.development);
