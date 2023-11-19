import guildModel from '../models/guild/guildModel.js';
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
import { supportServerInviteLink } from '../../const/config.js';
import { stripIndent } from 'common-tags';
import { userLevels } from '../../const/privilegedUsers.js';
import {
  ComponentKey,
  commandMap,
  componentMap,
  contextMap,
  modalMap,
} from 'bot/util/commandLoader.js';
import { logger } from 'bot/util/logger.js';
import { hasPrivilege } from 'const/privilegeLevels.js';
import { registerEvent } from 'bot/util/eventLoader.js';
import { incrementShardStat } from 'bot/models/shardStatModel.js';

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
    const cachedGuild = await guildModel.cache.get(interaction.guild);

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

    if (interaction.isMessageComponent()) {
      const parts = interaction.customId.split(' ');
      const key = parts[0];
      if (key.startsWith(ComponentKey.Ignore)) return;
      if (key === ComponentKey.Throw) throw new Error('should never occur');
      const ref = componentMap.get(key);
      if (ref) {
        const opts = JSON.parse(parts[2]);
        if (opts && opts.ownerId && interaction.user.id !== opts.ownerId) {
          await interaction.reply({
            content: "Sorry, this menu isn't for you.",
            ephemeral: true,
          });
        } else {
          // Typescript is weird and hard :(
          // https://github.com/Microsoft/TypeScript/issues/13995#issuecomment-363265172
          // @ts-expect-error
          await ref.callback(interaction, JSON.parse(parts[1]));
        }
      } else {
        logger.warn(
          interaction,
          `No component found in map for interaction with customId ${interaction.customId}`,
        );
      }
    } else if (interaction.isModalSubmit()) {
      const ref = modalMap.get(interaction.customId.split(' ')[0]);
      if (ref)
        await ref.callback(
          interaction,
          JSON.parse(interaction.customId.split(' ').slice(1).join(' ')),
        );
      else
        logger.warn(
          interaction,
          `No modal found in map for interaction with customId ${interaction.customId}`,
        );
    } else if (interaction.isContextMenuCommand()) {
      const ref = contextMap.get(getCommandId(interaction));

      incrementShardStat('commandsTotal');

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
      const ref = commandMap.get(getCommandId(interaction));

      incrementShardStat('commandsTotal');

      interaction.client.logger.debug(
        `/${interaction.commandName} used by ${interaction.user.username} in guild ${interaction.guild.name}`,
      );

      if (ref) {
        if (ref.privilege && !hasPrivilege(ref.privilege, userLevels[interaction.user.id])) {
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
        If this error persists, report it [in our support server](${supportServerInviteLink})`,
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
  const cachedGuild = await guildModel.cache.get(interaction.guild);

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
            .setURL(supportServerInviteLink)
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
            .setURL(supportServerInviteLink)
            .setLabel('Appeal'),
        ),
      ],
    });
    return true;
  }

  return false;
}
