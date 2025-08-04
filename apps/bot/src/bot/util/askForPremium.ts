import { type ChatInputCommandInteraction, EmbedBuilder, type Entitlement } from 'discord.js';
import { getGuildModel } from '#bot/models/guild/guildModel.js';
import fct from '../../util/fct.js';
import { getUserModel } from '../models/userModel.js';
import { PATREON_COMPONENTS, PATREON_URL } from './constants.js';
import { getWaitTime } from './cooldownUtil.js';

const isDev = process.env.NODE_ENV !== 'production';

const askForPremiumCdGuild = isDev ? 3600 * 0.4 : 3600 * 0.4;
const askForPremiumCdUser = isDev ? 3600 * 6 : 3600 * 6;

export default async function (interaction: ChatInputCommandInteraction<'cached'>) {
  const isValidEntitlement = (e: Entitlement) =>
    e.isGuildSubscription() &&
    e.isActive() &&
    e.guildId === interaction.guildId &&
    e.skuId === '1393334749568696361'; // Premium

  // Discord subscribers are exempt from ads
  if (interaction.entitlements.some(isValidEntitlement)) {
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

  await sendAskForPremiumEmbed(interaction);
}

async function sendAskForPremiumEmbed(interaction: ChatInputCommandInteraction<'cached'>) {
  const e = new EmbedBuilder()
    .setTitle('Thank you for using ActivityRank!')
    .setColor(0x01c3d9)
    .setThumbnail(interaction.client.user.displayAvatarURL());

  e.addFields({
    name: 'The maintenance and development of this bot depend on your support!',
    value: `${interaction.user}, please consider helping us by becoming a Patron. \
The bot is mostly free! Activating Premium for you or your server can unlock some new \
features and gives you quality of life upgrades, like reduced cooldowns on commands. \
Simply [select your preferred tier and become a Patron!](<${PATREON_URL}>). **Thank you!**`,
  });

  await interaction.followUp({
    embeds: [e],
    components: PATREON_COMPONENTS,
    ephemeral: true,
  });
}
