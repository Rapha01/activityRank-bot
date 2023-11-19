import shardDb from '../../models/shardDb/shardDb.js';
import guildMemberModel, { memberCache } from './guild/guildMemberModel.js';
import guildChannelModel, { channelCache } from './guild/guildChannelModel.js';
import type { ChatInputCommandInteraction, Guild, GuildTextBasedChannel } from 'discord.js';
import type { DBDelete, DBUpdate } from 'models/types/enums.js';
import guildModel, { guildCache } from './guild/guildModel.js';
import type { GuildSchema } from 'models/types/shard.js';
import { roleCache } from './guild/guildRoleModel.js';

interface BaseResetJob {
  ref: ChatInputCommandInteraction;
  cmdChannel: GuildTextBasedChannel;
}
interface MemberResetJob extends BaseResetJob {
  type: 'guildMembersStats';
  userIds: string[];
}
interface ChannelResetJob extends BaseResetJob {
  type: 'guildChannelsStats';
  channelIds: string[];
}
interface StatResetJob extends BaseResetJob {
  type:
    | 'all'
    | 'stats'
    | 'settings'
    | 'textstats'
    | 'voicestats'
    | 'invitestats'
    | 'votestats'
    | 'bonusstats';
}

export type ResetJob = MemberResetJob | ChannelResetJob | StatResetJob;

export const resetJobs: Record<string, ResetJob> = {};

// Storage

export const storage = {
  resetGuildAll: async (batchsize: number, guild: Guild) => {
    let affectedRows = 0;

    affectedRows += await storage.resetGuildStats(batchsize - affectedRows, guild);
    if (affectedRows < batchsize)
      affectedRows += await storage.resetGuildSettings(batchsize, guild);

    return affectedRows;
  },
  resetGuildSettings: async (batchsize: number, guild: Guild) => {
    const cachedGuild = await guildModel.cache.get(guild);

    let affectedRows = 0;
    const tables = ['guildRole', 'guildMember', 'guildChannel'];

    for (const table of tables) {
      if (affectedRows < batchsize) {
        affectedRows += (
          await shardDb.query<DBDelete>(
            cachedGuild.dbHost,
            `DELETE FROM ${table} WHERE guildId = ${guild.id} LIMIT ${batchsize - affectedRows}`,
          )
        ).affectedRows;
      }
    }

    if (affectedRows < batchsize) {
      const keys = Object.keys(
        (
          await shardDb.query<GuildSchema[]>(
            cachedGuild.dbHost,
            `SELECT * FROM guild WHERE guildId = ${guild.id}`,
          )
        )[0],
      );
      const keySqls = [];
      for (const key of keys) {
        if (noResetGuildFields.indexOf(key) == -1) keySqls.push(key + '=DEFAULT(' + key + ')');
      }
      await shardDb.query<DBUpdate>(
        cachedGuild.dbHost,
        `UPDATE guild SET ${keySqls.join(',')} WHERE guildId = ${guild.id}`,
      );

      cache.resetGuildRolesAll(guild);
      cache.resetGuildChannelsAll(guild);
      cache.resetGuildMembersAll(guild);
      cache.resetGuild(guild);
    }

    return affectedRows;
  },
  resetGuildStats: async (batchsize: number, guild: Guild) => {
    let affectedRows = 0;
    const tables = ['textMessage', 'voiceMinute', 'vote', 'invite', 'bonus'];

    const cachedGuild = await guildModel.cache.get(guild);

    for (const table of tables) {
      if (affectedRows < batchsize) {
        affectedRows += (
          await shardDb.query<DBDelete>(
            cachedGuild.dbHost,
            `DELETE FROM ${table} WHERE guildId = ${guild.id} LIMIT ${batchsize - affectedRows}`,
          )
        ).affectedRows;
      }
    }

    if (affectedRows < batchsize) {
      affectedRows += (
        await shardDb.query<DBUpdate>(
          cachedGuild.dbHost,
          `UPDATE guildMember SET inviter=DEFAULT(inviter) WHERE guildId = ${guild.id} LIMIT ${
            batchsize - affectedRows
          }`,
        )
      ).affectedRows;
    }

    if (affectedRows < batchsize) cache.resetGuildMembersAll(guild);

    return affectedRows;
  },
  resetGuildStatsByType: async (
    batchsize: number,
    guild: Guild,
    type: 'textMessage' | 'voiceMinute' | 'invite' | 'vote' | 'bonus',
  ) => {
    let affectedRows = 0;

    const cachedGuild = await guildModel.cache.get(guild);

    affectedRows += (
      await shardDb.query<DBDelete>(
        cachedGuild.dbHost,
        `DELETE FROM ${type} WHERE guildId = ${guild.id} LIMIT ${batchsize}`,
      )
    ).affectedRows;

    if (type == 'invite' && affectedRows < batchsize) {
      affectedRows += (
        await shardDb.query<DBUpdate>(
          cachedGuild.dbHost,
          `UPDATE guildMember SET inviter=DEFAULT(inviter) WHERE guildId = ${guild.id} LIMIT ${
            batchsize - affectedRows
          }`,
        )
      ).affectedRows;
    }

    if (affectedRows < batchsize) cache.resetGuildMembersAll(guild);

    return affectedRows;
  },
  resetGuildMembersStats: async (batchsize: number, guild: Guild, userIds: string[]) => {
    let affectedRows = 0;

    const tables = ['textMessage', 'voiceMinute', 'vote', 'invite', 'bonus'];

    const cachedGuild = await guildModel.cache.get(guild);

    for (const table of tables) {
      if (affectedRows < batchsize) {
        affectedRows += (
          await shardDb.query<DBDelete>(
            cachedGuild.dbHost,
            `DELETE FROM ${table} WHERE guildId = ${guild.id} AND userId in (${userIds.join(
              ',',
            )}) LIMIT ${batchsize - affectedRows}`,
          )
        ).affectedRows;
      }
    }

    if (affectedRows < batchsize) {
      affectedRows += (
        await shardDb.query<DBUpdate>(
          cachedGuild.dbHost,
          `UPDATE guildMember SET inviter=DEFAULT(inviter) WHERE guildId = ${
            guild.id
          } AND userId IN (${userIds.join(',')}) LIMIT ${batchsize - affectedRows}`,
        )
      ).affectedRows;
    }

    if (affectedRows < batchsize) cache.resetGuildMemberIds(guild, userIds);

    return affectedRows;
  },
  resetGuildChannelsStats: async (batchsize: number, guild: Guild, channelIds: string[]) => {
    let affectedRows = 0;

    const tables = ['textMessage', 'voiceMinute'];

    const cachedGuild = await guildModel.cache.get(guild);

    for (const table of tables) {
      if (affectedRows < batchsize) {
        affectedRows += (
          await shardDb.query<DBDelete>(
            cachedGuild.dbHost,
            `DELETE FROM ${table} WHERE guildId = ${guild.id} AND channelId IN (${channelIds.join(
              ',',
            )}) LIMIT ${batchsize - affectedRows}`,
          )
        ).affectedRows;
      }
    }

    if (affectedRows < batchsize) {
      cache.resetGuildMembersAll(guild);
      cache.resetGuildChannelIds(guild, channelIds);
    }

    return affectedRows;
  },
  getDeletedUserIds: async (guild: Guild) => {
    const userIds = await guildMemberModel.getRankedUserIds(guild);
    const users = await guild.members.fetch({ withPresences: false });

    const deletedUserIds = [];

    for (const userId of userIds) {
      if (users.get(userId)) continue;

      deletedUserIds.push(userId);
    }

    return deletedUserIds;
  },
  getDeletedChannelIds: async (guild: Guild) => {
    const channelIds = await guildChannelModel.getRankedChannelIds(guild);

    const deletedChannelIds = [];
    for (const channelId of channelIds) {
      if (guild.channels.cache.get(channelId)) continue;

      deletedChannelIds.push(channelId);
    }

    return deletedChannelIds;
  },
};

const noResetGuildFields = [
  'guildId',
  //'tokens',
  //'tokensBurned',
  'lastCommandDate',
  //'lastTokenBurnDate',
  'joinedAtDate',
  'leftAtDate',
  'addDate',
];

// Cache

export const cache = {
  resetGuild: (guild: Guild) => {
    guildCache.delete(guild);
  },
  resetGuildMembersAll: (guild: Guild) => {
    for (const member of guild.members.cache.values()) memberCache.delete(member);
  },
  resetGuildChannelsAll: (guild: Guild) => {
    for (const channel of guild.channels.cache.values()) channelCache.delete(channel);
  },
  resetGuildRolesAll: (guild: Guild) => {
    for (const role of guild.roles.cache.values()) roleCache.delete(role);
  },
  resetGuildMemberIds: (guild: Guild, userIds: string[]) => {
    let member;
    for (const userId of userIds) {
      member = guild.members.cache.get(userId);
      if (member) memberCache.delete(member);
    }
  },
  resetGuildChannelIds: (guild: Guild, channelIds: string[]) => {
    let channel;
    for (const channelId of channelIds) {
      channel = guild.channels.cache.get(channelId);
      if (channel) channelCache.delete(channel);
    }
  },
};

export default {
  resetJobs,
  storage,
  cache,
};
