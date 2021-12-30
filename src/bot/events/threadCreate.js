module.exports = {
	name: 'threadCreate',
	execute(thread) {
        return new Promise(async function (resolve, reject) {
            try {
                if (thread.type == 'GUILD_PUBLIC_THREAD')
                    thread.join()
                resolve();
            } catch (e) { reject(e); }
        });
    },
}
