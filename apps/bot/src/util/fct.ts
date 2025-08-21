import type { ShardDB } from '@activityrank/database';
import type { BaseInteraction, Entitlement, GuildMember } from 'discord.js';
import { getRoleModel } from '#bot/models/guild/guildRoleModel.js';
import { PREMIUM_SKU_ID } from '#bot/util/constants.js';
import { getUserModel } from '../bot/models/userModel.js';

// System
export const waitAndReboot = async (milliseconds: number) => {
  try {
    console.log(`Restarting in ${milliseconds / 1000}s`);
    await sleep(milliseconds);
    console.log('Restart');
    process.exit();
  } catch (err) {
    console.log(err);
  }
};

export const sleep = (milliseconds: number) => {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
};

export const hasNoXpRole = async (member: GuildMember) => {
  for (const role of member.roles.cache.values()) {
    const cachedRole = await getRoleModel(role);
    if (cachedRole.db.noXp) return true;
  }
  return false;
};

/**
 * An object describing the entries that should be provided to a page.
 */
export interface Pagination {
  /** The page to display. Indexed from 1. */
  page: number;
  /** The index of the first entry to display. */
  from: number;
  /** The index of the last entry to display. */
  to: number;
}

export const extractPageSimple = (page: number, entriesPerPage: number): Pagination => {
  const from = Math.max((page - 1) * entriesPerPage + 1);
  const to = page * entriesPerPage;
  return { page, from, to };
};

export const getLevel = (levelProgression: number) => {
  return Math.floor(levelProgression);
};

export const getLevelProgression = (totalScore: number, levelFactor: number) => {
  return (solve(levelFactor / 2, levelFactor / 2 + 100, -totalScore) ?? 0) + 1;
};

function solve(a: number, b: number, c: number) {
  const result = (-1 * b + Math.sqrt(b ** 2 - 4 * a * c)) / (2 * a);
  const result2 = (-1 * b - Math.sqrt(b ** 2 - 4 * a * c)) / (2 * a);

  if (result >= 0) return result;
  if (result2 >= 0) return result2;
  return null;
}

export function hasValidEntitlement(interaction: BaseInteraction<'cached'>) {
  function isValidEntitlement(entitlement: Entitlement) {
    return (
      entitlement.isGuildSubscription() &&
      entitlement.isActive() &&
      entitlement.guildId === interaction.guildId &&
      entitlement.skuId === PREMIUM_SKU_ID
    );
  }

  return interaction.entitlements.some(isValidEntitlement);
}

export async function getPatreonTiers(interaction: BaseInteraction<'cached'>) {
  const ownerUser = (
    await interaction.guild.members.fetch({ user: interaction.guild.ownerId, cache: true })
  ).user;

  const userModel = await getUserModel(interaction.user);
  const myUser = await userModel.fetch();
  const ownerModel = await getUserModel(ownerUser);
  const myOwnerUser = await ownerModel.fetch();

  let userTier: number;
  if (Date.now() / 1000 <= Number.parseInt(myUser.patreonTierUntilDate)) {
    userTier = myUser.patreonTier;
  } else userTier = 0;

  let ownerTier: number;
  if (Date.now() / 1000 <= Number.parseInt(myOwnerUser.patreonTierUntilDate)) {
    ownerTier = myOwnerUser.patreonTier;
  } else ownerTier = 0;

  return { userTier, ownerTier };
}

export function getVoteMultiplier(dbUser: ShardDB.User): number {
  const lastTopggUpvoteDate = Number.parseInt(dbUser.lastTopggUpvoteDate);
  const patreonTierUntilDate = Number.parseInt(dbUser.patreonTierUntilDate);

  let multiplier = 1;

  if (lastTopggUpvoteDate + 259200 > Date.now() / 1000) multiplier = 2;

  if (patreonTierUntilDate > Date.now() / 1000) {
    if (dbUser.patreonTier === 1) multiplier = 2;
    else if (dbUser.patreonTier === 2) multiplier = 3;
    else if (dbUser.patreonTier === 3) multiplier = 4; // TODO remove: deprecated Patreon tier
  }

  return multiplier;
}

export const getPatreonTierName = (tier: number) => {
  if (tier === 3) return 'Serveradmin';
  if (tier === 2) return 'Poweruser';
  if (tier === 1) return 'Supporter';
  return 'No tier';
};

export default {
  waitAndReboot,
  sleep,
  hasNoXpRole,
  extractPageSimple,
  getLevel,
  getLevelProgression,
  getPatreonTiers,
  getPatreonTierName,
};
