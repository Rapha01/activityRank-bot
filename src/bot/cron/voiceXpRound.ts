import fct from '../../util/fct.js';
import guildChannelModel from '../models/guild/guildChannelModel.js';
import guildModel from '../models/guild/guildModel.js';
import skip from '../skip.js';
import statFlushCache from '../statFlushCache.js';
import noXpUtil from '../util/noXpUtil.js';
import type {
  Guild,
  Client,
  VoiceBasedChannel,
  Collection,
  GuildMember,
  GuildBasedChannel,
} from 'discord.js';

let minutesToAdd = 0,
  leftover = 0,
  round = 0;

export default async (client: Client) => {
  const roundStart = Date.now() / 1000;

  for (const guild of client.guilds.cache.values()) {
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
  const cachedGuild = await guildModel.cache.get(guild);

  if (!cachedGuild.db.voiceXp) return;

  const voiceChannels = guild.channels.cache.filter<VoiceBasedChannel>(
    (channel): channel is VoiceBasedChannel => channel.isVoiceBased(),
  );

  for (const channel of voiceChannels.values()) {
    if (
      (await givesXp(channel)) &&
      (cachedGuild.db.allowSoloXp || existMultipleMembers(channel.members))
    )
      await rankVoiceChannel(channel);
  }
};

async function givesXp(channel: GuildBasedChannel) {
  const cachedChannel = await guildChannelModel.cache.get(channel);

  if (cachedChannel.db.noXp) return false;

  const parent = channel.parent;
  if (!parent) return true;

  const cachedParent = await guildChannelModel.cache.get(parent);
  if (cachedParent.db.noXp) return false;

  return true;
}

const rankVoiceChannel = async (channel: VoiceBasedChannel) => {
  for (const member of channel.members.values()) {
    if (await noXpUtil.noVoiceXp(member, channel)) continue;

    if (minutesToAdd > 0) {
      await statFlushCache.addVoiceMinute(member, channel, minutesToAdd);
      await fct.sleep(200);
    }
  }
};

function existMultipleMembers(members: Collection<string, GuildMember>) {
  if (members.size < 2) return false;

  let activeMembers = 0;
  for (let member of members.values()) {
    if (!member.user.bot) activeMembers++;
    if (activeMembers >= 2) return true;
  }

  return false;
}
