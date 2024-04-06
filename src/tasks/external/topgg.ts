import { getKeys } from '~/const/keys';
import { getShardServerCounts } from '~/models/botShardStatModel';
const keys = getKeys();

const headers = new Headers();
headers.set('Authorization', keys.dblApiKey);
headers.set('Content-Type', 'application/json;charset=UTF-8');

export default defineTask({
  meta: {
    name: 'external:topgg',
    description: 'Update top.gg server count',
  },
  async run() {
    console.log('[task | top.gg] Sending server count');

    const count = await getShardServerCounts();

    const headers = new Headers();

    const res = await $fetch(`https://top.gg/api/bots/${keys.botId}/stats`, {
      body: { server_count: count },
      headers,
      method: 'POST',
    })
      .then(() => [true] as const)
      .catch((err) => [false, err] as const);

    if (res[0] === true) {
      return { result: 'Success' };
    } else {
      console.error('[task | top.gg (error)]', res[1]);
      return { result: 'Failure' };
    }
  },
});
