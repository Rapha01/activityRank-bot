import { ApplicationCommandOptionType, PermissionFlagsBits } from 'discord.js';
import { stripIndent } from 'common-tags';
import { getGuildModel } from '../../models/guild/guildModel.js';
import { subcommand } from '#bot/commands.js';

const xpPerOption = (name: string, object: string, min: number, max: number) =>
  ({
    name,
    description: `The amount of XP gained per ${object}`,
    min_value: min,
    max_value: max,
    type: ApplicationCommandOptionType.Integer,
  }) as const;

export const xpPer = subcommand({
  data: {
    name: 'xp-per',
    description: 'Set the amount of XP gained from each source.',
    type: ApplicationCommandOptionType.Subcommand,
    options: [
      xpPerOption('message', 'message sent', 0, 10),
      xpPerOption('voiceminute', 'minute spent in VC', 0, 5),
      xpPerOption('vote', 'upvote', 0, 100),
      xpPerOption('invite', 'member invited to the server', 0, 1_000),
    ],
  },
  async execute({ interaction }) {
    if (
      !interaction.channel ||
      !interaction.member.permissionsIn(interaction.channel).has(PermissionFlagsBits.ManageGuild)
    ) {
      await interaction.reply({
        content: 'You need the permission to manage the server in order to use this command.',
        ephemeral: true,
      });
      return;
    }

    const items = {
      xpPerTextMessage: interaction.options.getInteger('message') ?? undefined,
      xpPerVoiceMinute: interaction.options.getInteger('voiceminute') ?? undefined,
      xpPerVote: interaction.options.getInteger('vote') ?? undefined,
      xpPerInvite: interaction.options.getInteger('invite') ?? undefined,
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

    await interaction.reply({
      embeds: [
        {
          author: { name: 'XP Values' },
          color: 0x00ae86,
          description: stripIndent`
            Modified XP Values! New values:
      
            \`${cachedGuild.db.xpPerTextMessage} xp\` per text message
            \`${cachedGuild.db.xpPerVoiceMinute} xp\` per minute in VC
            \`${cachedGuild.db.xpPerVote} xp\` per vote
            \`${cachedGuild.db.xpPerInvite} xp\` per invite
          `,
        },
      ],
      ephemeral: true,
    });
  },
});
