import { getShardStats } from '~/models/botShardStatModel.js';

export default eventHandler(async (event) => {
  return { stats: await getShardStats() };
});
