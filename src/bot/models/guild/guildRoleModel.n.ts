import { getShardDb } from '../../../models/shardDb/shardDb.js';
import type { Guild, Role } from 'discord.js';
import type {
  GuildRole as DBRole,
  GuildRoleSchema,
  GuildRoleUpdate,
} from 'models/types/kysely/shard.js';
import { getGuildModel } from './guildModel.js';
import { CachedModel } from '../generic/model.js';

const cachedFields = [
  'noXp',
  'assignLevel',
  'deassignLevel',
  'assignMessage',
  'deassignMessage',
  'xpPerVoiceMinute',
  'xpPerTextMessage',
  'xpPerVote',
  'xpPerInvite',
] as const satisfies (keyof DBRole)[];

let defaultCache: Pick<DBRole, (typeof cachedFields)[number]> | null = null;
let defaultAll: DBRole | null = null;

interface RoleCacheStorage {}

export const roleCache = new WeakMap<Role, RoleModel>();

export class RoleModel extends CachedModel<
  Role,
  GuildRoleSchema,
  typeof cachedFields,
  RoleCacheStorage
> {
  async fetchOptional() {
    const member = await this.handle
      .selectFrom('guildRole')
      .selectAll()
      .where('roleId', '=', this._object.id)
      .where('guildId', '=', this._object.guild.id)
      .executeTakeFirst();

    return member;
  }

  async fetch(error = false) {
    const member = await this.fetchOptional();
    if (member) return member;

    if (error) throw new Error(`Could not find role ${this._object.id} in database`);
    return await this.fetchDefault();
  }

  async upsert(expr: GuildRoleUpdate) {
    await this.handle
      .insertInto('guildRole')
      .values({ roleId: this._object.id, guildId: this._object.guild.id, ...expr })
      .onDuplicateKeyUpdate(expr)
      // .returning(cachedFields) RETURNING is not supported on UPDATE statements in MySQL.
      .executeTakeFirstOrThrow();

    const res = await this.handle
      .selectFrom('guildRole')
      .select(cachedFields)
      .where('guildId', '=', this._object.guild.id)
      .where('roleId', '=', this._object.id)
      .executeTakeFirstOrThrow();

    this._db = res;
  }

  async fetchDefault() {
    if (defaultAll) return defaultAll;

    const db = getShardDb(this.dbHost);

    let res = await db
      .selectFrom('guildRole')
      .selectAll()
      .where('roleId', '=', '0')
      .where('guildId', '=', '0')
      .executeTakeFirst();

    if (!res) {
      res = await db
        .insertInto('guildRole')
        .values({ roleId: '0', guildId: '0' })
        .returningAll()
        .executeTakeFirstOrThrow();
    }

    defaultAll = res;
    return defaultAll;
  }
}

export async function getRoleModel(role: Role): Promise<RoleModel> {
  if (roleCache.has(role)) return roleCache.get(role)!;
  else return await buildCache(role);
}
/* 
export const storage = {
  getRoleAssignments: async (guild: Guild) => {
    const { dbHost } = await getGuildModel(guild);

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
    const { dbHost } = await getGuildModel(guild);

    const res = await shardDb.query<GuildRoleSchema[]>(
      dbHost,
      `SELECT * FROM guildRole WHERE guildId = ${guild.id} AND ${type} = ${escape(level)}`,
    );

    return res;
  },
  getRoleAssignmentsByRole: async (guild: Guild, roleId: string) => {
    const { dbHost } = await getGuildModel(guild);

    const res = await shardDb.query<GuildRoleSchema[]>(
      dbHost,
      `SELECT * FROM guildRole WHERE guildId = ${guild.id} AND roleId = ${roleId}`,
    );

    return res;
  },
}; */

export async function getNoXpRoleIds(guild: Guild) {
  const { dbHost } = await getGuildModel(guild);

  const ids = await getShardDb(dbHost)
    .selectFrom('guildRole')
    .select('roleId')
    .where('guildId', '=', guild.id)
    .where('noXp', '=', 1)
    .execute();

  return ids.map((role) => role.roleId);
}

async function buildCache(role: Role): Promise<RoleModel> {
  const { dbHost } = await getGuildModel(role.guild);
  const db = getShardDb(dbHost);

  const foundCache = await db
    .selectFrom('guildRole')
    .select(cachedFields)
    .where('guildId', '=', role.guild.id)
    .where('roleId', '=', role.id)
    .executeTakeFirst();

  const cache = foundCache ?? { ...(await loadDefaultCache(dbHost)) };

  const built = new RoleModel(role, dbHost, cache, {});

  roleCache.set(role, built);
  return built;
}

async function loadDefaultCache(dbHost: string) {
  if (defaultCache) return defaultCache;
  const db = getShardDb(dbHost);

  let res = await db
    .selectFrom('guildRole')
    .select(cachedFields)
    .where('roleId', '=', '0')
    .where('guildId', '=', '0')
    .executeTakeFirst();

  if (!res) {
    await db
      .insertInto('guildRole')
      .values({ roleId: '0', guildId: '0' })
      // .returning(cachedFields) RETURNING is not supported well in MySQL
      .executeTakeFirstOrThrow();
    res = await db
      .selectFrom('guildRole')
      .select(cachedFields)
      .where('roleId', '=', '0')
      .where('guildId', '=', '0`')
      .executeTakeFirstOrThrow();
  }

  defaultCache = res;
  return defaultCache;
}
