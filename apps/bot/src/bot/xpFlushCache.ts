import type { Guild, GuildMember } from 'discord.js';
import { getGuildModel } from './models/guild/guildModel.js';

export async function addXp(member: GuildMember, xp: number) {
  const key = `${member.guild.id}.${member.id}`;
  const cache = await buildXpFlushCache(member.guild);

  const entry = cache[key];
  if (!entry) cache[key] = { guildId: member.guild.id, userId: member.id, count: xp };
  else cache[key].count += xp;
}

const buildXpFlushCache = async (guild: Guild) => {
  const { dbHost } = await getGuildModel(guild);
  const { xpFlushCache } = guild.client;

  if (!Object.keys(xpFlushCache).includes(dbHost)) xpFlushCache[dbHost] = {};

  return xpFlushCache[dbHost];
};

export type XpFlushCache = Record<string, { guildId: string; userId: string; count: number }>;
