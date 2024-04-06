import { resetScoreByTime } from '~/models/resetModel';

export default defineTask({
  meta: {
    name: 'reset:month',
    description: 'Reset monthly statistics',
  },
  async run() {
    const { errorCount } = await resetScoreByTime('month');
    if (errorCount > 0) {
      return { result: `${errorCount} errors` };
    }
    return { result: 'Success' };
  },
});
