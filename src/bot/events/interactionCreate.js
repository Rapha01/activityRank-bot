const path = require('path');
const guildModel = require('../models/guild/guildModel.js');
const userModel = require('../models/userModel.js');
const guildChannelModel = require('../models/guild/guildChannelModel.js');
const tokenBurn = require('../util/tokenBurn.js');
const askForPremium = require('../util/askForPremium.js');
const {
  PermissionFlagsBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require('discord.js');
const { supportServerInviteLink } = require('../../const/config.js');
const { stripIndent } = require('common-tags');
const { userLevels } = require('../../const/privilegedUsers');

module.exports = {
  name: 'interactionCreate',
  async execute(interaction) {
    try {
      if (!interaction.guild || !interaction.channel) return;

      await guildModel.cache.load(interaction.guild);

      if (interaction.guild.appData.isBanned) {
        interaction.client.logger.debug(
          `Banned guild ${interaction.guild.id} used interaction.`
        );
        await interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setDescription('❌ This server been blacklisted from the bot.')
              .setColor(0xff0000),
          ],
          components: [
            new ActionRowBuilder().setComponents(
              new ButtonBuilder()
                .setStyle(ButtonStyle.Link)
                .setURL(supportServerInviteLink)
                .setLabel('Appeal')
            ),
          ],
        });
        return await interaction.guild.leave();
      }

      await userModel.cache.load(interaction.user);

      if (interaction.user.appData.isBanned) {
        interaction.client.logger.debug(
          `Banned user ${interaction.user.id} used interaction.`
        );
        return interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setDescription('❌ You have been blacklisted from the bot.')
              .setColor(0xff0000),
          ],
          components: [
            new ActionRowBuilder().setComponents(
              new ButtonBuilder()
                .setStyle(ButtonStyle.Link)
                .setURL(supportServerInviteLink)
                .setLabel('Appeal')
            ),
          ],
        });
      }

      await guildChannelModel.cache.load(interaction.channel);

      if (
        interaction.channel.appData.noCommand &&
        !interaction.member
          .permissionsIn(interaction.channel)
          .has(PermissionFlagsBits.ManageGuild)
      ) {
        return await interaction.reply({
          content: 'This is a noCommand channel, and you are not an admin.',
          ephemeral: true,
        });
      }

      if (
        interaction.guild.appData.commandOnlyChannel != 0 &&
        interaction.guild.appData.commandOnlyChannel !=
          interaction.channel.id &&
        !interaction.member
          .permissionsIn(interaction.channel)
          .has(PermissionFlagsBits.ManageGuild)
      ) {
        return await interaction.reply({
          content: `Commands can only be used in <#${interaction.guild.appData.commandOnlyChannel}> unless you are an admin.`,
          ephemeral: true,
        });
      }

      await tokenBurn(interaction.guild);

      if (
        interaction.isButton() ||
        interaction.isStringSelectMenu() ||
        interaction.isChannelSelectMenu()
      ) {
        await component(interaction);
      } else if (interaction.isModalSubmit()) {
        await modalSubmit(interaction);
      } else if (
        interaction.isCommand() ||
        interaction.isAutocomplete() ||
        interaction.isUserContextMenuCommand()
      ) {
        const command =
          interaction.client.commands.get(getPath(interaction)) ??
          interaction.client.adminCommands.get(interaction.commandName);

        if (!command) {
          interaction.client.logger.warn(interaction, 'No command found');
          return;
        }

        if (
          command.isAdmin &&
          userLevels[interaction.user.id] &&
          userLevels[interaction.user.id] < command.requiredPrivileges
        ) {
          interaction.client.logger.warn(
            interaction,
            'Unauthorized admin command attempt'
          );

          return await interaction.reply({
            content: 'This is an admin command you have no access to.',
            ephemeral: true,
          });
        }

        if (interaction.isCommand()) {
          await command.execute(interaction);
          if (!command.isAdmin) await askForPremium(interaction);
        } else if (interaction.isAutocomplete()) {
          await command.autocomplete(interaction);
        }
      }
    } catch (e) {
      try {
        const message = {
          content: stripIndent`
            There was an error while executing this command! 
            If this error persists, report it [in our support server](${supportServerInviteLink})`,
          ephemeral: true,
        };

        if (interaction.replied) await interaction.followUp(message);
        else if (interaction.deferred) await interaction.editReply(message);
        else await interaction.reply(message);
      } catch (e2) {
        if (e2.code === 10062)
          // Unknown Interaction
          interaction.client.logger.debug(
            'Unknown interaction while responding to command error'
          );
        else
          interaction.client.logger.error(
            { err: e2 },
            'Error while responding to command error'
          );
      }
      interaction.client.logger.warn({ err: e, interaction }, 'Command error');
    }
  },
};

const getPath = (interaction) => {
  const args = [
    interaction.commandName,
    interaction.options?.getSubcommandGroup(false),
    interaction.options?.getSubcommand(false),
  ].filter((i) => i !== null);
  return path.join(...args);
};

const component = async (interaction) => {
  if (interaction.customId.split(' ')[0] === 'ignore') return;
  const command = interaction.client.commands.get(
    interaction.customId.split(' ')[0]
  );

  if (!command) return;

  await command.component(interaction);
};

async function modalSubmit(interaction) {
  const command = interaction.client.commands.get(
    interaction.customId.split(' ')[0]
  );
  if (!command) return;
  await command.modal(interaction);
}
