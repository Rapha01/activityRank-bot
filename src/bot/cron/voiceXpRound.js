const levelManager = require('../levelManager.js');
const fct = require('../../util/fct.js');
const guildChannelModel = require('../models/guild/guildChannelModel.js');
const guildMemberModel = require('../models/guild/guildMemberModel.js');
const guildModel = require('../models/guild/guildModel.js');
const skip = require('../skip.js');
const statFlushCache = require('../statFlushCache.js');
const noXpUtil = require('../util/noXpUtil.js');
const { ChannelType } = require('discord.js');
let minutesToAdd = 0, leftover = 0, round = 0;

module.exports = async (client) => {
  return new Promise(async function(resolve, reject) {
    try {
      const roundStart = Date.now() / 1000;

      for (let guild of client.guilds.cache) {
        guild = guild[1];

        try {
          await fct.sleep(200);

          if (!skip(guild.id))
            await rankVoiceGuild(guild);

        } catch (e) { console.log(e); }
      }

      await fct.sleep(2000);

      const roundEnd = Date.now() / 1000;
      const secondsToAdd = (roundEnd - roundStart) + leftover;
      minutesToAdd = Math.floor(secondsToAdd / 60);
      leftover = Math.round(secondsToAdd % 60);
      // console.log(client.options.shards);
      console.log('RankVoice for shard ' + client.options.shards[0] + ' round ' + round + ' finished. ' + 'minutesToAdd ' + minutesToAdd + ', leftover ' + leftover);
      round++;
      resolve();
    } catch (e) { reject(e); }
  });
};

// existTwoUnmutedMembers(channel.members)) { && guildchannel.noxp != 1
const rankVoiceGuild = (guild) => {
  return new Promise(async function(resolve, reject) {
    try {
      await guildModel.cache.load(guild);

      if (!guild.appData.voiceXp)
        return resolve();

      const voiceChannels = guild.channels.cache.filter(channel => channel.type == ChannelType.GuildVoice);

      for (let channel of voiceChannels) {
        channel = channel[1];
        await guildChannelModel.cache.load(channel);

        if (checkNoXpChannel(channel) && (guild.appData.allowSoloXp || existMultipleMembers(channel.members)))
          await rankVoiceChannel(channel);
      }

      resolve();
    } catch (e) { reject(e); }
  });
};

async function checkNoXpChannel(channel) {
  if (channel.appData.noXp) return false;

  if (channel.type === ChannelType.PublicThread || channel.type === ChannelType.PrivateThread) {
    const parentChannel = channel.parent;
    if (!parentChannel) return true;

    await guildChannelModel.cache.load(parentChannel);
    if (parentChannel.appData.noXp) return false;

    const parentCategory = parentChannel.parent;
    if (!parentCategory) return true;

    await guildChannelModel.cache.load(parentCategory);
    if (parentCategory.appData.noXp) return false;
  } else {
    const parent = channel.parent;
    if (!parent) return true;
    await guildChannelModel.cache.load(parent);
    if (parent.appData.noXp) return false;
  }
}

const rankVoiceChannel = (channel) => {
  return new Promise(async function(resolve, reject) {
    try {
      for (let member of channel.members) {
        member = member[1];

        await guildMemberModel.cache.load(member);

        if (await noXpUtil.noVoiceXp(member, channel))
          continue;

        if (minutesToAdd > 0) {
          await statFlushCache.addVoiceMinute(member, channel, minutesToAdd);
          await fct.sleep(200);
        }
      }

      return resolve();
    } catch (e) { reject(e); }
  });
};

function existMultipleMembers(members) {
  if (members.size < 2) return false;

  let activeMembers = 0;
  for (let member of members) {
    member = member[1];
    if (!member.user.bot) activeMembers++;
  }
  if (activeMembers >= 2) return true;
  else return false;
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
