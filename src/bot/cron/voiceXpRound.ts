import fct from '../../util/fct.js';
import guildChannelModel from '../models/guild/guildChannelModel.js';
import guildMemberModel from '../models/guild/guildMemberModel.js';
import guildModel from '../models/guild/guildModel.js';
import skip from '../skip.js';
import statFlushCache from '../statFlushCache.js';
import noXpUtil from '../util/noXpUtil.js';
import { ChannelType, type Guild, type Client } from 'discord.js';
let minutesToAdd = 0,
  leftover = 0,
  round = 0;

export default async (client: Client) => {
  const roundStart = Date.now() / 1000;

  for (const _guild of client.guilds.cache) {
    const guild = _guild[1];

    try {
      await fct.sleep(200);

      if (!skip(guild.id)) await rankVoiceGuild(guild);
    } catch (err) {
      client.logger.warn({ err, guild }, 'Error in voiceXpRound');
    }
  }

  await fct.sleep(2000);

  const roundEnd = Date.now() / 1000;
  const secondsToAdd = roundEnd - roundStart + leftover;
  minutesToAdd = Math.floor(secondsToAdd / 60);
  leftover = Math.round(secondsToAdd % 60);

  if (round % 5 == 0)
    client.logger.debug(
      `[Rank Voice] #${round.toString().padEnd(4)}: ${minutesToAdd} (${leftover
        .toString()
        .padEnd(2)})`,
    );

  round++;
};

// existTwoUnmutedMembers(channel.members)) { && guildchannel.noxp != 1
const rankVoiceGuild = async (guild: Guild) => {
  await guildModel.cache.load(guild);

  if (!guild.appData.voiceXp) return;

  const voiceChannels = guild.channels.cache.filter(
    (channel) => channel.type == ChannelType.GuildVoice,
  );

  for (const _channel of voiceChannels) {
    const channel = _channel[1];
    await guildChannelModel.cache.load(channel);

    if (
      (await givesXp(channel)) &&
      (guild.appData.allowSoloXp || existMultipleMembers(channel.members))
    )
      await rankVoiceChannel(channel);
  }
};

async function givesXp(channel) {
  if (channel.appData.noXp) return false;

  const parent = channel.parent;
  if (!parent) return true;

  await guildChannelModel.cache.load(parent);
  if (parent.appData.noXp) return false;

  return true;
}

const rankVoiceChannel = (channel) => {
  return new Promise(async function (resolve, reject) {
    try {
      for (let member of channel.members) {
        member = member[1];

        await guildMemberModel.cache.load(member);

        if (await noXpUtil.noVoiceXp(member, channel)) continue;

        if (minutesToAdd > 0) {
          await statFlushCache.addVoiceMinute(member, channel, minutesToAdd);
          await fct.sleep(200);
        }
      }

      return resolve();
    } catch (e) {
      reject(e);
    }
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
