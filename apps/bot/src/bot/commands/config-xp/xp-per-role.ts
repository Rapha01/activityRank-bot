import { ApplicationCommandOptionType, ButtonStyle, ComponentType, type Role } from 'discord.js';
import { command } from '#bot/commands.js';
import { getGuildModel } from '#bot/models/guild/guildModel.js';
import { getRoleModel } from '#bot/models/guild/guildRoleModel.js';
import { actionrow, closeButton } from '#bot/util/component.js';
import { requireUser } from '#bot/util/predicates.js';
import { component } from '#bot/util/registry/component.js';
import { shards } from '#models/shardDb/shardDb.js';
import fct from '#util/fct.js';

type XpPerEntry = 'xpPerTextMessage' | 'xpPerVoiceMinute' | 'xpPerVote' | 'xpPerInvite';

export default command({
  name: 'config-xp xp-per-role',
  async execute({ interaction, options }) {
    const role = options.role;

    if (role.id === interaction.guild.id) {
      await interaction.reply({
        content: 'You cannot configure the xp-per @everyone. Try `/config-xp xp-per` instead.',
        ephemeral: true,
        allowedMentions: { parse: [] },
      });
      return;
    }

    const items = {
      xpPerTextMessage: options.message,
      xpPerVoiceMinute: options.voiceminute,
      xpPerVote: options.vote,
      xpPerInvite: options.invite,
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

    const existingXpPerRoles = await shards
      .get(guildModel.dbHost)
      .db.selectFrom('guildRole')
      .select('roleId')
      .where('guildId', '=', role.guild.id)
      .where((w) =>
        w.or([
          w('xpPerTextMessage', '!=', 0),
          w('xpPerVoiceMinute', '!=', 0),
          w('xpPerInvite', '!=', 0),
          w('xpPerVote', '!=', 0),
        ]),
      )
      .execute();

    const patreonTiers = await fct.getPatreonTiers(interaction);
    const increasedLimit = patreonTiers.ownerTier === 2;
    const maxRoles = increasedLimit ? 15 : 5;

    if (
      existingXpPerRoles.length >= maxRoles &&
      !existingXpPerRoles.map(({ roleId }) => roleId).includes(role.id)
    ) {
      await interaction.reply({
        content: [
          `There is a maximum of ${maxRoles} roles that can be set as xp-per roles. Please remove some first.`,
          increasedLimit
            ? '\n*Get an extra 10 xp-per roles by subscribing to Patreon Tier 2!*'
            : '',
        ].join('\n'),
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
