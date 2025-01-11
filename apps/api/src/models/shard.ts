import { createShardInstanceManager } from '@activityrank/database';
import { manager } from './manager.js';
import { keys } from '../const/config.js';

export const shards = createShardInstanceManager(
  {
    user: keys.shardDb.dbUser,
    password: keys.shardDb.dbPassword,
    database: keys.shardDb.dbName,
    connectionLimit: 3,
  },
  manager,
);
