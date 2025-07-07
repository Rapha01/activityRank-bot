import { ButtonStyle, ComponentType, type Role } from 'discord.js';
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
  async execute({ interaction, options, t }) {
    const role = options.role;

    if (role.id === interaction.guild.id) {
      await interaction.reply({
        content: t('config-xp.cannotEveryone'),
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
        content: t('config-xp.resetXPper', { role: role.toString() }),
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
          t('config-xp.maxRoles', { maxRoles }),
          increasedLimit ? `\n*${t('config-xp.extraMaxRoles')}*` : '',
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
      xpPerTextMessage: t('config-xp.textmessage'),
      xpPerVoiceMinute: t('config-xp.voiceminute'),
      xpPerInvite: t('config-xp.invite'),
      xpPerVote: t('config-xp.upvote'),
    };

    const getMessage = (key: XpPerEntry): string | null => {
      if (roleModel.db[key] > 0) {
        return t('config-xp.newValue', {
          xp: roleModel.db[key],
          per: keyToName[key],
          multi: relativeValue(key),
        });
      }
      return null;
    };

    await interaction.reply({
      embeds: [
        {
          author: { name: 'Role XP Values' },
          color: 0x01c3d9,
          description: [
            t('config-xp.modified', { role: role.toString() }),
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
  async callback({ interaction, data, t }) {
    await interaction.deferUpdate();

    const roleModel = await getRoleModel(data.role);
    await roleModel.upsert({
      xpPerTextMessage: 0,
      xpPerVoiceMinute: 0,
      xpPerInvite: 0,
      xpPerVote: 0,
    });

    await interaction.followUp({
      content: t('config-xp.notAffected', { role: data.role.toString() }),
    });
  },
});
