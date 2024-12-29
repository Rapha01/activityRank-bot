import { ApplicationCommandOptionType, ButtonStyle, ComponentType, type Role } from 'discord.js';
import { subcommand } from '#bot/util/registry/command.js';
import { getGuildModel } from '#bot/models/guild/guildModel.js';
import { getRoleModel } from '#bot/models/guild/guildRoleModel.js';
import { actionrow, closeButton } from '#bot/util/component.js';
import { requireUser } from '#bot/util/predicates.js';
import { component } from '#bot/util/registry/component.js';
import { getShardDb } from '#models/shardDb/shardDb.js';

const xpPerOption = (name: string, object: string, min: number, max: number) =>
  ({
    name,
    description: `The amount of XP gained per ${object}`,
    min_value: min,
    max_value: max,
    type: ApplicationCommandOptionType.Integer,
  }) as const;

type XpPerEntry = 'xpPerTextMessage' | 'xpPerVoiceMinute' | 'xpPerVote' | 'xpPerInvite';

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
      const predicate = requireUser(interaction.user);
      await interaction.reply({
        content: `Are you sure you want to reset the special XP settings of ${role}?`,
        ephemeral: true,
        components: [
          actionrow([
            {
              type: ComponentType.Button,
              style: ButtonStyle.Primary,
              label: 'Reset',
              customId: resetSettings.instanceId({ predicate, data: { role } }),
            },
            {
              type: ComponentType.Button,
              style: ButtonStyle.Danger,
              label: 'Close',
              customId: closeButton.instanceId({ predicate }),
            },
          ]),
        ],
      });
      return;
    }

    const guildModel = await getGuildModel(role.guild);
    const roleModel = await getRoleModel(role);

    const existingXpPerRoles = await getShardDb(guildModel.dbHost)
      .selectFrom('guildRole')
      .select((eb) => eb.fn.countAll<string>().as('count'))
      .where('guildId', '=', role.guild.id)
      .where((w) =>
        w.or([
          w('xpPerTextMessage', '!=', 0),
          w('xpPerVoiceMinute', '!=', 0),
          w('xpPerInvite', '!=', 0),
          w('xpPerVote', '!=', 0),
        ]),
      )
      .executeTakeFirstOrThrow();

    if (Number.parseInt(existingXpPerRoles.count) >= 5) {
      await interaction.reply({
        content:
          'There is a maximum of 5 roles that can be set as xp-per roles. Please remove some first.',
        ephemeral: true,
      });
      return;
    }

    await roleModel.upsert(items);

    const relativeValue = (key: XpPerEntry): number => {
      const ratio = roleModel.db[key] / guildModel.db[key];
      return Math.round(100 * ratio) / 100;
    };

    const keyToName: Record<XpPerEntry, string> = {
      xpPerTextMessage: 'text message',
      xpPerVoiceMinute: 'voice minute',
      xpPerInvite: 'invite',
      xpPerVote: 'upvote',
    };

    const getMessage = (key: XpPerEntry): string | null => {
      if (roleModel.db[key] > 0) {
        return `\`${roleModel.db[key]} xp\` per ${keyToName[key]} (**${relativeValue(key)}x** the default)`;
      }
      return null;
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
          ]
            .filter((n) => n !== null)
            .join('\n'),
        },
      ],
      ephemeral: true,
    });
  },
});

const resetSettings = component<{ role: Role }>({
  type: ComponentType.Button,
  async callback({ interaction, data }) {
    await interaction.deferUpdate();

    const roleModel = await getRoleModel(data.role);
    await roleModel.upsert({
      xpPerTextMessage: 0,
      xpPerVoiceMinute: 0,
      xpPerInvite: 0,
      xpPerVote: 0,
    });

    await interaction.followUp({
      content: `Users' XP will no longer be affected by ${data.role}!`,
    });
  },
});
