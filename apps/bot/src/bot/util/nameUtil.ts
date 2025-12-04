import type { Channel, Collection, Guild, GuildBasedChannel, GuildMember, Role } from 'discord.js';
import { getGuildModel } from '#bot/models/guild/guildModel.ts';
import { emoji } from '#const/config.ts';

export const getChannelName = (
  channels: Collection<string, GuildBasedChannel>,
  channelId: string,
) => {
  const channel = channels.get(channelId);

  if (channel) return cutName(channel.name);
  return `${emoji('deletedchannel')} [${channelId}]`;
};

export const getChannelMention = (channels: Collection<string, Channel>, channelId: string) => {
  const channel = channels.get(channelId);

  if (channel) return channel.toString();
  return `${emoji('deletedchannel')} [${channelId}]`;
};

export const getRoleMention = (roles: Collection<string, Role>, roleId: string) => {
  const role = roles.get(roleId);

  if (role) return role.toString();
  return `Deleted [${roleId}]`;
};

export const getGuildMemberInfos = async (guild: Guild, userIds: string[]) => {
  const userIdsToFetch: string[] = [];
  const infos: Record<
    string,
    { name: string; avatarUrl: string | null; joinedAt: number | string }
  > = {};

  const cachedGuild = await getGuildModel(guild);

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
        name: `${emoji('deleteduser')} [${userId}]`,
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

export async function getGuildMemberNamesWithRanks<T extends { userId: string }>(
  guild: Guild,
  memberRanks: T[],
) {
  const userIds = memberRanks.map((r) => r.userId);
  const memberInfos = await getGuildMemberInfos(guild, userIds);

  return memberRanks.map((i) => ({ ...i, name: memberInfos[i.userId].name }));
}

// TODO consider checking if displayNames are appropriate in this function
export const getGuildMemberAlias = (member: GuildMember, showNicknames: boolean) =>
  cutName(showNicknames && member.nickname ? member.nickname : member.user.username);

export const cutName = (name: string) => (name.length > 32 ? `${name.slice(0, 30)}..` : name);

export default {
  getChannelName,
  getChannelMention,
  getRoleMention,
  getGuildMemberInfos,
  getGuildMemberInfo,
  getGuildMemberAlias,
  cutName,
};
