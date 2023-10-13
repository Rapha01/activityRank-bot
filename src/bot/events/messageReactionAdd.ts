import guildMemberModel from '../models/guild/guildMemberModel.js';
import guildModel from '../models/guild/guildModel.js';
import userModel from '../models/userModel.js';
import guildRoleModel from '../models/guild/guildRoleModel.js';
import { get as getEmoji } from 'node-emoji';
import cooldownUtil from '../util/cooldownUtil.js';
import statFlushCache from '../statFlushCache.js';
import skip from '../skip.js';
import fct, { getRawVoteMultiplier } from '../../util/fct.js';
import type { MessageReaction } from 'discord.js';

export default {
  name: 'messageReactionAdd',
  async execute(reaction: MessageReaction) {
    if (!reaction.message.guild) return;
    const guild = reaction.message.guild;

    if (skip(reaction.message.guild.id)) return;
    if (reaction.message.author?.bot) return;

    await guildModel.cache.load(guild);

    if (!guild.appData.voteXp || !guild.appData.reactionVote) return;

    if (!reaction.emoji.id) {
      if (
        reaction.emoji.name != getEmoji(guild.appData.voteEmote) &&
        reaction.emoji.name != guild.appData.voteEmote
      )
        return;
    } else {
      if (`<:${reaction.emoji.name}:${reaction.emoji.id}>` != guild.appData.voteEmote) return;
    }

    let targetMember = await guild.members.fetch(reaction.message.author!.id);
    let member = await guild.members.fetch(reaction.users.cache.last()!.id);

    if (!targetMember || !member || member.user.bot || targetMember.id == member.id) return;

    await guildMemberModel.cache.load(targetMember);
    await guildMemberModel.cache.load(member);

    if (!member.appData.reactionVote) return;

    for (const _role of targetMember.roles.cache) {
      const role = _role[1];
      await guildRoleModel.cache.load(role);

      if (role.appData.noXp) return;
    }

    // Get author multiplier
    await userModel.cache.load(member.user);
    const myUser = await userModel.storage.get(member.user);
    const value = fct.getVoteMultiplier(myUser);

    const toWait = cooldownUtil.getCachedCooldown(
      member.appData,
      'lastVoteDate',
      guild.appData.voteCooldownSeconds,
    );
    if (toWait > 0) return;

    member.appData.lastVoteDate = new Date();

    await statFlushCache.addVote(targetMember, value);
  },
};
