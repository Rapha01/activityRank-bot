import { request } from 'undici';
import { manager } from '#models/manager.ts';

export async function broadcastRequest<T>(
  path: string,
  options: Parameters<typeof request>[1],
): Promise<
  ({ ok: false; info?: string; shardIds: number[] } | { ok: true; data: T; shardIds: number[] })[]
> {
  const botInstances = await manager.db
    .selectFrom('botShardStat')
    .select(['ip'])
    .distinct()
    .execute();

  const shardInstances = await manager.db
    .selectFrom('botShardStat')
    .select(['ip', 'shardId'])
    .execute();

  const promises = botInstances.map(async (instance) => {
    const shardIds = shardInstances
      .filter((inst) => inst.ip === instance.ip)
      .map((shard) => shard.shardId);

    const parsedUrl = new URL(path, 'http://temp-hostname');
    parsedUrl.host = instance.ip;
    if (!parsedUrl.port) parsedUrl.port = '3010';

    console.debug(`broadcasting to instance ${parsedUrl.toString()}`);

    try {
      const response = await request(parsedUrl, options);
      if (response.statusCode !== 200) {
        console.debug(
          `Error [${response.statusCode}] while broadcasting to shard.ip=${parsedUrl.toString()}`,
          await response.body.text(),
        );
        return {
          ok: false as const,
          info: `[${response.statusCode}] ${await response.body.text()}`,
          shardIds,
        };
      }
      const data = await response.body.json();
      return { ok: true as const, data: data as T, shardIds };
    } catch (err: any) {
      console.debug(`Error while broadcasting to shard.ip=${parsedUrl.toString()}`, err);
      if ('code' in err && err.code === 'ECONNREFUSED') {
        return { ok: false as const, info: `ECONNREFUSED "${parsedUrl}"`, shardIds };
      }
      return { ok: false as const, info: err.toString(), shardIds };
    }
  });

  return await Promise.all(promises);
}
