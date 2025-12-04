import { createShardInstanceManager } from '@activityrank/database';
import { keys } from '#const/config.ts';
import { manager } from '#models/managerDb/managerDb.ts';

export const shards = createShardInstanceManager(
  {
    user: keys.shardDb.dbUser,
    password: keys.shardDb.dbPassword,
    database: keys.shardDb.dbName,
    connectionLimit: 3,
  },
  manager,
);
