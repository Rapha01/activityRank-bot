import { EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import { stripIndent } from 'common-tags';
import guildModel from '../../models/guild/guildModel.js';
import prettyTime from 'pretty-ms';
import { registerSubCommand } from 'bot/util/commandLoader.js';

registerSubCommand({
  async execute(interaction) {
    if (
      !interaction.member.permissionsIn(interaction.channel!).has(PermissionFlagsBits.ManageGuild)
    ) {
      return await interaction.reply({
        content: 'You need the permission to manage the server in order to use this command.',
        ephemeral: true,
      });
    }

    const items = {
      textMessageCooldownSeconds: interaction.options.getInteger('message'),
      voteCooldownSeconds: interaction.options.getInteger('vote'),
    };
    if (Object.values(items).every((x) => x === null)) {
      return await interaction.reply({
        content: 'You must specify at least one option for this command to do anything!',
        ephemeral: true,
      });
    }

    for (const _k in items) {
      const k = _k as keyof typeof items;
      if (items[k] !== null) await guildModel.storage.set(interaction.guild, k, items[k]);
    }

    await interaction.reply({
      embeds: [
        new EmbedBuilder().setAuthor({ name: 'Cooldown Values' }).setColor(0x00ae86)
          .setDescription(stripIndent`
        Modified Cooldown Values! New values:
  
        Messages will only give XP if their author has not sent one in the last \`${prettyTime(
          interaction.guild.appData.textMessageCooldownSeconds * 1000,
          { verbose: true },
        )}\`.
        Votes will have a cooldown of \`${prettyTime(
          interaction.guild.appData.voteCooldownSeconds * 1000,
          {
            verbose: true,
          },
        )}\`.
        `),
      ],
      ephemeral: true,
    });
  },
  async executeAutocomplete(interaction) {
    const { name } = interaction.options.getFocused(true);
    if (name === 'message') {
      await interaction.respond([
        { name: 'No time', value: 0 },
        { name: '5 seconds', value: 5 },
        { name: '15 seconds', value: 15 },
        { name: '30 seconds', value: 30 },
        { name: '1 minute', value: 60 },
        { name: '2 minutes', value: 120 },
      ]);
    } else {
      await interaction.respond([
        { name: '3 minutes', value: 180 },
        { name: '5 minutes', value: 300 },
        { name: '10 minutes', value: 600 },
        { name: '30 minutes', value: 1800 },
        { name: '1 hour', value: 3600 },
        { name: '3 hours', value: 10800 },
        { name: '6 hours', value: 21600 },
        { name: '12 hours', value: 43200 },
        { name: '24 hours', value: 86400 },
      ]);
    }
  },
});
