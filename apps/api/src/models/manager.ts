import { createManagerInstance } from '@activityrank/database';
import { keys } from '../const/config.ts';

export const manager = createManagerInstance({
  host: keys.managerHost,
  user: keys.managerDb.dbUser,
  password: keys.managerDb.dbPassword,
  database: keys.managerDb.dbName,
  connectionLimit: 3,
});
