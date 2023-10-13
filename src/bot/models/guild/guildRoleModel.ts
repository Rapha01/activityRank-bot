import type { Guild, Role } from 'discord.js';
import shardDb from '../../../models/shardDb/shardDb.js';
import mysql from 'promise-mysql';
import type { guildRole } from 'models/types/shard.js';

const promises = new Map<string, Promise<void>>();

const cachedFields = [
  'noXp',
  'assignLevel',
  'deassignLevel',
  'assignMessage',
  'deassignMessage',
] as const;

export type CachedRole = Pick<guildRole, (typeof cachedFields)[number]>;

let defaultCache: CachedRole | null = null;
let defaultAll: guildRole | null = null;

export const cache = {
  load: (role: Role) => {
    if (!role.appData) {
      if (promises.has(role.id)) return promises.get(role.id)!;

      promises.set(
        role.id,
        new Promise(async (resolve, reject) => {
          try {
            await buildCache(role);
            promises.delete(role.id);
            resolve();
          } catch (e) {
            promises.delete(role.id);
            reject(e);
          }
        }),
      );

      return promises.get(role.id)!;
    }

    return new Promise<void>(async (resolve) => {
      resolve();
    });
  },
};

export const storage = {
  get: async (guild: Guild, roleId: string) => {
    const res = await shardDb.query<guildRole[]>(
      guild.appData.dbHost,
      `SELECT * FROM guildRole WHERE guildId = ${guild.id} && roleId = ${mysql.escape(roleId)}`,
    );

    if (res.length == 0) {
      if (!defaultAll)
        defaultAll = (
          await shardDb.query<guildRole[]>(
            guild.appData.dbHost,
            `SELECT * FROM guildRole WHERE guildId = 0 AND roleId = 0`,
          )
        )[0];
      return defaultAll;
    } else return res[0];
  },
  set: async <K extends Exclude<keyof guildRole, 'guildId' | 'roleId'>>(
    guild: Guild,
    roleId: string,
    field: K,
    value: guildRole[K],
  ) => {
    await shardDb.query(
      guild.appData.dbHost,
      `INSERT INTO guildRole (guildId,roleId,${field}) VALUES (${guild.id},${mysql.escape(
        roleId,
      )},${mysql.escape(value)}) ON DUPLICATE KEY UPDATE ${field} = ${mysql.escape(value)}`,
    );

    const role = guild.roles.cache.get(roleId);
    if (role && role.appData && cachedFields.indexOf(field) > -1) role.appData[field] = value;
  },
  getRoleAssignments: async (guild: Guild) => {
    const res = await shardDb.query<guildRole[]>(
      guild.appData.dbHost,
      `SELECT * FROM guildRole WHERE guildId = ${guild.id} AND (assignLevel != 0 OR deassignLevel != 0) ORDER BY assignLevel ASC`,
    );

    return res;
  },
  getRoleAssignmentsByLevel: async (
    guild: Guild,
    type: 'assignLevel' | 'deassignLevel',
    level: number | null,
  ) => {
    const res = await shardDb.query<guildRole[]>(
      guild.appData.dbHost,
      `SELECT * FROM guildRole WHERE guildId = ${guild.id} AND ${type} = ${mysql.escape(level)}`,
    );

    return res;
  },
  getRoleAssignmentsByRole: async (guild: Guild, roleId: string) => {
    const res = await shardDb.query<guildRole[]>(
      guild.appData.dbHost,
      `SELECT * FROM guildRole WHERE guildId = ${guild.id} AND roleId = ${roleId}`,
    );

    return res;
  },
};

export const getNoXpRoleIds = async (guild: Guild) => {
  const res = await shardDb.query<{ roleId: string }[]>(
    guild.appData.dbHost,
    `SELECT roleId FROM guildRole WHERE guildId = ${guild.id} AND noXp = 1`,
  );

  return res.map((role) => role.roleId);
};

const buildCache = async (role: Role) => {
  const foundCache = await shardDb.query<CachedRole[]>(
    role.guild.appData.dbHost,
    `SELECT ${cachedFields.join(',')} FROM guildRole WHERE guildId = ${
      role.guild.id
    } AND roleId = ${role.id}`,
  );

  let cache;

  if (foundCache.length > 0) cache = foundCache[0];
  else {
    if (!defaultCache) await loadDefaultCache(role.guild.appData.dbHost);
    cache = Object.assign({}, defaultCache);
  }

  role.appData = cache;
};

const loadDefaultCache = async (dbHost: string) => {
  let res = await shardDb.query<CachedRole[]>(
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
};

export default {
  cache,
  storage,
  getNoXpRoleIds,
};
