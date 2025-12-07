import type { HonoRequest } from 'hono';
import { request } from 'undici';
import { manager } from '#models/manager.ts';
import { JSONHTTPException } from '#util/errors.ts';

export async function broadcastRequest(
  req: HonoRequest,
): Promise<
  ({ ok: false; info?: string; shardId: number } | { ok: true; data: unknown; shardId: number })[]
> {
  const proxiedPath = /.*?\/broadcast\/(.*)/.exec(req.path)?.[1];
  if (!proxiedPath) throw new JSONHTTPException(404, '/broadcast requires a further path');

  const body = await req.text();

  const botInstances = await manager.db
    .selectFrom('botShardStat')
    .select(['ip', 'shardId'])
    .execute();

  const promises = botInstances.map(async (instance) => {
    console.debug('broadcasting to instance', instance);

    const parsedUrl = new URL(proxiedPath, 'http://temp-hostname');
    parsedUrl.host = instance.ip;
    if (!parsedUrl.port) parsedUrl.port = '3010';

    console.debug(`broadcasting to shard ${instance.shardId}, ${parsedUrl.toString()}`);

    const proxiedHeaders = ['Content-Type', 'Authorization'];

    const headers = new Headers();
    for (const header of proxiedHeaders) {
      const headerValue = req.header(header);
      if (headerValue) {
        headers.set(header, headerValue);
      }
    }

    const { shardId } = instance;
    try {
      const response = await request(parsedUrl, { method: 'POST', body, headers });
      if (response.statusCode !== 200) {
        return {
          ok: false as const,
          info: `[${response.statusCode}] ${await response.body.text()}`,
          shardId,
        };
      }
      return { ok: true as const, data: await response.body.json(), shardId };
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
