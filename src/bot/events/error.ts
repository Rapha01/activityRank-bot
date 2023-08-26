import cronScheduler from '../cron/scheduler.js';

export default {
  name: 'error',
  execute(err) {
    console.log('client.onError: ', err);
  },
};
