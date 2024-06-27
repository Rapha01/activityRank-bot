import { SlashCommandBuilder } from 'discord.js';
import { registerSlashCommand } from 'bot/util/commandLoader.js';
import { attemptUpvote, getUpvoteMessage } from 'bot/util/upvote.js';

registerSlashCommand({
  data: new SlashCommandBuilder()
    .setName('upvote')
    .setDescription('Upvote a member!')
    .addUserOption((o) =>
      o.setName('member').setDescription('The member to upvote').setRequired(true),
    ),
  async execute(interaction) {
    const targetMember = interaction.options.getMember('member');
    if (!targetMember)
      return await interaction.reply({
        content: 'This member is not in the server.',
        ephemeral: true,
      });

    const result = await attemptUpvote(interaction.member, targetMember);

    await interaction.reply(getUpvoteMessage(result, targetMember));
  },
});
