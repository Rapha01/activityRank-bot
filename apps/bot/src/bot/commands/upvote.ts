import { attemptUpvote, getUpvoteMessage } from '#bot/util/upvote.js';
import { command } from '#bot/commands.js';
import { resolveMember } from '#bot/util/parser.js';

export default command({
  name: 'upvote',
  async execute({ interaction, options, t }) {
    const targetMember = await resolveMember(options.member, interaction);
    if (!targetMember) {
      await interaction.reply({ content: t('missing.notOnServer'), ephemeral: true });
      return;
    }

    const result = await attemptUpvote(interaction.member, targetMember);

    await interaction.reply(getUpvoteMessage(result, targetMember));
  },
});
