module.exports = {
	name: 'guildMemberRemove',
	execute(member) {
        return new Promise(async function (resolve, reject) {
            try {
                if (member.user.bot) { return resolve(); }
                resolve();
            } catch (e) { reject(e); }
        });
  },
};


