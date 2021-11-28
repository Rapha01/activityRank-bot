module.exports = {
	name: 'threadCreate',
	execute(thread) {
        return new Promise(async function (resolve, reject) {
            try {
                thread.join()
                resolve();
            } catch (e) { reject(e); }
        });
    },
}
