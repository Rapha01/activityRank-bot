import { EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import { stripIndent } from 'common-tags';
import guildModel from '../../models/guild/guildModel.js';
import { registerSubCommand } from 'bot/util/commandLoader.js';

registerSubCommand({
  async execute(interaction) {
    // TODO (old permissions) deprecate
    if (
      !interaction.member.permissionsIn(interaction.channel!).has(PermissionFlagsBits.ManageGuild)
    ) {
      return await interaction.reply({
        content: 'You need the permission to manage the server in order to use this command.',
        ephemeral: true,
      });
    }

    const items = {
      bonusPerTextMessage: interaction.options.getInteger('message'),
      bonusPerVoiceMinute: interaction.options.getInteger('voiceminute'),
      bonusPerVote: interaction.options.getInteger('vote'),
      bonusPerInvite: interaction.options.getInteger('invite'),
    };
    if (Object.values(items).every((x) => x === null)) {
      return await interaction.reply({
        content: 'You must specify at least one option for this command to do anything!',
        ephemeral: true,
      });
    }

    for (const _k in items) {
      const k = _k as keyof typeof items;
      const value = items[k];
      if (value !== null) await guildModel.storage.set(interaction.guild, k, value);
    }

    const cachedGuild = await guildModel.cache.get(interaction.guild);

    await interaction.reply({
      embeds: [
        new EmbedBuilder().setAuthor({ name: 'Bonus XP Values' }).setColor(0x00ae86)
          .setDescription(stripIndent`
        Modified Bonus XP Values! New values:
  
        \`${cachedGuild.db.bonusPerTextMessage} xp\` per text message
        \`${cachedGuild.db.bonusPerVoiceMinute} xp\` per minute in VC
        \`${cachedGuild.db.bonusPerVote} xp\` per vote
        \`${cachedGuild.db.bonusPerInvite} xp\` per invite
        `),
      ],
      ephemeral: true,
    });
  },
});
