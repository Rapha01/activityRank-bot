import { ApplicationCommandOptionType, PermissionFlagsBits } from 'discord.js';
import { stripIndent } from 'common-tags';
import { getGuildModel } from '../../models/guild/guildModel.js';
import { subcommand } from '#bot/commands.js';

const xpPerOption = (name: string, object: string, min: number, max: number) =>
  ({
    name,
    description: `The amount of XP gained per ${object} during bonustime`,
    min_value: min,
    max_value: max,
    type: ApplicationCommandOptionType.Integer,
  }) as const;

export const bonusXpPer = subcommand({
  data: {
    name: 'bonus-xp-per',
    description: 'Set the amount of bonus XP gained from each source while bonustime is active.',
    type: ApplicationCommandOptionType.Subcommand,
    options: [
      xpPerOption('message', 'message sent', 0, 20),
      xpPerOption('voiceminute', 'minute spent in VC', 0, 10),
      xpPerOption('vote', 'upvote', 0, 200),
      xpPerOption('invite', 'member invited to the server', 0, 2_000),
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
      bonusPerTextMessage: interaction.options.getInteger('message') ?? undefined,
      bonusPerVoiceMinute: interaction.options.getInteger('voiceminute') ?? undefined,
      bonusPerVote: interaction.options.getInteger('vote') ?? undefined,
      bonusPerInvite: interaction.options.getInteger('invite') ?? undefined,
    };
    if (Object.values(items).every((x) => x === undefined)) {
      await interaction.reply({
        content: 'You must specify at least one option for this command to do anything!',
        ephemeral: true,
      });
      return;
    }

    const cachedGuild = await getGuildModel(interaction.guild);
    cachedGuild.upsert(items);

    await interaction.reply({
      embeds: [
        {
          author: { name: 'Bonus XP Values' },
          color: 0x00ae86,
          description: stripIndent`
            Modified Bonus XP Values! New values:
      
            \`${cachedGuild.db.bonusPerTextMessage} xp\` per text message
            \`${cachedGuild.db.bonusPerVoiceMinute} xp\` per minute in VC
            \`${cachedGuild.db.bonusPerVote} xp\` per vote
            \`${cachedGuild.db.bonusPerInvite} xp\` per invite
          `,
        },
      ],
      ephemeral: true,
    });
  },
});
