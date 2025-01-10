import { shards } from './shardDb.js';
import { manager } from './managerDb.js';

let defaultAll: any = null;

export async function setUser(userId: string, field: string, value: unknown) {
  const dbHost = await getDbHost(userId);
  await shards
    .get(dbHost)
    .db.insertInto('user')
    .values({ userId, [field]: value })
    .onDuplicateKeyUpdate({ [field]: value })
    .executeTakeFirstOrThrow();
}

export async function getUser(userId: string) {
  const dbHost = await getDbHost(userId);
  const { db } = shards.get(dbHost);

  const res = await db
    .selectFrom('user')
    .selectAll()
    .where('userId', '=', userId)
    .executeTakeFirst();

  if (res) {
    return res;
  }

  if (!defaultAll) {
    defaultAll = await db
      .selectFrom('user')
      .selectAll()
      .where('userId', '=', '0')
      .executeTakeFirstOrThrow();
  }
  return defaultAll;
}

async function getDbHost(userId: string) {
  const select = manager.db
    .selectFrom('userRoute')
    .leftJoin('dbShard', 'userRoute.dbShardId', 'dbShard.id')
    .select('host')
    .where('userId', '=', userId);

  const res = await select.executeTakeFirst();
  if (res?.host) {
    return res.host;
  }

  await manager.db.insertInto('userRoute').values({ userId }).executeTakeFirstOrThrow();
  const newValue = await select.executeTakeFirstOrThrow();
  if (!newValue.host) {
    throw new Error(`Failed to get DB host for user "${userId}"`);
  }
  return newValue.host;
}
