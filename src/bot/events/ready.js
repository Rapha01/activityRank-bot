const cronScheduler = require('../cron/scheduler.js');

module.exports = {
	name: 'ready',
	async execute(client) {
        try {
            console.log(`Logged in as ${client.user.tag}!`);
            client.user.setActivity('Calculating..');
            await cronScheduler.start(client);
        } catch (e) { console.error(e); }
	},
};