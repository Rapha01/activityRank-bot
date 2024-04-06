import { isProduction } from '~/const/keys';
import { queryManager } from './managerDb';

const hostField = isProduction ? 'hostIntern' : 'hostExtern';

export async function get(guildId: string) {
  let res = await queryManager<{ host: string }[]>(
    `SELECT ${hostField} AS host FROM guildRoute LEFT JOIN dbShard ON guildRoute.dbShardId = dbShard.id WHERE guildId = ${guildId}`
  );

  if (res.length < 1) {
    await queryManager(`INSERT INTO guildRoute (guildId) VALUES (${guildId})`);
    res = await queryManager(
      `SELECT ${hostField} AS host FROM guildRoute LEFT JOIN dbShard ON guildRoute.dbShardId = dbShard.id WHERE guildId = ${guildId}`
    );
  }

  return res[0].host;
}
