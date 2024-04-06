import { resetScoreByTime } from '~/models/resetModel';

export default defineTask({
  meta: {
    name: 'reset:day',
    description: 'Reset daily statistics',
  },
  async run() {
    const { errorCount } = await resetScoreByTime('day');
    if (errorCount > 0) {
      return { result: `${errorCount} errors` };
    }
    return { result: 'Success' };
  },
});
