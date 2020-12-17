const statFlushCache = require('../statFlushCache.js');

exports.round = 0;

exports.update = (member,channel) => {
  return new Promise(async function(resolve, reject) {
    try {
      const now = Date.now() / 1000;

      if (!member.appData.lastVoiceXpDate || member.appData.lastVoiceXpRound < exports.round - 2) {
        member.appData.lastVoiceXpDate = now;
        member.appData.lastVoiceXpRound = exports.round;
        return resolve();
      }

      member.appData.lastVoiceXpRound = exports.round;
      const minutesToAdd = Math.floor((now - member.appData.lastVoiceXpDate) / 60);
      const remainderSeconds = Math.round(now - member.appData.lastVoiceXpDate) % 60;

      if (minutesToAdd < 1)
        return resolve();

      member.appData.lastVoiceXpDate = now - remainderSeconds;
      await statFlushCache.addVoiceMinute(member,channel,minutesToAdd);
      resolve();
    } catch (e) { reject(e); }
  });
}
