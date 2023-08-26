import cronScheduler from '../cron/scheduler.js';

export default {
  name: 'disconnect',
  execute(msg, code) {
    if (code === 0) return console.log('client.onDisconnect: ', msg);

    client.connect();
  },
};
