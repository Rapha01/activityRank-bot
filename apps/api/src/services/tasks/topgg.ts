import { keys } from '#const/config.ts';
import { getShardServerCounts } from '#models/botShardStatModel.ts';

export async function runTopggTask() {
  console.log('[task | top.gg] Sending server count');

  const counts = await getShardServerCounts();

  // https://docs.top.gg/docs/API/bot/#post-stats
  const res = await fetch(`https://top.gg/api/bots/${keys.botId}/stats`, {
    method: 'POST',
    headers: {
      Authorization: keys.dblApiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      server_count: counts.reduce((prev, a) => prev + a),
      shards: counts,
      shard_count: counts.length,
    }),
  })
    .then(() => ({ ok: true as const }))
    .catch((err) => ({ ok: false as const, err }));

  if (!res.ok) {
    console.error('[task | top.gg (error)]', res.err);
  }
}
