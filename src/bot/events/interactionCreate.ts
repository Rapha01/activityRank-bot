import { event } from 'bot/util/registry/event.js';
import { Events } from 'discord.js';
import { getGuildModel } from '../models/guild/guildModel.js';
import { getUserModel } from '../models/userModel.js';
import guildChannelModel from '../models/guild/guildChannelModel.js';
import askForPremium from '../util/askForPremium.js';
import {
  type Interaction,
  type AutocompleteInteraction,
  PermissionFlagsBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  DiscordAPIError,
  RESTJSONErrorCodes,
} from 'discord.js';
import { stripIndent } from 'common-tags';
import { config } from 'const/config.js';
import { registry } from 'bot/util/registry/registry.js';

export default event(Events.InteractionCreate, async function (interaction) {
  try {
    if (!interaction.inCachedGuild())
      throw new Error('Interaction recieved outside of cached guild.');

    if (interaction.isAutocomplete()) {
      await registry.handleAutocomplete(interaction);
      return;
    }

    if (await executeBans(interaction)) return;

    if (!interaction.channel) {
      interaction.client.logger.error(interaction, 'interaction is lacking channel');
      return;
    }

    const cachedChannel = await guildChannelModel.cache.get(interaction.channel);
    const cachedGuild = await getGuildModel(interaction.guild);

    if (
      cachedChannel.db.noCommand &&
      !interaction.member.permissionsIn(interaction.channel).has(PermissionFlagsBits.ManageGuild)
    ) {
      await interaction.reply({
        content: 'This is a noCommand channel, and you are not an admin.',
        ephemeral: true,
      });
      return;
    }

    // TODO: deprecate in favor of native Discord slash command configs
    if (
      cachedGuild.db.commandOnlyChannel !== '0' &&
      cachedGuild.db.commandOnlyChannel !== interaction.channel.id &&
      !interaction.member.permissionsIn(interaction.channel).has(PermissionFlagsBits.ManageGuild)
    ) {
      await interaction.reply({
        content: `Commands can only be used in <#${cachedGuild.db.commandOnlyChannel}> unless you are an admin.`,
        ephemeral: true,
      });
      return;
    }

    if (interaction.isMessageComponent()) {
      await registry.handleComponent(interaction);
      return;
    } else if (interaction.isModalSubmit()) {
      await registry.handleComponent(interaction);
      return;
    } else if (interaction.isContextMenuCommand()) {
      interaction.client.botShardStat.commandsTotal++;
      interaction.client.logger.debug(
        `Context command ${interaction.commandName} used by ${interaction.user.username} in guild ${interaction.guild.name}`,
      );

      await registry.handleContextCommand(interaction);
    } else if (interaction.isChatInputCommand()) {
      interaction.client.botShardStat.commandsTotal++;

      interaction.client.logger.debug(
        `/${interaction.commandName} used by ${interaction.user.username} in guild ${interaction.guild.name}`,
      );

      await registry.handleSlashCommand(interaction);
      await askForPremium(interaction);
      return;
    }
  } catch (e) {
    try {
      if (interaction.isAutocomplete()) return;

      const message = {
        content: stripIndent`
        There was an error while executing this command! 
        If this error persists, report it [in our support server](${config.supportServer.invite})`,
        ephemeral: true,
      };

      if (interaction.replied) await interaction.followUp(message);
      else if (interaction.deferred) await interaction.editReply(message);
      else await interaction.reply(message);
    } catch (_e2) {
      const e2 = _e2 as DiscordAPIError | Error;
      if ('code' in e2 && e2.code === RESTJSONErrorCodes.UnknownInteraction)
        interaction.client.logger.debug('Unknown interaction while responding to command error');
      else
        interaction.client.logger.error(
          { err: e2, interaction },
          'Error while responding to command error',
        );
    }
    interaction.client.logger.warn({ err: e, interaction }, 'Command error');
  }
});

async function executeBans(
  interaction: Exclude<Interaction<'cached'>, AutocompleteInteraction<'cached'>>,
): Promise<boolean> {
  const cachedGuild = await getGuildModel(interaction.guild);

  if (cachedGuild.db.isBanned) {
    interaction.client.logger.debug(`Banned guild ${interaction.guild.id} used interaction.`);
    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setDescription('❌ This server been blacklisted from the bot.')
          .setColor(0xff0000),
      ],
      components: [
        new ActionRowBuilder<ButtonBuilder>().setComponents(
          new ButtonBuilder()
            .setStyle(ButtonStyle.Link)
            .setURL(config.supportServer.invite)
            .setLabel('Appeal'),
        ),
      ],
    });
    await interaction.guild.leave();
    return true;
  }

  const cachedUser = await getUserModel(interaction.user);

  if (cachedUser.db.isBanned) {
    interaction.client.logger.debug(`Banned user ${interaction.user.id} used interaction.`);
    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setDescription('❌ You have been blacklisted from the bot.')
          .setColor(0xff0000),
      ],
      components: [
        new ActionRowBuilder<ButtonBuilder>().setComponents(
          new ButtonBuilder()
            .setStyle(ButtonStyle.Link)
            .setURL(config.supportServer.invite)
            .setLabel('Appeal'),
        ),
      ],
      ephemeral: true,
    });
    return true;
  }

  return false;
}
