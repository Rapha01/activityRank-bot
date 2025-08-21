import { DurationFormat } from '@formatjs/intl-durationformat';
import { Time } from '@sapphire/duration';
import {
  type APIMessageTopLevelComponent,
  type ChatInputCommandInteraction,
  MessageFlags,
  time,
} from 'discord.js';
import type { TFunction } from 'i18next';
import { Temporal } from 'temporal-polyfill';
import { getMemberModel } from '#bot/models/guild/guildMemberModel.js';
import { getGuildModel } from '#bot/models/guild/guildModel.js';
import { RESET_GUILD_IDS } from '#bot/models/resetModel.js';
import { emoji, isPrivileged } from '#const/config.js';
import fct, { hasValidEntitlement } from '../../util/fct.js';
import { section, textDisplay } from './component.js';
import { PATREON_BUTTON, PATREON_URL, PREMIUM_BUTTON } from './constants.js';

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

const ALLOW = { allowed: true, denied: false };
const DENY = { allowed: false, denied: true };

export async function handleStatCommandsCooldown(
  t: TFunction<'command-content'>,
  interaction: ChatInputCommandInteraction<'cached'>,
): Promise<{ denied: boolean; allowed: boolean }> {
  // ActivityRank staff are exempt from stat command cooldowns
  if (isPrivileged(interaction.user.id)) return ALLOW;

  let cd = Time.Minute * 2;
  let skipAds = false;
  if (hasValidEntitlement(interaction)) {
    // guild has a Discord subscription
    cd = Time.Second * 5;
    skipAds = true;
  } else {
    const { userTier, ownerTier } = await fct.getPatreonTiers(interaction);
    if (userTier === 1) {
      // user has a Patreon subscription
      cd = Time.Second * 20;
      skipAds = true;
    }
    if (userTier >= 2 || ownerTier >= 2) {
      // user or server owner has a Patreon Tier 2 subscription
      cd = Time.Second * 5;
      skipAds = true;
    }
  }

  const cachedMember = await getMemberModel(interaction.member);

  const toWait = getWaitTime(cachedMember.cache.lastStatCommandDate, cd);

  // no need to wait any longer: set now as last command usage and allow
  if (toWait.remaining <= 0) {
    cachedMember.cache.lastStatCommandDate = new Date();
    return ALLOW;
  }

  const reply: { flags: number; components: APIMessageTopLevelComponent[] } = {
    components: [
      textDisplay(
        t('cooldown.statcommands', {
          prefix: emoji('no'),
          duration: fmtDuration(interaction.locale, cd),
          countdown: time(toWait.next, 'R'),
        }),
      ),
    ],
    flags: MessageFlags.IsComponentsV2,
  };

  if (!skipAds) {
    reply.components.push(
      section(
        textDisplay(
          `To speed up stat commands and support the bot, please consider **[becoming a Patron](<${PATREON_URL}>)**.`,
        ),
        PATREON_BUTTON,
      ),
      section(
        textDisplay(
          `To make these commands faster for everyone in your server, consider **activating ${emoji('store')} Premium** for your server!`,
        ),
        PREMIUM_BUTTON,
      ),
    );
  }

  if (interaction.deferred) {
    await interaction.editReply(reply);
  } else {
    await interaction.reply({ ...reply, flags: MessageFlags.Ephemeral | reply.flags });
  }
  return DENY;
}

export async function handleResetCommandsCooldown(
  t: TFunction<'command-content'>,
  interaction: ChatInputCommandInteraction<'cached'>,
): Promise<{ denied: boolean; allowed: boolean }> {
  if (RESET_GUILD_IDS.has(interaction.guildId)) {
    await interaction.reply({
      content: 'A reset job is currently running. Try again later.',
      ephemeral: true,
    });
    return DENY;
  }

  let cd = Time.Hour / 2;
  let skipAds = false;

  if (hasValidEntitlement(interaction)) {
    // guild has a Discord subscription
    cd = Time.Minute * 10;
    skipAds = true;
  } else {
    const { userTier, ownerTier } = await fct.getPatreonTiers(interaction);
    if (ownerTier >= 2) {
      cd = Time.Minute * 10;
      skipAds = true;
    }
    if (userTier >= 1) {
      skipAds = true;
    }
  }

  const cachedGuild = await getGuildModel(interaction.guild);

  const toWait = getWaitTime(cachedGuild.cache.lastResetServer, cd);

  // no need to wait any longer: set now as last reset and allow
  if (toWait.remaining <= 0) {
    cachedGuild.cache.lastResetServer = new Date();
    return ALLOW;
  }

  const reply: { flags: number; components: APIMessageTopLevelComponent[] } = {
    components: [
      textDisplay(
        t('cooldown.resetcommands', {
          prefix: emoji('no'),
          duration: fmtDuration(interaction.locale, cd),
          countdown: time(toWait.next, 'R'),
        }),
      ),
    ],
    flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
  };

  if (!skipAds) {
    reply.components.push(
      section(
        textDisplay(
          `To speed up resets, consider **activating ${emoji('store')} Premium** for your server!`,
        ),
        PREMIUM_BUTTON,
      ),
    );
  }

  await interaction.reply(reply);
  return DENY;
}

function fmtDuration(locale: string, milliseconds: number): string {
  let dura = Temporal.Duration.from({ milliseconds });
  // balances `dura` up until "x days"
  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Temporal/Duration#duration_balancing
  const smallestUnit = milliseconds > 60_000 * 3 ? 'minutes' : 'seconds';
  dura = dura.round({ smallestUnit, largestUnit: 'days' });

  return new DurationFormat([locale, 'en-US'], { style: 'long' }).format(dura);
}
