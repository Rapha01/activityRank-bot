import guildModel from 'bot/models/guild/guildModel.js';
import type { getGuildMemberRanks } from 'bot/models/rankModel.js';
import {
  ChannelType,
  type Guild,
  type GuildMember,
  type Channel,
  type Collection,
  type Role,
  type GuildChannel,
  type GuildBasedChannel,
} from 'discord.js';
import { deprecate } from 'node:util';

export const getChannelName = (
  channels: Collection<string, GuildBasedChannel>,
  channelId: string,
) => {
  const channel = channels.get(channelId);

  if (channel) return cutName(channel.name);
  else return 'Deleted [' + channelId + ']';
};

export const getChannelMention = (channels: Collection<string, Channel>, channelId: string) => {
  const channel = channels.get(channelId);

  if (channel) return channel.toString();
  else return `Deleted [${channelId}]`;
};

export const getChannelType = (channels: Collection<string, Channel>, channelId: string) => {
  const channel = channels.get(channelId);

  if (channel) return channel.type;
  else return null;
};

export const getRoleName = (roles: Collection<string, Role>, roleId: string) => {
  const role = roles.get(roleId);

  if (role) return cutName(role.name);
  else return 'Deleted [' + roleId + ']\n';
};

export const getRoleMention = (roles: Collection<string, Role>, roleId: string) => {
  const role = roles.get(roleId);

  if (role) return role.toString();
  else return `Deleted [${roleId}]`;
};

export const getChannelTypeIcon = (channels: Collection<string, Channel>, channelId: string) => {
  const channel = channels.get(channelId);

  if (!channel) return ':grey_question:';

  switch (channel.type) {
    case ChannelType.GuildVoice:
      return ':microphone2:';
    case ChannelType.GuildText:
    case ChannelType.GuildAnnouncement:
      return ':writing_hand:';
    case ChannelType.GuildForum:
      return '<:Forum:1026009067350659145>';
    default:
      return ':grey_question:';
  }
};

export const getGuildMemberInfos = async (guild: Guild, userIds: string[]) => {
  const userIdsToFetch: string[] = [];
  const infos: Record<
    string,
    { name: string; avatarUrl: string | null; joinedAt: number | string }
  > = {};

  const cachedGuild = await guildModel.cache.get(guild);

  // Add cached
  for (const userId of userIds) {
    const member = guild.members.cache.get(userId);

    if (member) {
      infos[userId] = {
        name: getGuildMemberAlias(member, cachedGuild.db.showNicknames === 1),
        avatarUrl: member.user.avatarURL(),
        joinedAt: member.joinedAt?.getTime() ?? 'n/a',
      };
    } else {
      userIdsToFetch.push(userId);
    }
  }

  // Add fetched
  if (userIdsToFetch.length > 0) {
    const fetchedMembers = await guild.members.fetch({
      user: userIdsToFetch,
      withPresences: false,
    });
    for (const member of fetchedMembers.values()) {
      infos[member.id] = {
        name: getGuildMemberAlias(member, cachedGuild.db.showNicknames === 1),
        avatarUrl: member.user.avatarURL(),
        joinedAt: member.joinedAt?.getTime() ?? 'n/a',
      };
    }
  }

  // Add deleted
  for (const userId of userIds) {
    if (!infos[userId]) {
      infos[userId] = {
        name: `User left [${userId}]`,
        avatarUrl: '',
        joinedAt: 'n/a',
      };
    }
  }

  return infos;
};

export const getGuildMemberInfo = async (guild: Guild, userId: string) => {
  return (await getGuildMemberInfos(guild, [userId]))[userId];
};

export const getGuildMemberNamesWithRanks = async (
  guild: Guild,
  memberRanks: Awaited<ReturnType<typeof getGuildMemberRanks>>,
) => {
  const userIds = memberRanks.map((r) => r.userId);
  const memberInfos = await getGuildMemberInfos(guild, userIds);

  return memberRanks.map((i) => ({ ...i, name: memberInfos[i.userId].name }));
};

// @ts-ignore deprecated function is kept intact
export const addGuildMemberNamesToRanks = deprecate((guild, memberRanks) => {
  return new Promise(async function (resolve, reject) {
    try {
      let userIds = [],
        memberRank;
      for (memberRank of memberRanks) userIds.push(memberRank.userId);
      const memberInfos = await getGuildMemberInfos(guild, userIds);

      for (memberRank of memberRanks) memberRank.name = memberInfos[memberRank.userId].name;

      // @ts-ignore deprecated function is kept intact
      resolve();
    } catch (e) {
      return reject(e);
    }
  });
}, "addGuildMemberNamesToRanks() is deprecated due to TypeScript's inability to change variable types. Use getGuildMemberNamesWithRanks() instead.");

// TODO consider checking if displayNames are appropriate in this function
export const getGuildMemberAlias = (member: GuildMember, showNicknames: boolean) =>
  cutName(showNicknames && member.nickname ? member.nickname : member.user.username);

export const cutName = (name: string) => {
  if (name.length > 32) name = name.slice(0, 30) + '..';

  return name;
};

export default {
  getChannelName,
  getChannelMention,
  getChannelType,
  getRoleName,
  getRoleMention,
  getChannelTypeIcon,
  getGuildMemberInfos,
  getGuildMemberInfo,
  addGuildMemberNamesToRanks,
  getGuildMemberAlias,
  cutName,
};
