import { manager } from './manager.js';

export async function getGuildHost(guildId: string) {
  const select = manager.db
    .selectFrom('guildRoute')
    .leftJoin('dbShard', 'guildRoute.dbShardId', 'dbShard.id')
    .select('host')
    .where('guildId', '=', guildId);

  const res = await select.executeTakeFirst();
  if (res?.host) {
    return res.host;
  }

  await manager.db.insertInto('guildRoute').values({ guildId }).executeTakeFirstOrThrow();
  const newValue = await select.executeTakeFirstOrThrow();
  if (!newValue.host) {
    throw new Error(`Failed to map guild ID "${guildId}" to a database host.`);
  }
  return newValue.host;
}
