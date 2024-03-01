import type { Guild, Role } from 'discord.js';
import shardDb from '../../../models/shardDb/shardDb.js';
import mysql from 'promise-mysql';
import type { GuildRoleSchema } from 'models/types/shard.js';
import guildModel from './guildModel.js';

const cachedFields = [
  'noXp',
  'assignLevel',
  'deassignLevel',
  'assignMessage',
  'deassignMessage',
] as const;

let defaultCache: CachedDbFields | null = null;
let defaultAll: GuildRoleSchema | null = null;

type CachedDbFields = Pick<GuildRoleSchema, (typeof cachedFields)[number]>;

export interface CachedRole {
  db: CachedDbFields;
}

export const roleCache = new WeakMap<Role, CachedRole>();

export const cache = {
  get: async function (role: Role): Promise<CachedRole> {
    if (roleCache.has(role)) return roleCache.get(role)!;
    return await buildCache(role);
  },
};

function isCachableDbKey(key: keyof GuildRoleSchema): key is keyof CachedDbFields {
  return cachedFields.includes(key as keyof CachedDbFields);
}

export const storage = {
  get: async (guild: Guild, roleId: string) => {
    const { dbHost } = await guildModel.cache.get(guild);

    const res = await shardDb.query<GuildRoleSchema[]>(
      dbHost,
      `SELECT * FROM guildRole WHERE guildId = ${guild.id} && roleId = ${mysql.escape(roleId)}`,
    );

    if (res.length == 0) {
      if (!defaultAll)
        defaultAll = (
          await shardDb.query<GuildRoleSchema[]>(
            dbHost,
            `SELECT * FROM guildRole WHERE guildId = 0 AND roleId = 0`,
          )
        )[0];
      return defaultAll;
    } else return res[0];
  },
  set: async <K extends Exclude<keyof GuildRoleSchema, 'guildId' | 'roleId'>>(
    guild: Guild,
    roleId: string,
    field: K,
    value: GuildRoleSchema[K],
  ) => {
    const { dbHost } = await guildModel.cache.get(guild);

    await shardDb.query(
      dbHost,
      `INSERT INTO guildRole (guildId,roleId,${field}) VALUES (${guild.id},${mysql.escape(
        roleId,
      )},${mysql.escape(value)}) ON DUPLICATE KEY UPDATE ${field} = ${mysql.escape(value)}`,
    );

    const role = guild.roles.cache.get(roleId);
    if (role && isCachableDbKey(field)) {
      const cachedRole = await cache.get(role);
      Object.defineProperty(cachedRole.db, field, { value });
    }
  },
  getRoleAssignments: async (guild: Guild) => {
    const { dbHost } = await guildModel.cache.get(guild);

    const res = await shardDb.query<GuildRoleSchema[]>(
      dbHost,
      `SELECT * FROM guildRole WHERE guildId = ${guild.id} AND (assignLevel != 0 OR deassignLevel != 0) ORDER BY assignLevel ASC`,
    );

    return res;
  },
  getRoleAssignmentsByLevel: async (
    guild: Guild,
    type: 'assignLevel' | 'deassignLevel',
    level: number | null,
  ) => {
    const { dbHost } = await guildModel.cache.get(guild);

    const res = await shardDb.query<GuildRoleSchema[]>(
      dbHost,
      `SELECT * FROM guildRole WHERE guildId = ${guild.id} AND ${type} = ${mysql.escape(level)}`,
    );

    return res;
  },
  getRoleAssignmentsByRole: async (guild: Guild, roleId: string) => {
    const { dbHost } = await guildModel.cache.get(guild);

    const res = await shardDb.query<GuildRoleSchema[]>(
      dbHost,
      `SELECT * FROM guildRole WHERE guildId = ${guild.id} AND roleId = ${roleId}`,
    );

    return res;
  },
};

export const getNoXpRoleIds = async (guild: Guild) => {
  const { dbHost } = await guildModel.cache.get(guild);

  const res = await shardDb.query<{ roleId: string }[]>(
    dbHost,
    `SELECT roleId FROM guildRole WHERE guildId = ${guild.id} AND noXp = 1`,
  );

  return res.map((role) => role.roleId);
};

const buildCache = async (role: Role): Promise<CachedRole> => {
  const { dbHost } = await guildModel.cache.get(role.guild);

  const foundCache = await shardDb.query<GuildRoleSchema[]>(
    dbHost,
    `SELECT ${cachedFields.join(',')} FROM guildRole WHERE guildId = ${
      role.guild.id
    } AND roleId = ${role.id}`,
  );

  const db = foundCache.length > 0 ? foundCache[0] : await loadDefaultCache(dbHost);

  const res = { db };
  roleCache.set(role, res);
  return res;
};

const loadDefaultCache = async (dbHost: string) => {
  // clone defaultCache
  if (defaultCache) return Object.assign({}, defaultCache);

  let res = await shardDb.query<GuildRoleSchema[]>(
    dbHost,
    `SELECT ${cachedFields.join(',')} FROM guildRole WHERE guildId = 0 AND roleId = 0`,
  );

  if (res.length == 0)
    await shardDb.query(dbHost, `INSERT IGNORE INTO guildRole (guildId,roleId) VALUES (0,0)`);

  res = await shardDb.query(
    dbHost,
    `SELECT ${cachedFields.join(',')} FROM guildRole WHERE guildId = 0 AND roleId = 0`,
  );

  defaultCache = res[0];
  return defaultCache;
};

export default {
  cache,
  storage,
  getNoXpRoleIds,
};
