import type { Client, Guild, GuildMember, TextBasedChannel, VoiceBasedChannel } from 'discord.js';
import levelManager from './levelManager.js';
import type { StatType } from 'models/types/enums.js';

export async function addTextMessage(
  member: GuildMember,
  channel: TextBasedChannel,
  count: number,
) {
  // Add to FlushCache
  let textMessageCache = buildStatFlushCache(member, 'textMessage');

  count = count * 1;

  let entry = textMessageCache[member.id + channel.id];
  if (!entry)
    entry = textMessageCache[member.id + channel.id] = {
      guildId: member.guild.id,
      userId: member.id,
      channelId: channel.id,
      count: count,
    };
  else entry.count += count;

  await addTotalXp(member, count * member.guild.appData.xpPerTextMessage);

  if (member.guild.appData.bonusUntilDate > Date.now() / 1000)
    await addBonus(member, count * member.guild.appData.bonusPerTextMessage);
}

export async function addVoiceMinute(
  member: GuildMember,
  channel: VoiceBasedChannel,
  count: number,
) {
  // Add to FlushCache
  let voiceMinuteCache = buildStatFlushCache(member, 'voiceMinute');

  count = count * 1;

  let entry = voiceMinuteCache[member.id + channel.id];
  if (!entry)
    entry = voiceMinuteCache[member.id + channel.id] = {
      guildId: member.guild.id,
      userId: member.id,
      channelId: channel.id,
      count: count,
    };
  else entry.count += count;

  await addTotalXp(member, count * member.guild.appData.xpPerVoiceMinute);

  if (member.guild.appData.bonusUntilDate > Date.now() / 1000)
    await addBonus(member, count * member.guild.appData.bonusPerVoiceMinute);
}

export const addInvite = (member: GuildMember, count: number) => {
  return new Promise(async function (resolve, reject) {
    try {
      let inviteCache = buildStatFlushCache(member, 'invite');

      count = count * 1;

      let entry = inviteCache[member.id];
      if (!entry)
        entry = inviteCache[member.id] = {
          guildId: member.guild.id,
          userId: member.id,
          count: count,
        };
      else entry.count += count;

      await addTotalXp(member, count * member.guild.appData.xpPerInvite);

      if (member.guild.appData.bonusUntilDate > Date.now() / 1000)
        await addBonus(member, count * member.guild.appData.bonusPerInvite);

      resolve();
    } catch (e) {
      reject(e);
    }
  });
};

export const addVote = (member: GuildMember, count: number) => {
  return new Promise(async function (resolve, reject) {
    try {
      let voteCache = buildStatFlushCache(member, 'vote');

      count = count * 1;

      let entry = voteCache[member.id];
      if (!entry)
        entry = voteCache[member.id] = {
          guildId: member.guild.id,
          userId: member.id,
          count: count,
        };
      else entry.count += count;

      await addTotalXp(member, count * member.guild.appData.xpPerVote);

      if (member.guild.appData.bonusUntilDate > Date.now() / 1000)
        await addBonus(member, count * member.guild.appData.bonusPerVote);

      resolve();
    } catch (e) {
      reject(e);
    }
  });
};

export const addBonus = (member: GuildMember, count: number) => {
  return new Promise(async function (resolve, reject) {
    try {
      let bonusCache = buildStatFlushCache(member, 'bonus');

      count = count * 1;

      let entry = bonusCache[member.id];
      if (!entry)
        entry = bonusCache[member.id] = {
          guildId: member.guild.id,
          userId: member.id,
          count: count,
        };
      else entry.count += count;

      if (member.appData) await addTotalXp(member, count * member.guild.appData.xpPerBonus);

      resolve();
    } catch (e) {
      reject(e);
    }
  });
};

const addTotalXp = (member: GuildMember, xp: number) => {
  return new Promise(async function (resolve, reject) {
    try {
      const oldTotalXp = member.appData.totalXp;
      member.appData.totalXp += xp;
      const newTotalXp = member.appData.totalXp;

      await levelManager.checkLevelUp(member, oldTotalXp, newTotalXp);

      resolve();
    } catch (e) {
      reject(e);
    }
  });
};

// beta function
export const directlyAddBonus = async (
  userId: string,
  guild: Guild,
  client: Client,
  count: number,
) => {
  const bonusCache = directlyBuildStatFlushCache(client, guild, 'bonus');

  count *= 1; // ?
  let entry = bonusCache[userId];
  if (!entry) entry = bonusCache[userId] = { guildId: guild.id, userId, count };
  else entry.count += count;
};

export interface StatFlushCacheGuildEntry {
  guildId: string;
  userId: string;
  count: number;
}
export interface StatFlushCacheChannelEntry extends StatFlushCacheGuildEntry {
  channelId: string;
}
export interface StatFlushCache {
  textMessage?: Record<string, StatFlushCacheChannelEntry>;
  voiceMinute?: Record<string, StatFlushCacheChannelEntry>;
  invite?: Record<string, StatFlushCacheGuildEntry>;
  vote?: Record<string, StatFlushCacheGuildEntry>;
  bonus?: Record<string, StatFlushCacheGuildEntry>;
}

const buildStatFlushCache = (member: GuildMember, type: StatType) => {
  const statFlushCache = member.client.appData.statFlushCache;
  const dbHost = member.guild.appData.dbHost;

  if (!statFlushCache[dbHost]) statFlushCache[dbHost] = {};

  if (!statFlushCache[dbHost][type]) statFlushCache[dbHost][type] = {};

  return statFlushCache[dbHost][type];
};

const directlyBuildStatFlushCache = (client: Client, guild: Guild, type: StatType) => {
  const statFlushCache = client.appData.statFlushCache;
  const dbHost = guild.appData.dbHost;

  if (!statFlushCache[dbHost]) statFlushCache[dbHost] = {};

  if (!statFlushCache[dbHost][type]) statFlushCache[dbHost][type] = {};

  return statFlushCache[dbHost][type];
};

export default {
  addTextMessage,
  addVoiceMinute,
  addInvite,
  addVote,
  addBonus,
  directlyAddBonus,
};
