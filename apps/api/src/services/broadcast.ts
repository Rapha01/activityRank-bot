import { request } from 'undici';
import { manager } from '#models/manager.ts';

export async function broadcastRequest<T>(
  path: string,
  options: Parameters<typeof request>[1],
): Promise<
  ({ ok: false; info?: string; shardId: number } | { ok: true; data: T; shardId: number })[]
> {
  const botInstances = await manager.db
    .selectFrom('botShardStat')
    .select(['ip', 'shardId'])
    .execute();

  const promises = botInstances.map(async (instance) => {
    console.debug('broadcasting to instance', instance);

    const parsedUrl = new URL(path, 'http://temp-hostname');
    parsedUrl.host = instance.ip;
    if (!parsedUrl.port) parsedUrl.port = '3010';

    console.debug(`broadcasting to shard ${instance.shardId}, ${parsedUrl.toString()}`);

    const { shardId } = instance;
    try {
      const response = await request(parsedUrl, options);
      if (response.statusCode !== 200) {
        console.debug(
          `Error [${response.statusCode}] while broadcasting to shard=${shardId}`,
          response,
        );
        return {
          ok: false as const,
          info: `[${response.statusCode}] ${await response.body.text()}`,
          shardId,
        };
      }
      const data = await response.body.json();
      return { ok: true as const, data: data as T, shardId };
    } catch (err: any) {
      console.debug(`Error while broadcasting to shard=${shardId}`, err);
      if ('code' in err && err.code === 'ECONNREFUSED') {
        return { ok: false as const, info: `ECONNREFUSED "${parsedUrl}"`, shardId };
      }
      return { ok: false as const, info: err.toString(), shardId };
    }
  });

  return await Promise.all(promises);
}
