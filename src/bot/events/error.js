const cronScheduler = require('../cron/scheduler.js');

module.exports = {
	name: 'error',
	execute(err) {
        console.log('client.onError: ', err);
	},
};
