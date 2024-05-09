import fct from '../../util/fct.js';
import type { ChatInputCommandInteraction, InteractionReplyOptions } from 'discord.js';
import { Time } from '@sapphire/duration';
import { getGuildModel } from 'bot/models/guild/guildModel.js';
import { isPrivileged } from 'const/config.js';
import { getMemberModel } from 'bot/models/guild/guildMemberModel.js';
import { PATREON_COMPONENTS, PATREON_URL } from './constants.js';

const premiumLowersCooldownMessage = `You can significantly lower this cooldown by supporting the bot and choosing the proper patreon tier for your needs. You can find further info about it [on our Patreon](<${PATREON_URL}>).`;

// TODO style with new timestamps
const activeStatCommandCooldown = (cd: number, toWait: number) =>
  `You can use stat commands only once per ${Math.floor(
    cd / 1000,
  )} seconds. Please wait ${Math.ceil(toWait / 1000)} more seconds.`;

const activeResetServerCommandCooldown = (cd: number, toWait: number) =>
  `You can start a server reset only once every ${Math.floor(
    cd / 1000,
  )} seconds. Please wait ${Math.ceil(toWait / 1000)} more seconds.`;

export function getWaitTime(lastDate: Date | number | undefined | null, cooldown: number) {
  const now = Date.now();
  const then = lastDate instanceof Date ? lastDate.getTime() : lastDate ?? 0;
  const remaining = cooldown - (now - then);
  return { remaining, next: new Date(now + remaining) };
}

/** @deprecated prefer {@link getWaitTime()} */
// @ts-expect-error Type checking disabled for deprecated fn
export const getCachedCooldown = (cache, field, cd) => {
  const nowDate = Date.now() / 1000;

  if (typeof cache[field] === 'undefined') cache[field] = 0;

  const remaining = cd - (nowDate - cache[field]);
  return remaining;
};

export const checkStatCommandsCooldown = async (
  interaction: ChatInputCommandInteraction<'cached'>,
) => {
  if (isPrivileged(interaction.user.id)) return true;

  const { userTier, ownerTier } = await fct.getPatreonTiers(interaction);

  let cd = Time.Minute * 5;
  if (userTier == 1) cd = Time.Minute;
  if (ownerTier == 3) cd = Time.Minute / 2;
  if (userTier == 2 || userTier == 3) cd = Time.Second * 5;

  const cachedMember = await getMemberModel(interaction.member);

  const toWait = getWaitTime(cachedMember.cache.lastStatCommandDate, cd);

  const reply: InteractionReplyOptions = {
    content: activeStatCommandCooldown(cd, toWait.remaining),
  };

  if (userTier < 2) {
    reply.content += premiumLowersCooldownMessage;
    reply.components = PATREON_COMPONENTS;
  }

  if (toWait.remaining > 0) {
    if (interaction.deferred) {
      await interaction.editReply(reply);
    } else {
      await interaction.reply({ ...reply, ephemeral: true });
    }
    return false;
  }

  cachedMember.cache.lastStatCommandDate = new Date();
  return true;
};

export const checkResetServerCommandCooldown = async (
  interaction: ChatInputCommandInteraction<'cached'>,
) => {
  const { userTier, ownerTier } = await fct.getPatreonTiers(interaction);

  let cd = Time.Hour / 2;
  if (userTier == 1) cd = Time.Minute * 10;
  if (ownerTier == 3) cd = Time.Minute * 5;
  if (userTier == 2 || userTier == 3) cd = Time.Minute * 2;

  const premiumLowersCooldownString =
    userTier == 2 || userTier == 3 ? '' : premiumLowersCooldownMessage;

  const cachedGuild = await getGuildModel(interaction.guild);

  const toWait = getWaitTime(cachedGuild.cache.lastResetServer, cd);
  if (toWait.remaining > 0) {
    await interaction.channel?.send(
      activeResetServerCommandCooldown(cd, toWait.remaining) + premiumLowersCooldownString,
    );
    return false;
  }

  cachedGuild.cache.lastResetServer = new Date();
  return true;
};

export default {
  getCachedCooldown,
  checkStatCommandsCooldown,
  checkResetServerCommandCooldown,
};
