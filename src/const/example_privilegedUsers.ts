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

const savedUsers = {
  production: {
    uid: 4,
  },
  development: {},
};

export const userLevels =
  process.env.NODE_ENV === 'production'
    ? savedUsers.production
    : savedUsers.development;

export const users =
  process.env.NODE_ENV === 'production'
    ? Object.keys(savedUsers.production)
    : Object.keys(savedUsers.development);


// GENERATED: start of generated content by `exports-to-default`.
// [GENERATED: exports-to-default:v0]

export default {
    PRIVILEGE_LEVELS,
    userLevels,
    users,
}

// GENERATED: end of generated content by `exports-to-default`.

