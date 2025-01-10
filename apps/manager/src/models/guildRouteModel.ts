import { manager } from './managerDb.js';

export async function get(guildId: string) {
  const select = manager.db
    .selectFrom('guildRoute')
    .leftJoin('dbShard', 'guildRoute.dbShardId', 'dbShard.id')
    .select('host')
    .where('guildId', '=', guildId);

  const res = await select.executeTakeFirst();
  if (res) {
    return res.host;
  }

  await manager.db.insertInto('guildRoute').values({ guildId }).executeTakeFirstOrThrow();
  const newValue = await select.executeTakeFirstOrThrow();
  return newValue.host;
}
