import { resetScoreByTime } from '~/models/resetModel';

export default defineTask({
  meta: {
    name: 'reset:week',
    description: 'Reset weekly statistics',
  },
  async run() {
    const { errorCount } = await resetScoreByTime('week');
    if (errorCount > 0) {
      return { result: `${errorCount} errors` };
    }
    return { result: 'Success' };
  },
});
