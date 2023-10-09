import { SlashCommandBuilder, time } from 'discord.js';
import { oneLine } from 'common-tags';
import guildMemberModel from '../models/guild/guildMemberModel.js';
import fct from '../../util/fct.js';
import { getWaitTime } from '../util/cooldownUtil.js';
import statFlushCache from '../statFlushCache.js';
import userModel from '../models/userModel.js';
import { registerSlashCommand } from 'bot/util/commandLoader.js';

registerSlashCommand({
  data: new SlashCommandBuilder()
    .setName('upvote')
    .setDescription('Upvote a member!')
    .addUserOption((o) =>
      o.setName('member').setDescription('The member to upvote').setRequired(true),
    ),
  async execute(interaction) {
    if (!interaction.guild.appData.voteXp)
      return await interaction.reply({
        content: 'Voting is disabled on this server.',
        ephemeral: true,
      });

    const targetMember = interaction.options.getMember('member');
    if (!targetMember)
      return await interaction.reply({
        content: 'This member is not in the server.',
        ephemeral: true,
      });

    await guildMemberModel.cache.load(interaction.member);
    await guildMemberModel.cache.load(targetMember);

    if (targetMember.user.bot)
      return await interaction.reply({
        content: 'You cannot upvote bots.',
        ephemeral: true,
      });

    if (targetMember.id == interaction.member.id)
      return await interaction.reply({
        content: 'You cannot upvote yourself.',
        ephemeral: true,
      });

    if (await fct.hasNoXpRole(targetMember)) {
      return await interaction.reply({
        content:
          'The member you are trying to upvote cannot be upvoted, because of an assigned noXp role.',
        ephemeral: true,
      });
    }

    // Get author multiplier
    await userModel.cache.load(interaction.user);
    const myUser = await userModel.storage.get(interaction.user);
    const value = fct.getVoteMultiplier(myUser);

    // Check Command cooldown
    const toWait = getWaitTime(
      interaction.member.appData.lastVoteDate,
      interaction.guild.appData.voteCooldownSeconds * 1000,
    );

    if (toWait.remaining > 0) {
      return await interaction.reply({
        content: `You already voted recently. You will be able to vote again ${time(
          toWait.next,
          'R',
        )}.`,
        ephemeral: true,
      });
    }

    interaction.member.appData.lastVoteDate = new Date();

    await statFlushCache.addVote(targetMember, value);

    if (value > 1) {
      await interaction.reply(
        `You have successfully voted for ${targetMember}. Your vote counts \`${value}x\`.`,
      );
    } else {
      await interaction.reply(oneLine`You have successfully voted for ${targetMember}. 
      Upvote the bot on top.gg or subscribe [on Patreon](https://www.patreon.com/rapha01) to increase your voting power!`);
    }
  },
});
