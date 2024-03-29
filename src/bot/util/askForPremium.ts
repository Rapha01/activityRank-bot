import userModel from '../models/userModel.js';
import fct from '../../util/fct.js';
import { getWaitTime } from './cooldownUtil.js';
import { ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { oneLine } from 'common-tags';
import guildModel from 'bot/models/guild/guildModel.js';

const isDev = process.env.NODE_ENV !== 'production';

const askForPremiumCdGuild = isDev ? 3600 * 0.4 : 3600 * 0.4;
const askForPremiumCdUser = isDev ? 3600 * 6 : 3600 * 6;

export default async function (interaction: ChatInputCommandInteraction<'cached'>) {
  const cachedGuild = await guildModel.cache.get(interaction.guild);
  const onGuildCooldown =
    getWaitTime(cachedGuild.cache.lastAskForPremiumDate, askForPremiumCdGuild).remaining > 0;

  if (onGuildCooldown) return;

  const { userTier, ownerTier } = await fct.getPatreonTiers(interaction);
  if (userTier > 0 || ownerTier > 0) return;

  const myUser = await userModel.storage.get(interaction.user);

  const now = Date.now() / 1000;
  if (now - myUser.lastAskForPremiumDate < askForPremiumCdUser) return;

  await userModel.storage.set(interaction.user, 'lastAskForPremiumDate', now);
  cachedGuild.cache.lastAskForPremiumDate = new Date();

  await sendAskForPremiumEmbed(interaction);
}

async function sendAskForPremiumEmbed(interaction: ChatInputCommandInteraction<'cached'>) {
  const e = new EmbedBuilder()
    .setTitle('Thank you for using ActivityRank!')
    .setColor(0x00ae86)
    .setThumbnail(interaction.client.user.displayAvatarURL());

  e.addFields({
    name: 'The maintenance and development of this bot depend on your support!',
    value: oneLine`${interaction.user}, please consider helping us by becoming a Patron. 
      The bot is mostly free! Activating Premium for you or your server can unlock some new 
      features and gives you quality of life upgrades, like reduced cooldowns on commands. 
      Simply go to https://patreon.com/rapha01/ select your preferred tier and become a Patron. **Thank you!**`,
  });

  await interaction.followUp({ embeds: [e], ephemeral: true });
}
