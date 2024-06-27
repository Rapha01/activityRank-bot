import { ContextMenuCommandBuilder } from '@discordjs/builders';
import { ApplicationCommandType } from 'discord.js';
import { registerContextMenu } from 'bot/util/commandLoader.js';
import { attemptUpvote, getUpvoteMessage } from 'bot/util/upvote.js';

registerContextMenu({
  data: new ContextMenuCommandBuilder().setName('Upvote').setType(ApplicationCommandType.User),
  execute: async function (interaction) {
    const targetMember = await interaction.guild.members
      .fetch(interaction.targetId)
      .catch(() => null);

    if (!targetMember)
      return await interaction.reply({
        content: 'This member is not in the server.',
        ephemeral: true,
      });

    const result = await attemptUpvote(interaction.member, targetMember);

    await interaction.reply(getUpvoteMessage(result, targetMember));
  },
});
