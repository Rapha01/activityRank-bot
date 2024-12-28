import { ApplicationCommandOptionType, EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import { stripIndent } from 'common-tags';
import { getGuildModel } from '../../models/guild/guildModel.js';
import prettyTime from 'pretty-ms';
import { subcommand } from '#bot/util/registry/command.js';

export const cooldown = subcommand({
  data: {
    name: 'cooldown',
    description: 'Change the message and vote cooldowns.',
    type: ApplicationCommandOptionType.Subcommand,
    options: [
      {
        name: 'message',
        description: 'The time between messages that can count for XP.',
        min_value: 0,
        max_value: 120,
        type: ApplicationCommandOptionType.Integer,
        autocomplete: true,
      },
      {
        name: 'vote',
        description: 'The time members must wait between upvotes.',
        min_value: 180,
        max_value: 86400,
        type: ApplicationCommandOptionType.Integer,
        autocomplete: true,
      },
    ],
  },
  async execute({ interaction }) {
    if (
      !interaction.member.permissionsIn(interaction.channel!).has(PermissionFlagsBits.ManageGuild)
    ) {
      await interaction.reply({
        content: 'You need the permission to manage the server in order to use this command.',
        ephemeral: true,
      });
      return;
    }

    const items = {
      textMessageCooldownSeconds: interaction.options.getInteger('message') ?? undefined,
      voteCooldownSeconds: interaction.options.getInteger('vote') ?? undefined,
    };
    if (Object.values(items).every((x) => x === undefined)) {
      await interaction.reply({
        content: 'You must specify at least one option for this command to do anything!',
        ephemeral: true,
      });
      return;
    }

    const cachedGuild = await getGuildModel(interaction.guild);
    await cachedGuild.upsert(items);

    const pretty = (sec: number) => prettyTime(sec * 1000, { verbose: true });

    await interaction.reply({
      embeds: [
        {
          author: { name: 'Cooldown Values' },
          color: 0x00ae86,
          description: stripIndent`
            Modified Cooldown Values! New values:
      
            Messages will only give XP if their author has not sent one in the last \`${pretty(
              cachedGuild.db.textMessageCooldownSeconds,
            )}\`.
            Votes will have a cooldown of \`${pretty(cachedGuild.db.voteCooldownSeconds)}\`.
            `,
        },
      ],
      ephemeral: true,
    });
  },
  autocomplete: {
    async message({ interaction }) {
      await interaction.respond([
        { name: 'No time', value: 0 },
        { name: '5 seconds', value: 5 },
        { name: '15 seconds', value: 15 },
        { name: '30 seconds', value: 30 },
        { name: '1 minute', value: 60 },
        { name: '2 minutes', value: 120 },
      ]);
    },
    async vote({ interaction }) {
      await interaction.respond([
        { name: '3 minutes', value: 60 * 3 },
        { name: '5 minutes', value: 60 * 5 },
        { name: '10 minutes', value: 60 * 10 },
        { name: '30 minutes', value: 60 * 30 },
        { name: '1 hour', value: 60 * 60 },
        { name: '3 hours', value: 60 * 60 * 3 },
        { name: '6 hours', value: 60 * 60 * 6 },
        { name: '12 hours', value: 60 * 60 * 12 },
        { name: '24 hours', value: 60 * 60 * 24 },
      ]);
    },
  },
});
