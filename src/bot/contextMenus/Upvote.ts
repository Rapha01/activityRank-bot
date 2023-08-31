import { ContextMenuCommandBuilder } from '@discordjs/builders';
import { oneLine } from 'common-tags';
import statFlushCache from '../statFlushCache.js';
import guildMemberModel from '../models/guild/guildMemberModel.js';
import userModel from '../models/userModel.js';
import fct from '../../util/fct.js';
import cooldownUtil from '../util/cooldownUtil.js';

export default {
  data: new ContextMenuCommandBuilder()
    .setName('Upvote')
    // User
    .setType(2),
  async execute(i) {
    if (!i.guild.appData.voteXp)
      return await i.reply({
        content: 'Voting is disabled on this server.',
        ephemeral: true,
      });

    const targetMember = await i.guild.members.fetch(i.targetId);

    if (!targetMember)
      return await i.reply({
        content: 'Could not find member.',
        ephemeral: true,
      });

    await guildMemberModel.cache.load(i.member);
    await guildMemberModel.cache.load(targetMember);

    if (targetMember.user.bot)
      return await i.reply({
        content: 'You cannot upvote bots.',
        ephemeral: true,
      });

    if (i.targetId == i.member.id)
      return await i.reply({
        content: 'You cannot upvote yourself.',
        ephemeral: true,
      });

    if (await fct.hasNoXpRole(targetMember)) {
      return await i.reply({
        content:
          'The member you are trying to upvote cannot be upvoted, because of an assigned noxp role.',
        ephemeral: true,
      });
    }

    // Get author multiplier
    await userModel.cache.load(i.user);
    const myUser = await userModel.storage.get(i.user);
    const value = fct.getVoteMultiplier(myUser);

    // Check Command cooldown
    const toWait = cooldownUtil.getCachedCooldown(
      i.member.appData,
      'lastVoteDate',
      i.guild.appData.voteCooldownSeconds,
    );

    if (toWait > 0) {
      return await i.reply({
        content: `You already voted recently. You will be able to vote again <t:${Math.ceil(
          toWait + Date.now() / 1000,
        )}:R>.`,
        ephemeral: true,
      });
    }

    i.member.appData.lastVoteDate = Date.now() / 1000;

    await statFlushCache.addVote(targetMember, value);

    if (value > 1) {
      await i.reply(
        `You have successfully voted for ${targetMember}. Your vote counts \`${value}x\`.`,
      );
    } else {
      await i.reply(oneLine`You have successfully voted for ${targetMember}. 
        Upvote the bot on top.gg or subscribe on https://www.patreon.com/rapha01 to increase your voting power!`);
    }
  },
};
