import { command, Deploy, permissions, subcommand } from '#bot/util/registry/command.js';
import { HELPSTAFF_ONLY } from '#bot/util/predicates.js';
import { ApplicationCommandOptionType } from 'discord.js';
import { getGuildModel } from '#bot/models/guild/guildModel.js';
import { debugCommandData } from './debug.js';

const option = {
  name: 'id',
  description: 'The ID of the guild to switch debug mode of',
  type: ApplicationCommandOptionType.String,
  min_length: 17,
  max_length: 20,
  required: true,
} as const;

const enable = subcommand({
  data: {
    name: 'enable',
    description: 'Enable debug mode for a server.',
    options: [option],
    type: ApplicationCommandOptionType.Subcommand,
  },
  async execute({ interaction, client }) {
    const guildId = interaction.options.getString('id', true);
    const guild = await client.guilds.fetch(guildId);
    const targetGuild = await getGuildModel(guild);

    if (targetGuild.cache.debugMode) {
      await interaction.reply({
        content: 'This server is already in debug mode.',
        ephemeral: true,
      });
      return;
    }

    const newCommand = await guild.commands.create(debugCommandData);

    targetGuild.cache.debugMode = true;

    await interaction.reply({
      content: `Enabled debug mode for the server. They can run their </debug:${newCommand.id}> command via \`</debug:${newCommand.id}>\``,
      ephemeral: true,
    });
  },
});

const disable = subcommand({
  data: {
    name: 'disable',
    description: 'Disable debug mode for a server.',
    options: [option],
    type: ApplicationCommandOptionType.Subcommand,
  },
  async execute({ interaction, client }) {
    const guildId = interaction.options.getString('id', true);
    const guild = await client.guilds.fetch(guildId);
    const targetGuild = await getGuildModel(guild);

    const debugCommand = guild.commands.cache.find((command) => command.name === 'debug');

    if (debugCommand) {
      await guild.commands.delete(debugCommand);
      await interaction.reply({
        content: 'Removed debug command and disabled debug mode for the server.',
        ephemeral: true,
      });
    } else {
      await interaction.reply({
        content: 'Disabled debug mode for the server. It did not already have a debug command registered.',
        ephemeral: true,
      });
    }

    targetGuild.cache.debugMode = false;
  },
});

export default command.parent({
  deploymentMode: Deploy.LocalOnly,
  predicate: HELPSTAFF_ONLY,
  data: {
    name: 'debug-guild',
    description: 'Enable or disable debug mode for a server.',
    default_member_permissions: permissions(permissions.ModerateMembers),
  },
  subcommands: [enable, disable],
});
