import { context } from 'bot/util/registry/command.js';
import { checkUpvote, handleUpvoteAttempt } from 'bot/util/upvote.js';

export default context.user({
  data: {
    name: 'Upvote',
    dm_permission: false,
  },
  async execute({ interaction }) {
    if (!interaction.inCachedGuild()) throw new Error('Upvote context menu not in cached guild');
    const targetMember = await interaction.guild.members
      .fetch(interaction.targetId)
      .catch(() => null);

    if (!targetMember) {
      await interaction.reply({
        content: 'This member is not in the server.',
        ephemeral: true,
      });
      return;
    }

    const result = await checkUpvote(interaction.member, targetMember);

    await handleUpvoteAttempt(interaction, targetMember, result);
  },
});
