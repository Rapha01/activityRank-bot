const levelManager = require('../levelManager.js');
const fct = require('../../util/fct.js');
const guildChannelModel = require('../models/guild/guildChannelModel.js');
const guildMemberModel = require('../models/guild/guildMemberModel.js');
const guildModel = require('../models/guild/guildModel.js');
const skip = require('../skip.js');
const statFlushCache = require('../statFlushCache.js');
const noXpUtil = require('../util/noXpUtil.js');
let minutesToAdd = 0,leftover= 0,round = 0,hrstart = process.hrtime();

module.exports = async (client) => {
  return new Promise(async function(resolve, reject) {
    try {
      const roundTimeSec = process.hrtime(hrstart)[0];
      const secondsToAdd = roundTimeSec + leftover;
      minutesToAdd = Math.floor(secondsToAdd / 60);
      leftover = Math.round(secondsToAdd % 60);

      hrstart = process.hrtime();
      round++;

      //console.log('RankVoice round started.');

      for (let guild of client.guilds.cache) {
        guild = guild[1];

        try {
          await fct.sleep(200);

          if (!skip(guild.id))
            await rankVoiceGuild(guild);

        } catch (e) { console.log(e); }
      }

      await fct.sleep(2000);

      console.log('RankVoice round '+ round +' finished.\n' + 'secondsToAdd ' + secondsToAdd + ', minutesToAdd ' + minutesToAdd + ', leftover ' + leftover );

      resolve();
    } catch (e) { reject(e); }
  });
}

//existTwoUnmutedMembers(channel.members)) { && guildchannel.noxp != 1
const rankVoiceGuild = (guild) => {
  return new Promise(async function(resolve, reject) {
    try {
      let oldTotalScore,newTotalScore,noXp;
      let active = false;

      await guildModel.cache.load(guild);

      if (!guild.appData.voiceXp)
        return resolve();

      const voiceChannels = guild.channels.cache.filter(channel => channel.type == 'voice');

      for  (let channel of voiceChannels) {
        channel = channel[1];
        await guildChannelModel.cache.load(channel);

        if (!channel.appData.noXp)
          await rankVoiceChannel(channel);
      }

      resolve();
    } catch (e) { reject(e); }
  });
}

const rankVoiceChannel = (channel) => {
  return new Promise(async function(resolve, reject) {
    try {
      for (let member of channel.members) {
        member = member[1];

        await guildMemberModel.cache.load(member);

        if (await noXpUtil.noVoiceXp(member,channel))
          return resolve();

        if (minutesToAdd > 0) {
          await statFlushCache.addVoiceMinute(member,channel,minutesToAdd);
          await fct.sleep(200);
        }
      }
      resolve();
    } catch (e) { reject(e); }
  });
}



/*
function existTwoUnmutedMembers(members) {
  if (members.size < 2)
    return false;

  let nrOfActiveMembers = 0;
  for (let member of members) {
    member = member[1];
    if(member.voice.selfMute == false && member.voice.serverMute == false && member.user.bot == false)
      nrOfActiveMembers++;
  }

  if (nrOfActiveMembers >=2)
    return true;
  else
    return false;
}*/
