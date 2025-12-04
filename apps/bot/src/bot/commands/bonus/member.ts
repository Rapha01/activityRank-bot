import { command } from '#bot/commands.ts';
import { resolveMember } from '#bot/util/parser.ts';
import statFlushCache from '../../statFlushCache.ts';

export default command({
  name: 'bonus member',
  async execute({ interaction, options, t }) {
    const member = await resolveMember(options.member, interaction);

    if (!member) {
      await interaction.reply({ content: t('missing.notOnServer'), ephemeral: true });
      return;
    }

    if (member.user.bot) {
      await interaction.reply({ content: t('bonus.cannotAddXP'), ephemeral: true });
      return;
    }

    await statFlushCache.addBonus(member, options.change);
    await interaction.reply({
      content: t(options.change >= 0 ? 'bonus.successPositive' : 'bonus.successNegative', {
        change: Math.abs(options.change),
        member: member.toString(),
      }),
      allowedMentions: { parse: [] },
    });
  },
});
