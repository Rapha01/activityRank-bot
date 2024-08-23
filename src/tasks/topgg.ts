import { ofetch } from 'ofetch';
import { getShardServerCounts } from '../models/botShardStatModel.js';
import { keys } from '../const/keys.js';

const headers = new Headers();
headers.set('Authorization', keys.dblApiKey);
headers.set('Content-Type', 'application/json;charset=UTF-8');

export async function runTopggTask() {
  console.log('[task | top.gg] Sending server count');

  const count = await getShardServerCounts();

  const headers = new Headers();

  const res = await ofetch(`https://top.gg/api/bots/${keys.botId}/stats`, {
    body: { server_count: count },
    headers,
    method: 'POST',
  })
    .then(() => [true] as const)
    .catch((err) => [false, err] as const);

  if (res[0] !== true) console.error('[task | top.gg (error)]', res[1]);
}
