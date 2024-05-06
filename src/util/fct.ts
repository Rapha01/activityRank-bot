import guildRoleModel from '../bot/models/guild/guildRoleModel.js';
import { getUserModel } from '../bot/models/userModel.js';
import type { GuildMember, Interaction } from 'discord.js';

// System
export const waitAndReboot = async (milliseconds: number) => {
  try {
    console.log('Restarting in ' + milliseconds / 1000 + 's');
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
    const cachedRole = await guildRoleModel.cache.get(role);
    if (cachedRole.db.noXp) return true;
  }
  return false;
};

export type Pagination = { page: number; from: number; to: number };

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
  const result = (-1 * b + Math.sqrt(Math.pow(b, 2) - 4 * a * c)) / (2 * a);
  const result2 = (-1 * b - Math.sqrt(Math.pow(b, 2) - 4 * a * c)) / (2 * a);

  if (result >= 0) return result;
  if (result2 >= 0) return result2;
  else return null;
}

export const getPatreonTiers = async (interaction: Interaction<'cached'>) => {
  const ownerUser = (
    await interaction.guild.members.fetch({ user: interaction.guild.ownerId, cache: true })
  ).user;

  const userModel = await getUserModel(interaction.user);
  const myUser = await userModel.fetch();
  const ownerModel = await getUserModel(ownerUser);
  const myOwnerUser = await ownerModel.fetch();

  let userTier;
  if (Date.now() / 1000 <= parseInt(myUser.patreonTierUntilDate)) {
    userTier = myUser.patreonTier;
  } else userTier = 0;

  let ownerTier;
  if (Date.now() / 1000 <= parseInt(myOwnerUser.patreonTierUntilDate)) {
    ownerTier = myOwnerUser.patreonTier;
  } else ownerTier = 0;

  return { userTier, ownerTier };
};

export const getVoteMultiplier = (myUser: {
  lastTopggUpvoteDate: string;
  patreonTierUntilDate: string;
  patreonTier: number;
}) => {
  let multiplier = 1;

  if (parseInt(myUser.lastTopggUpvoteDate) + 259200 > Date.now() / 1000) multiplier = 2;

  if (parseInt(myUser.patreonTierUntilDate) > Date.now() / 1000 && myUser.patreonTier > 0) {
    if (myUser.patreonTier == 1) multiplier = 2;
    else if (myUser.patreonTier == 2) multiplier = 3;
    else if (myUser.patreonTier == 3) multiplier = 4;
  }

  return multiplier;
};

export const getRawVoteMultiplier = (
  lastTopggUpvoteDate: number,
  patreonTierUntilDate: number,
  patreonTier: number,
) => {
  let multiplier = 1;

  if (lastTopggUpvoteDate + 259200 > Date.now() / 1000) multiplier = 2;

  if (patreonTierUntilDate > Date.now() / 1000 && patreonTier > 0) {
    if (patreonTier == 1) multiplier = 2;
    else if (patreonTier == 2) multiplier = 3;
    else if (patreonTier == 3) multiplier = 4;
  }

  return multiplier;
};

export const getPatreonTierName = (tier: number) => {
  if (tier == 3) return 'Serveradmin';
  else if (tier == 2) return 'Poweruser';
  else if (tier == 1) return 'Supporter';
  else return 'No tier';
};

export default {
  waitAndReboot,
  sleep,
  hasNoXpRole,
  extractPageSimple,
  getLevel,
  getLevelProgression,
  getPatreonTiers,
  getVoteMultiplier,
  getPatreonTierName,
};
