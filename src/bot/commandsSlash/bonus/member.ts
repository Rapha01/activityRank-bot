import { PermissionFlagsBits } from 'discord.js';
import statFlushCache from '../../statFlushCache.js';
import { registerSubCommand } from 'bot/util/commandLoader.js';

registerSubCommand({
  name: 'member',
  execute: async (interaction) => {
    const member = interaction.options.getMember('member')!;

    if (member.user.bot) {
      return await interaction.reply({
        content: 'You cannot add bonus XP to bots.',
        ephemeral: true,
      });
    }

    if (
      !interaction.channel ||
      !interaction.member.permissionsIn(interaction.channel).has(PermissionFlagsBits.ManageGuild)
    ) {
      return await interaction.reply({
        content: 'You need the permission to manage the server in order to use this command.',
        ephemeral: true,
      });
    }

    const change = interaction.options.getInteger('change', true);

    await statFlushCache.addBonus(member, change);
    await interaction.reply({
      content: `Successfully gave \`${change}\` bonus XP to ${member}!`,
      allowedMentions: { parse: [] },
    });
  },
});
