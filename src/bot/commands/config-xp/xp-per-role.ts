import { ApplicationCommandOptionType } from 'discord.js';
import { subcommand } from 'bot/util/registry/command.js';
import { getGuildModel } from 'bot/models/guild/guildModel.js';
import { getShardDb } from 'models/shardDb/shardDb.js';
import { stripIndent } from 'common-tags';

const xpPerOption = (name: string, object: string, min: number, max: number) =>
  ({
    name,
    description: `The amount of XP gained per ${object}`,
    min_value: min,
    max_value: max,
    type: ApplicationCommandOptionType.Integer,
  }) as const;

export const xpPerRole = subcommand({
  data: {
    name: 'xp-per-role',
    description: 'Set the amount of XP users with this role will gain from each source.',
    type: ApplicationCommandOptionType.Subcommand,
    options: [
      {
        name: 'role',
        description: 'The role to configure xp-per values of',
        required: true,
        type: ApplicationCommandOptionType.Role,
      },
      xpPerOption('message', 'message sent', 0, 30),
      xpPerOption('voiceminute', 'minute spent in VC', 0, 15),
      xpPerOption('vote', 'upvote', 0, 300),
      xpPerOption('invite', 'member invited to the server', 0, 3_000),
    ],
  },
  async execute({ interaction }) {
    const role = interaction.options.getRole('role', true);

    if (role.id === interaction.guild.id) {
      await interaction.reply({
        content: 'You cannot configure the xp-per @everyone. Try `/config-xp xp-per` instead.',
        ephemeral: true,
        allowedMentions: { parse: [] },
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

    const guildModel = await getGuildModel(role.guild);
    const db = getShardDb(guildModel.dbHost);

    await db
      .insertInto('guildRole')
      .values({ guildId: role.guild.id, roleId: role.id, ...items })
      .onDuplicateKeyUpdate(items)
      .executeTakeFirstOrThrow();

    const dbRole = await db
      .selectFrom('guildRole')
      .select(['xpPerTextMessage', 'xpPerVoiceMinute', 'xpPerVote', 'xpPerInvite'])
      .where('guildId', '=', role.guild.id)
      .where('roleId', '=', role.id)
      .executeTakeFirstOrThrow();

    const relativeValue = (key: keyof typeof dbRole): number => {
      const ratio = dbRole[key] / guildModel.db[key];
      return Math.round(100 * ratio) / 100;
    };

    const keyToName: Record<keyof typeof dbRole, string> = {
      'xpPerTextMessage': 'text message',
      'xpPerVoiceMinute': 'voice minute',
      xpPerInvite: 'invite',
      xpPerVote: 'upvote'
    }

    const getMessage = (key: keyof typeof dbRole): string | null => {
      if (dbRole[key] > 0) {
        return `\`${dbRole[key]} xp\` per ${keyToName[key]} (**${relativeValue(key)}x** the default)`;
      } else {
        return null;
      }
    };

    await interaction.reply({
      embeds: [
        {
          author: { name: 'Role XP Values' },
          color: 0x00ae86,
          description: [
            `Modified XP Values for ${role}! New values:`,
            '',
            getMessage('xpPerTextMessage'),
            getMessage('xpPerVoiceMinute'),
            getMessage('xpPerVote'),
            getMessage('xpPerInvite'),
          ].filter(n => n !== null).join('\n'),
        },
      ],
      ephemeral: true,
    });
  },
});
