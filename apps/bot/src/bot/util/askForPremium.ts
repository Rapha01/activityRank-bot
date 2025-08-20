import { type ChatInputCommandInteraction, ComponentType, MessageFlags } from 'discord.js';
import { getGuildModel } from '#bot/models/guild/guildModel.js';
import { emoji } from '#const/config.js';
import fct, { hasValidEntitlement } from '../../util/fct.js';
import { getUserModel } from '../models/userModel.js';
import { section } from './component.js';
import { PATREON_BUTTON, PATREON_URL, PREMIUM_BUTTON } from './constants.js';
import { getWaitTime } from './cooldownUtil.js';
import { oneline } from './templateStrings.js';

const isDev = process.env.NODE_ENV !== 'production';

const askForPremiumCdGuild = isDev ? 3600 * 0.4 : 3600 * 0.4;
const askForPremiumCdUser = isDev ? 3600 * 6 : 3600 * 6;

export async function askForPremium(interaction: ChatInputCommandInteraction<'cached'>) {
  // Users in a subscribed server are exempt from ads
  if (hasValidEntitlement(interaction)) {
    return;
  }

  const cachedGuild = await getGuildModel(interaction.guild);
  const onGuildCooldown =
    getWaitTime(cachedGuild.cache.lastAskForPremiumDate, askForPremiumCdGuild).remaining > 0;

  if (onGuildCooldown) return;

  const { userTier, ownerTier } = await fct.getPatreonTiers(interaction);
  // Users with any patreon subscription and
  // servers where the owner is Tier 2 are exempt from ads
  if (userTier > 0 || ownerTier > 1) return;

  const userModel = await getUserModel(interaction.user);
  const myUser = await userModel.fetch();

  const now = Math.floor(Date.now() / 1000);
  if (now - Number.parseInt(myUser.lastAskForPremiumDate) < askForPremiumCdUser) return;

  await userModel.upsert({ lastAskForPremiumDate: now.toString() });
  cachedGuild.cache.lastAskForPremiumDate = new Date();

  await sendAskForPremiumRequest(interaction);
}

async function sendAskForPremiumRequest(interaction: ChatInputCommandInteraction<'cached'>) {
  await interaction.followUp({
    components: [
      {
        type: ComponentType.Container,
        components: [
          {
            type: ComponentType.TextDisplay,
            content: '## ActivityRank depends on your support!',
          },
          {
            type: ComponentType.TextDisplay,
            content: oneline`
              ${interaction.user.toString()}, please consider helping us by becoming a Premium supporter. \
              The bot is mostly free! Activating Premium for you or your server can unlock some new \
              features and gives you quality of life upgrades, like reduced cooldowns on commands.`,
          },
          {
            type: ComponentType.Section,
            components: [
              {
                type: ComponentType.TextDisplay,
                content: `To remove these ads and support the bot, please consider **[becoming a Patron](<${PATREON_URL}>)**.`,
              },
            ],
            accessory: PATREON_BUTTON,
          },
          section(
            {
              type: ComponentType.TextDisplay,
              content: `To support a server you love and help us improve the bot for everyone, consider **activating ${emoji('store')} Premium** for your server!`,
            },
            PREMIUM_BUTTON,
          ),
          {
            type: ComponentType.TextDisplay,
            content: `### ${emoji('activityrank')} Thank you for your support!`,
          },
        ],
        accentColor: 0x1c3d9,
      },
    ],
    allowedMentions: { parse: [] },
    flags: [MessageFlags.IsComponentsV2, MessageFlags.Ephemeral],
  });
}
