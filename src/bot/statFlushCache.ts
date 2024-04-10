import type { Client, Guild, GuildBasedChannel, GuildMember, VoiceBasedChannel } from 'discord.js';
import levelManager from './levelManager.js';
import type { StatType } from 'models/types/enums.js';
import guildModel from './models/guild/guildModel.js';
import guildMemberModel from './models/guild/guildMemberModel.js';
import { deprecate } from 'node:util';
import { addXp } from './xpFlushCache.js';
import { Feature, hasFeature } from './util/feature.js';

export async function addTextMessage(
  member: GuildMember,
  // not textBased because forums can be ranked
  channel: GuildBasedChannel,
  count: number,
) {
  // Add to FlushCache
  let textMessageCache = await buildStatFlushCache(member.client, member.guild, 'textMessage');

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
  let voiceMinuteCache = await buildStatFlushCache(member.client, member.guild, 'voiceMinute');

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
  let inviteCache = await buildStatFlushCache(member.client, member.guild, 'invite');

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
  let voteCache = await buildStatFlushCache(member.client, member.guild, 'vote');

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
  let bonusCache = await buildStatFlushCache(member.client, member.guild, 'bonus');

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

  const oldTotalXp = cachedMember.cache.totalXp ?? 0;
  cachedMember.cache.totalXp = oldTotalXp + xp;
  const newTotalXp = cachedMember.cache.totalXp;

  if (hasFeature(member.guild, Feature.XPFlush)) await addXp(member, xp);

  await levelManager.checkLevelUp(member, oldTotalXp, newTotalXp);
};

// beta function
export const directlyAddBonus = async (
  userId: string,
  guild: Guild,
  client: Client,
  count: number,
) => {
  const bonusCache = await buildStatFlushCache(client, guild, 'bonus')!;

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

const buildStatFlushCache = async (client: Client, guild: Guild, type: StatType) => {
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
