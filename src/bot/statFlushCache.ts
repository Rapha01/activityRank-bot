import type { Client, Guild, GuildBasedChannel, GuildMember, VoiceBasedChannel } from 'discord.js';
import levelManager from './levelManager.js';
import type { StatType } from 'models/types/enums.js';
import guildModel from './models/guild/guildModel.js';
import guildMemberModel from './models/guild/guildMemberModel.js';
import { deprecate } from 'node:util';

export async function addTextMessage(
  member: GuildMember,
  // not textBased because forums can be ranked
  channel: GuildBasedChannel,
  count: number,
) {
  // Add to FlushCache
  let textMessageCache = await buildStatFlushCache(member, 'textMessage');

  const cachedGuild = await guildModel.cache.get(member.guild);

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

  await addTotalXp(member, count * cachedGuild.db.xpPerTextMessage);

  if (cachedGuild.db.bonusUntilDate > Date.now() / 1000)
    await addBonus(member, count * cachedGuild.db.bonusPerTextMessage);
}

export async function addVoiceMinute(
  member: GuildMember,
  channel: VoiceBasedChannel,
  count: number,
) {
  // Add to FlushCache
  let voiceMinuteCache = await buildStatFlushCache(member, 'voiceMinute');

  const cachedGuild = await guildModel.cache.get(member.guild);

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

  await addTotalXp(member, count * cachedGuild.db.xpPerVoiceMinute);

  if (cachedGuild.db.bonusUntilDate > Date.now() / 1000)
    await addBonus(member, count * cachedGuild.db.bonusPerVoiceMinute);
}

export const addInvite = async (member: GuildMember, count: number) => {
  let inviteCache = await buildStatFlushCache(member, 'invite');

  const cachedGuild = await guildModel.cache.get(member.guild);

  count = count * 1;

  let entry = inviteCache[member.id];
  if (!entry)
    entry = inviteCache[member.id] = {
      guildId: member.guild.id,
      userId: member.id,
      count: count,
    };
  else entry.count += count;

  await addTotalXp(member, count * cachedGuild.db.xpPerInvite);

  if (cachedGuild.db.bonusUntilDate > Date.now() / 1000)
    await addBonus(member, count * cachedGuild.db.bonusPerInvite);
};

export const addVote = async (member: GuildMember, count: number) => {
  let voteCache = await buildStatFlushCache(member, 'vote');

  const cachedGuild = await guildModel.cache.get(member.guild);

  count = count * 1;

  let entry = voteCache[member.id];
  if (!entry)
    entry = voteCache[member.id] = {
      guildId: member.guild.id,
      userId: member.id,
      count: count,
    };
  else entry.count += count;

  await addTotalXp(member, count * cachedGuild.db.xpPerVote);

  if (cachedGuild.db.bonusUntilDate > Date.now() / 1000)
    await addBonus(member, count * cachedGuild.db.bonusPerVote);
};

export const addBonus = async (member: GuildMember, count: number) => {
  let bonusCache = await buildStatFlushCache(member, 'bonus');

  const cachedGuild = await guildModel.cache.get(member.guild);

  count = count * 1;

  let entry = bonusCache[member.id];
  if (!entry)
    entry = bonusCache[member.id] = {
      guildId: member.guild.id,
      userId: member.id,
      count: count,
    };
  else entry.count += count;

  await addTotalXp(member, count * cachedGuild.db.xpPerBonus);
};

const addTotalXp = async (member: GuildMember, xp: number) => {
  const cachedMember = await guildMemberModel.cache.get(member);

  const oldTotalXp = cachedMember.cache.totalXp;
  cachedMember.cache.totalXp! += xp;
  const newTotalXp = cachedMember.cache.totalXp;

  await levelManager.checkLevelUp(member, oldTotalXp!, newTotalXp!);
};

// beta function
export const directlyAddBonus = async (
  userId: string,
  guild: Guild,
  client: Client,
  count: number,
) => {
  const bonusCache = await directlyBuildStatFlushCache(client, guild, 'bonus')!;

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
  textMessage: Record<string, StatFlushCacheChannelEntry>;
  voiceMinute: Record<string, StatFlushCacheChannelEntry>;
  invite: Record<string, StatFlushCacheGuildEntry>;
  vote: Record<string, StatFlushCacheGuildEntry>;
  bonus: Record<string, StatFlushCacheGuildEntry>;
}

const buildStatFlushCache = deprecate(async (member: GuildMember, type: StatType) => {
  return await directlyBuildStatFlushCache(member.client, member.guild, type);
}, 'Prefer directlyBuildStatFlushCache, which does not require a useless `member` param');

const directlyBuildStatFlushCache = async (client: Client, guild: Guild, type: StatType) => {
  const { dbHost } = await guildModel.cache.get(guild);
  const { statFlushCache } = client;

  if (!Object.keys(statFlushCache).includes(dbHost))
    statFlushCache[dbHost] = {
      textMessage: {},
      voiceMinute: {},
      invite: {},
      vote: {},
      bonus: {},
    };

  return statFlushCache[dbHost]![type];
};

export default {
  addTextMessage,
  addVoiceMinute,
  addInvite,
  addVote,
  addBonus,
  directlyAddBonus,
};
