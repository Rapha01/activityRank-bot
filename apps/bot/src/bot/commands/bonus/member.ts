import statFlushCache from '../../statFlushCache.js';
import { command } from '#bot/commands.js';
import { resolveMember } from '#bot/util/parser.js';

export default command({
  name: 'bonus member',
  async execute({ interaction, options }) {
    const member = await resolveMember(options.member, interaction);

    if (!member) {
      await interaction.reply({
        content: "This user isn't in the server.",
        ephemeral: true,
      });
      return;
    }

    if (member.user.bot) {
      await interaction.reply({
        content: 'You cannot add bonus XP to bots.',
        ephemeral: true,
      });
      return;
    }

    await statFlushCache.addBonus(member, options.change);
    await interaction.reply({
      content: `Successfully gave \`${options.change}\` bonus XP to ${member}!`,
      allowedMentions: { parse: [] },
    });
  },
});
