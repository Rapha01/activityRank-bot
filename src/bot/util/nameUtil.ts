import type { getGuildMemberRanks } from 'bot/models/rankModel.js';
import {
  ChannelType,
  type Guild,
  type GuildMember,
  type Channel,
  type Collection,
  type Role,
  type GuildChannel,
} from 'discord.js';
import { deprecate } from 'node:util';

export const getChannelName = (channels: Collection<string, GuildChannel>, channelId: string) => {
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

  // Add cached
  for (const userId of userIds) {
    const member = guild.members.cache.get(userId);

    if (member) {
      infos[userId] = {
        name: getGuildMemberAlias(member),
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
        name: getGuildMemberAlias(member),
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

export const getGuildMemberMention = (
  members: Collection<string, GuildMember>,
  memberId: string,
) => {
  const role = members.get(memberId);

  if (role) return role.toString();
  else return `Deleted [${memberId}]`;
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

export const getGuildMemberAlias = (member: GuildMember) => {
  if (member.guild.appData.showNicknames && member.nickname) return cutName(member.nickname);
  return cutName(member.user.username);
};

export const cutName = (name: string) => {
  if (name.length > 32) name = name.slice(0, 30) + '..';

  return name;
};

/* exports.getSimpleEmbed = (title,text) => {
  const embed = new Discord.EmbedBuilder();
  embed.setColor(0x00AE86);

  if (title != '')
    embed.setAuthor(title);

  if (text != '')
    embed.setDescription(text);

  return embed;

} */

// GENERATED: start of generated content by `exports-to-default`.
// [GENERATED: exports-to-default:v0]

export default {
  getChannelName,
  getChannelMention,
  getChannelType,
  getRoleName,
  getRoleMention,
  getChannelTypeIcon,
  getGuildMemberInfos,
  getGuildMemberInfo,
  getGuildMemberMention,
  addGuildMemberNamesToRanks,
  getGuildMemberAlias,
  cutName,
};

// GENERATED: end of generated content by `exports-to-default`.
