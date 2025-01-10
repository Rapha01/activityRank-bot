import type { Client, Guild, GuildBasedChannel, GuildMember, VoiceBasedChannel } from 'discord.js';
import levelManager from './levelManager.js';
import type { StatType } from '#models/types/enums.js';
import { getGuildModel, type GuildModel } from './models/guild/guildModel.js';
import { getMemberModel } from './models/guild/guildMemberModel.js';
import { addXp } from './xpFlushCache.js';
import { shards } from '#models/shardDb/shardDb.js';

async function getXpMultiplier(
  member: GuildMember,
  roleIds: string[],
  guildModel: GuildModel,
  key: 'xpPerTextMessage' | 'xpPerVoiceMinute' | 'xpPerInvite' | 'xpPerVote',
): Promise<number> {
  // sentinel value: gets replaced with the guild default at the end of the function
  // This allows role overrides lower than the guild default to be applied
  let highestXpValue = 0;

  // TODO: refactor to use cached value
  const roles = await shards
    .get(guildModel.dbHost)
    .db.selectFrom('guildRole')
    .select(['roleId', key])
    .where('guildId', '=', member.guild.id)
    .where('roleId', 'in', roleIds)
    .where((w) =>
      w.or([
        w('xpPerTextMessage', '!=', 0),
        w('xpPerVoiceMinute', '!=', 0),
        w('xpPerInvite', '!=', 0),
        w('xpPerVote', '!=', 0),
      ]),
    )
    .execute();

  for (const role of roles) {
    if (role.roleId === member.guild.id) continue;
    if (role[key] <= highestXpValue) continue;
    highestXpValue = role[key];
  }

  // if a custom value has been set, return it. Otherwise, return the server default.
  return highestXpValue > 0 ? highestXpValue : guildModel.db[key];
}

export async function addTextMessage(
  member: GuildMember,
  // not textBased because forums can be ranked
  channel: GuildBasedChannel,
  count: number,
) {
  // Add to FlushCache
  const textMessageCache = await buildStatFlushCache(member.client, member.guild, 'textMessage');

  const cachedGuild = await getGuildModel(member.guild);

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

  if (Number.parseInt(cachedGuild.db.bonusUntilDate) > Date.now() / 1000)
    await addBonus(member, count * cachedGuild.db.bonusPerTextMessage);
}

export async function addVoiceMinute(
  member: GuildMember,
  channel: VoiceBasedChannel,
  count: number,
) {
  // Add to FlushCache
  const voiceMinuteCache = await buildStatFlushCache(member.client, member.guild, 'voiceMinute');

  const cachedGuild = await getGuildModel(member.guild);

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

  if (Number.parseInt(cachedGuild.db.bonusUntilDate) > Date.now() / 1000)
    await addBonus(member, count * cachedGuild.db.bonusPerVoiceMinute);
}

export const addInvite = async (member: GuildMember, count: number) => {
  const inviteCache = await buildStatFlushCache(member.client, member.guild, 'invite');

  const cachedGuild = await getGuildModel(member.guild);

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

  if (Number.parseInt(cachedGuild.db.bonusUntilDate) > Date.now() / 1000)
    await addBonus(member, count * cachedGuild.db.bonusPerInvite);
};

export const addVote = async (member: GuildMember, count: number) => {
  const voteCache = await buildStatFlushCache(member.client, member.guild, 'vote');

  const cachedGuild = await getGuildModel(member.guild);

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

  if (Number.parseInt(cachedGuild.db.bonusUntilDate) > Date.now() / 1000)
    await addBonus(member, count * cachedGuild.db.bonusPerVote);
};

export const addBonus = async (member: GuildMember, count: number) => {
  const bonusCache = await buildStatFlushCache(member.client, member.guild, 'bonus');

  const cachedGuild = await getGuildModel(member.guild);

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
  const bonusCache = await buildStatFlushCache(client, guild, 'bonus');

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
