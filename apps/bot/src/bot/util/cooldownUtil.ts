import fct from '../../util/fct.js';
import { time, type ChatInputCommandInteraction, type InteractionReplyOptions } from 'discord.js';
import { Time } from '@sapphire/duration';
import { getGuildModel } from '#bot/models/guild/guildModel.js';
import { isPrivileged } from '#const/config.js';
import { getMemberModel } from '#bot/models/guild/guildMemberModel.js';
import { PATREON_COMPONENTS, PATREON_URL } from './constants.js';
import { RESET_GUILD_IDS } from '#bot/models/resetModel.js';

const premiumLowersCooldownMessage = `You can significantly lower this cooldown by supporting the bot and choosing the proper patreon tier for your needs. You can find further info about it [on our Patreon](<${PATREON_URL}>).`;

const activeStatCommandCooldown = (cd: number, next: Date) =>
  `You can use stat commands only once per ${Math.floor(
    cd / 1000,
  )} seconds. You can use it again ${time(next, 'R')}.`;

const activeResetServerCommandCooldown = (cd: number, next: Date) =>
  `You can start a server reset only once every ${Math.floor(
    cd / 1000,
  )} seconds. You can start another reset ${time(next, 'R')}.`;

/**
 * Calculates the remaining wait time and the next trigger time based on the last recorded date and a cooldown period.
 *
 * @param lastDate - The last date when the event occurred. It can be a `Date` object, a timestamp (number), `undefined`, or `null`. If `undefined` or `null`, it defaults to 0 - i.e. having never occurred before.
 * @param cooldown - The cooldown period in milliseconds that must elapse before the next event can occur.
 *
 * @returns An object containing:
 * - `remaining`: The remaining wait time in milliseconds before the cooldown period elapses.
 * - `next`: A `Date` object representing the next possible trigger time.
 *
 * @example
 * const result = getWaitTime(new Date(), 10000);
 * console.log(result.remaining); // Logs remaining wait time in milliseconds
 * console.log(result.next); // Logs the next trigger date
 */
export function getWaitTime(lastDate: Date | number | undefined | null, cooldown: number) {
  const now = Date.now();
  const then = lastDate instanceof Date ? lastDate.getTime() : (lastDate ?? 0);
  const remaining = cooldown - (now - then);
  return { remaining, next: new Date(now + remaining) };
}

export async function handleStatCommandsCooldown(
  interaction: ChatInputCommandInteraction<'cached'>,
): Promise<{ denied: boolean; allowed: boolean }> {
  const res = (allowed: boolean) => ({ allowed, denied: !allowed });

  if (isPrivileged(interaction.user.id)) return res(true);

  const { userTier, ownerTier } = await fct.getPatreonTiers(interaction);

  let cd = Time.Minute * 2;
  if (userTier == 1) cd = Time.Second * 20;
  if (userTier >= 2 || ownerTier >= 2) cd = Time.Second * 3;

  const cachedMember = await getMemberModel(interaction.member);

  const toWait = getWaitTime(cachedMember.cache.lastStatCommandDate, cd);

  // no need to wait any longer: set now as last command usage and allow
  if (toWait.remaining <= 0) {
    cachedMember.cache.lastStatCommandDate = new Date();
    return res(true);
  }

  const reply: InteractionReplyOptions = {
    content: activeStatCommandCooldown(cd, toWait.next),
  };

  if (userTier < 2) {
    reply.content += premiumLowersCooldownMessage;
    reply.components = PATREON_COMPONENTS;
  }

  if (interaction.deferred) {
    await interaction.editReply(reply);
  } else {
    await interaction.reply({ ...reply, ephemeral: true });
  }
  return res(false);
}

export async function handleResetCommandsCooldown(
  interaction: ChatInputCommandInteraction<'cached'>,
): Promise<{ denied: boolean; allowed: boolean }> {
  const res = (allowed: boolean) => ({ allowed, denied: !allowed });

  if (RESET_GUILD_IDS.has(interaction.guildId)) {
    await interaction.reply({
      content: 'A reset job is currently running. Try again later.',
      ephemeral: true,
    });
    return res(false);
  }

  const { userTier, ownerTier } = await fct.getPatreonTiers(interaction);

  let cd = Time.Hour / 2;
  if (userTier == 1) cd = Time.Minute * 10;
  if (ownerTier == 3) cd = Time.Minute * 5;
  if (userTier == 2 || userTier == 3) cd = Time.Minute * 2;

  const cachedGuild = await getGuildModel(interaction.guild);

  const toWait = getWaitTime(cachedGuild.cache.lastResetServer, cd);

  // no need to wait any longer: set now as last reset and allow
  if (toWait.remaining <= 0) {
    cachedGuild.cache.lastResetServer = new Date();
    return res(true);
  }

  const reply: InteractionReplyOptions = {
    content: activeResetServerCommandCooldown(cd, toWait.next),
  };

  if (userTier < 2) {
    reply.content += premiumLowersCooldownMessage;
    reply.components = PATREON_COMPONENTS;
  }

  await interaction.reply({ ...reply, ephemeral: true });
  return res(false);
}
