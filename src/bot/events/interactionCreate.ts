import { getGuildModel } from '../models/guild/guildModel.js';
import userModel from '../models/userModel.js';
import guildChannelModel from '../models/guild/guildChannelModel.js';
import askForPremium from '../util/askForPremium.js';
import {
  PermissionFlagsBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  type Interaction,
  type AutocompleteInteraction,
  type ChatInputCommandInteraction,
  type ContextMenuCommandInteraction,
  DiscordAPIError,
  RESTJSONErrorCodes,
  Events,
} from 'discord.js';
import { stripIndent } from 'common-tags';
import {
  ComponentKey,
  INTERACTION_MAP_VERSION,
  commandMap,
  componentMap,
  contextMap,
  customIdMap,
  getCustomIdDropper,
  modalMap,
} from 'bot/util/commandLoader.js';
import { logger } from 'bot/util/logger.js';
import { registerEvent } from 'bot/util/eventLoader.js';
import { config, getPrivileges, hasPrivilege } from 'const/config.js';

registerEvent(Events.InteractionCreate, async function (interaction) {
  try {
    if (!interaction.inCachedGuild()) return;

    if (interaction.isAutocomplete()) {
      const ref = commandMap.get(getCommandId(interaction));

      if (ref) {
        if (ref.executeAutocomplete) {
          await ref.executeAutocomplete(interaction);
        } else {
          logger.warn(
            interaction,
            `No autocomplete method found on command ${interaction.commandName}`,
          );
        }
      } else {
        logger.warn(
          interaction,
          `No command found in map for command with name ${interaction.commandName} (checking autocomplete)`,
        );
      }
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
      return await interaction.reply({
        content: 'This is a noCommand channel, and you are not an admin.',
        ephemeral: true,
      });
    }

    // TODO: deprecate in favor of native Discord slash command configs
    if (
      cachedGuild.db.commandOnlyChannel !== '0' &&
      cachedGuild.db.commandOnlyChannel !== interaction.channel.id &&
      !interaction.member.permissionsIn(interaction.channel).has(PermissionFlagsBits.ManageGuild)
    ) {
      return await interaction.reply({
        content: `Commands can only be used in <#${cachedGuild.db.commandOnlyChannel}> unless you are an admin.`,
        ephemeral: true,
      });
    }

    // TODO: refactor to clean up
    if (interaction.isMessageComponent()) {
      const [version, identifier, instance] = interaction.customId.split('.');
      if (identifier === ComponentKey.Ignore || version === ComponentKey.Ignore) return;
      if (identifier === ComponentKey.Throw) throw new Error('should never occur');
      const ref = componentMap.get(identifier);

      if (version !== INTERACTION_MAP_VERSION) {
        await interaction.reply({
          content: 'Oops! This is an old menu. Make a new one by re-running the command!',
          ephemeral: true,
        });
      } else if (ref) {
        const data = customIdMap.get(instance);
        if (!data) {
          await interaction.reply({
            content: 'Oops! This menu timed out. Try again!',
            ephemeral: true,
          });
        } else if (data.options.ownerId && interaction.user.id !== data.options.ownerId) {
          await interaction.reply({
            content: "Sorry, this menu isn't for you.",
            ephemeral: true,
          });
        } else {
          const dropCustomId = getCustomIdDropper(interaction);
          // Typescript is weird and hard :(
          // https://github.com/Microsoft/TypeScript/issues/13995#issuecomment-363265172
          // @ts-expect-error
          await ref.callback({ interaction, data: data.data, dropCustomId });
        }
      } else {
        logger.warn(
          interaction,
          `No component found in map for interaction with customId ${interaction.customId}`,
        );
      }
    } else if (interaction.isModalSubmit()) {
      const [version, identifier, instance] = interaction.customId.split('.');
      const ref = modalMap.get(identifier);
      if (version !== INTERACTION_MAP_VERSION) {
        await interaction.reply({
          content: 'Oops! This is an old menu. Make a new one by re-running the command!',
          ephemeral: true,
        });
      } else if (ref) {
        const data = customIdMap.get(instance);
        if (!data) {
          await interaction.reply({
            content: 'Oops! This menu timed out. Try again!',
            ephemeral: true,
          });
        } else {
          const dropCustomId = getCustomIdDropper(interaction);
          await ref.callback({ interaction, data: data.data, dropCustomId });
        }
      } else {
        logger.warn(
          interaction,
          `No modal found in map for interaction with customId ${interaction.customId}`,
        );
      }
    } else if (interaction.isContextMenuCommand()) {
      const ref = contextMap.get(getCommandId(interaction));

      interaction.client.botShardStat.commandsTotal++;

      interaction.client.logger.debug(
        `Context command ${interaction.commandName} used by ${interaction.user.username} in guild ${interaction.guild.name}`,
      );

      if (ref) {
        await ref(interaction);
      } else {
        logger.warn(
          interaction,
          `No command found in map for context menu with name ${interaction.commandName}`,
        );
      }
    } else if (interaction.isChatInputCommand()) {
      const ref =
        commandMap.get(getCommandId(interaction)) ?? commandMap.get(interaction.commandName);

      interaction.client.botShardStat.commandsTotal++;

      interaction.client.logger.debug(
        `/${interaction.commandName} used by ${interaction.user.username} in guild ${interaction.guild.name}`,
      );

      if (ref) {
        if (ref.privilege && !hasPrivilege(ref.privilege, getPrivileges()[interaction.user.id])) {
          interaction.client.logger.warn(interaction, 'Unauthorized admin command attempt');

          return await interaction.reply({
            content:
              'Sorry! This is an admin command you have no access to. Please report this to the developers of the bot.\n*[Have an xkcd for your troubles.](https://xkcd.com/838)*',
            ephemeral: true,
          });
        }
        if (ref.execute) {
          await ref.execute(interaction);
          if (!ref.privilege) await askForPremium(interaction);
        } else {
          logger.warn(interaction, `No execute method found on command ${interaction.commandName}`);
        }
      } else {
        logger.warn(
          interaction,
          `No command found in map for command with name ${interaction.commandName}`,
        );
      }
    } else {
      throw new Error('unhandled interaction');
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

function getCommandId(
  interaction:
    | ChatInputCommandInteraction
    | ContextMenuCommandInteraction
    | AutocompleteInteraction,
) {
  const src =
    interaction.isChatInputCommand() || interaction.isAutocomplete()
      ? [
          interaction.commandName,
          interaction.options.getSubcommandGroup(false),
          interaction.options.getSubcommand(false),
        ]
      : [interaction.commandName];

  return src.filter(Boolean).join('.');
}

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

  const cachedUser = await userModel.cache.get(interaction.user);

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
