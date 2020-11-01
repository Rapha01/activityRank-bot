const localApi = require('../api.js');

exports.get = (guildId,userId) => {
  return new Promise(async function (resolve, reject) {
    try {
      const conditions = {guildid: guildId,userid: userId};
      let guildmember = await localApi.getSingle('guildmember',conditions);

      if (!guildmember) {
        await localApi.loadSingle('guildmember',conditions);
        guildmember = await localApi.getSingle('guildmember',conditions);
      }

      resolve(guildmember);
    } catch (e) { reject(e); }
  });
}

exports.set = (guildId,userId,field,value) => {
  return new Promise(async function (resolve, reject) {
    try {
      await localApi.setSingle('guildmember',{guildid: guildId,userid: userId},field,value);
      resolve();
    } catch (e) { reject(e); }
  });
}

exports.getTextmessageCooldownSecondsToWait = function(myGuild,myGuildMember) {
  const temp = new Date(myGuildMember.lasttextmessage);
  const lastTimestamp = new Date(temp.getTime() - temp.getTimezoneOffset() * 60000).getTime() / 1000;
  const nowTimestamp = Date.parse(new Date()) / 1000;
  const secondsToWait = lastTimestamp + myGuild.textmessagecooldown - nowTimestamp;

  return secondsToWait;
}
