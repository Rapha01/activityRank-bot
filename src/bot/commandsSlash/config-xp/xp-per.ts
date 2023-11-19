import { EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import { stripIndent } from 'common-tags';
import guildModel from '../../models/guild/guildModel.js';
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
      xpPerTextMessage: interaction.options.getInteger('message'),
      xpPerVoiceMinute: interaction.options.getInteger('voiceminute'),
      xpPerVote: interaction.options.getInteger('vote'),
      xpPerInvite: interaction.options.getInteger('invite'),
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
      // TODO: refactor into a `storage.setObject` method??
      // Could be applied to many other files with a similar pattern
    }

    const cachedGuild = await guildModel.cache.get(interaction.guild);

    await interaction.reply({
      embeds: [
        new EmbedBuilder().setAuthor({ name: 'XP Values' }).setColor(0x00ae86)
          .setDescription(stripIndent`
        Modified XP Values! New values:
  
        \`${cachedGuild.db.xpPerTextMessage} xp\` per text message
        \`${cachedGuild.db.xpPerVoiceMinute} xp\` per minute in VC
        \`${cachedGuild.db.xpPerVote} xp\` per vote
        \`${cachedGuild.db.xpPerInvite} xp\` per invite
        `),
      ],
      ephemeral: true,
    });
  },
});
