const resetModel = require('../models/resetModel.js');
const guildMemberModel = require('../models/guild/guildMemberModel.js');
const fct = require('../../util/fct.js');
let jobIndex = 0,sleepTime,batchsize;

if (process.env.NODE_ENV == 'production') {
  batchsize = 10000;
} else {
  batchsize = 10;
}

module.exports = async () => {
  return new Promise(async function(resolve, reject) {
    try {
      let hrstart,hrend,resetJob,keys;
      keys = Object.keys(resetModel.resetJobs);

      if (keys.length > 0) {
        if (jobIndex >= keys.length)
          jobIndex = 0;

        resetJob = resetModel.resetJobs[keys[jobIndex]];
        hrstart = process.hrtime();
        await doResetJob(resetJob);
        hrend = process.hrtime(hrstart);
        jobIndex++;
        console.log('doResetJob ' + resetJob.type  + ' for ' + resetJob.cmdChannel.guild.id + ' finished after ' + hrend[0]  + 's.');
      }

      resolve();
    } catch (e) { console.log(e); }
  });
}

const doResetJob = (resetJob) => {
  return new Promise(async function (resolve, reject) {
    try {
      let count = 0;
      if (!resetJob || !resetJob.cmdChannel || !resetJob.cmdChannel.guild) {
        resetModel.resetJobs = {};
        return reject('Resetjob cache properties undefined.');
      }

      if (resetJob.type == 'all')
        count = await resetModel.storage.resetGuildAll(batchsize,resetJob.cmdChannel.guild);
      else if (resetJob.type == 'settings')
        count = await resetModel.storage.resetGuildSettings(batchsize,resetJob.cmdChannel.guild);
      else if (resetJob.type == 'stats')
        count = await resetModel.storage.resetGuildStats(batchsize,resetJob.cmdChannel.guild);
      else if (resetJob.type == 'textstats')
        count = await resetModel.storage.resetGuildStatsByType(batchsize,resetJob.cmdChannel.guild,'textMessage');
      else if (resetJob.type == 'voicestats')
        count = await resetModel.storage.resetGuildStatsByType(batchsize,resetJob.cmdChannel.guild,'voiceMinute');
      else if (resetJob.type == 'invitestats')
        count = await resetModel.storage.resetGuildStatsByType(batchsize,resetJob.cmdChannel.guild,'invite');
      else if (resetJob.type == 'votestats')
        count = await resetModel.storage.resetGuildStatsByType(batchsize,resetJob.cmdChannel.guild,'vote');
      else if (resetJob.type == 'bonusstats')
        count = await resetModel.storage.resetGuildStatsByType(batchsize,resetJob.cmdChannel.guild,'bonus');
      else if (resetJob.type == 'guildMembersStats' && resetJob.userIds.length > 0)
        count = await resetModel.storage.resetGuildMembersStats(batchsize,resetJob.cmdChannel.guild,resetJob.userIds);
      else if (resetJob.type == 'guildChannelsStats' && resetJob.channelIds.length > 0)
        count = await resetModel.storage.resetGuildChannelsStats(batchsize,resetJob.cmdChannel.guild,resetJob.channelIds);

      await resetJob.cmdChannel.send('Reset ' + count + ' rows...');
      if (count < batchsize) {
        await resetJob.cmdChannel.send('Finished reset.');
        delete resetModel.resetJobs[resetJob.cmdChannel.guild.id];
      }

      resolve();
    } catch (e) {
      resetModel.resetJobs = {};
      reject(e);
    }
  });
}
