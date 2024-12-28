import { queryManager } from './managerDb.js';

export async function get(guildId: string) {
  let res = await queryManager<{ host: string }[]>(
    `SELECT host FROM guildRoute LEFT JOIN dbShard ON guildRoute.dbShardId = dbShard.id WHERE guildId = ${guildId}`
  );

  if (res.length < 1) {
    await queryManager(`INSERT INTO guildRoute (guildId) VALUES (${guildId})`);
    res = await queryManager(
      `SELECT host FROM guildRoute LEFT JOIN dbShard ON guildRoute.dbShardId = dbShard.id WHERE guildId = ${guildId}`
    );
  }

  return res[0].host;
}
