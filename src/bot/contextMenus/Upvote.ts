import { ContextMenuCommandBuilder } from '@discordjs/builders';
import { oneLine } from 'common-tags';
import statFlushCache from '../statFlushCache.js';
import guildMemberModel from '../models/guild/guildMemberModel.js';
import userModel from '../models/userModel.js';
import fct from '../../util/fct.js';
import cooldownUtil from '../util/cooldownUtil.js';
import { registerContextMenu } from 'bot/util/commandLoader.js';
import { ApplicationCommandType } from 'discord.js';

registerContextMenu({
  data: new ContextMenuCommandBuilder().setName('Upvote').setType(ApplicationCommandType.User),
  execute: async function (interaction) {
    if (!interaction.guild.appData.voteXp)
      return await interaction.reply({
        content: 'Voting is disabled on this server.',
        ephemeral: true,
      });

    const targetMember = await interaction.guild.members.fetch(interaction.targetId);

    if (!targetMember)
      return await interaction.reply({
        content: 'Could not find member.',
        ephemeral: true,
      });

    await guildMemberModel.cache.load(interaction.member);
    await guildMemberModel.cache.load(targetMember);

    if (targetMember.user.bot)
      return await interaction.reply({
        content: 'You cannot upvote bots.',
        ephemeral: true,
      });

    if (interaction.targetId == interaction.member.id)
      return await interaction.reply({
        content: 'You cannot upvote yourself.',
        ephemeral: true,
      });

    if (await fct.hasNoXpRole(targetMember)) {
      return await interaction.reply({
        content:
          'The member you are trying to upvote cannot be upvoted, because of an assigned noxp role.',
        ephemeral: true,
      });
    }

    // Get author multiplier
    await userModel.cache.load(interaction.user);
    const myUser = await userModel.storage.get(interaction.user);
    const value = fct.getVoteMultiplier(myUser);

    // Check Command cooldown
    const toWait = cooldownUtil.getCachedCooldown(
      interaction.member.appData,
      'lastVoteDate',
      interaction.guild.appData.voteCooldownSeconds,
    );

    if (toWait > 0) {
      return await interaction.reply({
        content: `You already voted recently. You will be able to vote again <t:${Math.ceil(
          toWait + Date.now() / 1000,
        )}:R>.`,
        ephemeral: true,
      });
    }

    interaction.member.appData.lastVoteDate = Date.now() / 1000;

    await statFlushCache.addVote(targetMember, value);

    if (value > 1) {
      await interaction.reply(
        `You have successfully voted for ${targetMember}. Your vote counts \`${value}x\`.`,
      );
    } else {
      await interaction.reply(oneLine`You have successfully voted for ${targetMember}. 
        Upvote the bot on top.gg or subscribe on https://www.patreon.com/rapha01 to increase your voting power!`);
    }
  },
});
