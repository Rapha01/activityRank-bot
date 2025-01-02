import { attemptUpvote, getUpvoteMessage } from '#bot/util/upvote.js';
import { command } from '#bot/util/registry/command.js';
import { ApplicationCommandOptionType } from 'discord.js';

export default command.basic({
  data: {
    name: 'upvote',
    description: 'Upvote a member.',
    options: [
      {
        name: 'member',
        description: 'The member to upvote.',
        required: true,
        type: ApplicationCommandOptionType.User,
      },
    ],
  },
  async execute({ interaction }) {
    const targetMember = interaction.options.getMember('member');
    if (!targetMember) {
      await interaction.reply({
        content: 'This member is not in the server.',
        ephemeral: true,
      });
      return;
    }

    const result = await attemptUpvote(interaction.member, targetMember);

    await interaction.reply(getUpvoteMessage(result, targetMember));
  },
});
