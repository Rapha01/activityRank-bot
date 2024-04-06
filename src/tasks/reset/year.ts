import { resetScoreByTime } from '~/models/resetModel';

export default defineTask({
  meta: {
    name: 'reset:year',
    description: 'Reset yearly statistics',
  },
  async run() {
    const { errorCount } = await resetScoreByTime('year');
    if (errorCount > 0) {
      return { result: `${errorCount} errors` };
    }
    return { result: 'Success' };
  },
});
