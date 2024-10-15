import type { Client, Guild, GuildBasedChannel, GuildMember, VoiceBasedChannel } from 'discord.js';
import levelManager from './levelManager.js';
import type { StatType } from 'models/types/enums.js';
import { getGuildModel, type GuildModel } from './models/guild/guildModel.js';
import { getMemberModel } from './models/guild/guildMemberModel.js';
import { addXp } from './xpFlushCache.js';
import { getShardDb } from 'models/shardDb/shardDb.js';
import { getRoleModel } from './models/guild/guildRoleModel.js';

async function getXpMultiplier(
  member: GuildMember,
  roleIds: string[],
  guildModel: GuildModel,
  key: 'xpPerTextMessage' | 'xpPerVoiceMinute' | 'xpPerInvite' | 'xpPerVote',
): Promise<number> {
  let highestXpValue = guildModel.db[key];

  // TODO: refactor to use cached value
  const roles = await getShardDb(guildModel.dbHost)
    .selectFrom('guildRole')
    .select(['roleId', key])
    .where('guildId', '=', member.guild.id)
    .where('roleId', 'in', roleIds)
    .execute();

  for (const role of roles) {
    if (role.roleId === member.guild.id) continue;
    if (role[key] <= highestXpValue) continue;
    highestXpValue = role[key];
  }

  return highestXpValue;
}

export async function addTextMessage(
  member: GuildMember,
  // not textBased because forums can be ranked
  channel: GuildBasedChannel,
  count: number,
) {
  // Add to FlushCache
  let textMessageCache = await buildStatFlushCache(member.client, member.guild, 'textMessage');

  const cachedGuild = await getGuildModel(member.guild);

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

  const xpMultiplier = await getXpMultiplier(
    member,
    [...member.roles.cache.keys()],
    cachedGuild,
    'xpPerTextMessage',
  );

  await addTotalXp(member, count * xpMultiplier);

  if (parseInt(cachedGuild.db.bonusUntilDate) > Date.now() / 1000)
    await addBonus(member, count * cachedGuild.db.bonusPerTextMessage);
}

export async function addVoiceMinute(
  member: GuildMember,
  channel: VoiceBasedChannel,
  count: number,
) {
  // Add to FlushCache
  let voiceMinuteCache = await buildStatFlushCache(member.client, member.guild, 'voiceMinute');

  const cachedGuild = await getGuildModel(member.guild);

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

  const xpMultiplier = await getXpMultiplier(
    member,
    [...member.roles.cache.keys()],
    cachedGuild,
    'xpPerVoiceMinute',
  );

  await addTotalXp(member, count * xpMultiplier);

  if (parseInt(cachedGuild.db.bonusUntilDate) > Date.now() / 1000)
    await addBonus(member, count * cachedGuild.db.bonusPerVoiceMinute);
}

export const addInvite = async (member: GuildMember, count: number) => {
  let inviteCache = await buildStatFlushCache(member.client, member.guild, 'invite');

  const cachedGuild = await getGuildModel(member.guild);

  count = count * 1;

  let entry = inviteCache[member.id];
  if (!entry)
    entry = inviteCache[member.id] = {
      guildId: member.guild.id,
      userId: member.id,
      count: count,
    };
  else entry.count += count;

  const xpMultiplier = await getXpMultiplier(
    member,
    [...member.roles.cache.keys()],
    cachedGuild,
    'xpPerInvite',
  );

  await addTotalXp(member, count * xpMultiplier);

  if (parseInt(cachedGuild.db.bonusUntilDate) > Date.now() / 1000)
    await addBonus(member, count * cachedGuild.db.bonusPerInvite);
};

export const addVote = async (member: GuildMember, count: number) => {
  let voteCache = await buildStatFlushCache(member.client, member.guild, 'vote');

  const cachedGuild = await getGuildModel(member.guild);

  count = count * 1;

  let entry = voteCache[member.id];
  if (!entry)
    entry = voteCache[member.id] = {
      guildId: member.guild.id,
      userId: member.id,
      count: count,
    };
  else entry.count += count;

  const xpMultiplier = await getXpMultiplier(
    member,
    [...member.roles.cache.keys()],
    cachedGuild,
    'xpPerVote',
  );

  await addTotalXp(member, count * xpMultiplier);

  if (parseInt(cachedGuild.db.bonusUntilDate) > Date.now() / 1000)
    await addBonus(member, count * cachedGuild.db.bonusPerVote);
};

export const addBonus = async (member: GuildMember, count: number) => {
  let bonusCache = await buildStatFlushCache(member.client, member.guild, 'bonus');

  const cachedGuild = await getGuildModel(member.guild);

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
  const cachedMember = await getMemberModel(member);

  const oldTotalXp = cachedMember.cache.totalXp ?? 0;
  const newTotalXp = oldTotalXp + xp;
  cachedMember.cache.totalXp = newTotalXp;

  // add XP to the guildMember table
  await addXp(member, xp);

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
  const { dbHost } = await getGuildModel(guild);
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
