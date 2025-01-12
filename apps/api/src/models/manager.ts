import { createManagerInstance } from '@activityrank/database';
import { keys } from '../const/config.js';

export const manager = createManagerInstance({
  host: keys.managerHost,
  user: keys.managerDb.dbUser,
  password: keys.managerDb.dbPassword,
  database: keys.managerDb.dbName,
  connectionLimit: 3,
});
