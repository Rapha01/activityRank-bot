import { registerEvent } from 'bot/util/eventLoader.js';
import { Events } from 'discord.js';
import guildMemberModel from '../models/guild/guildMemberModel.js';
import { getGuildModel } from '../models/guild/guildModel.js';
import { getUserModel } from '../models/userModel.js';
import guildRoleModel from '../models/guild/guildRoleModel.js';
import { get as getEmoji } from 'node-emoji';
import { getWaitTime } from '../util/cooldownUtil.js';
import statFlushCache from '../statFlushCache.js';
import skip from '../skip.js';
import fct from '../../util/fct.js';

registerEvent(Events.MessageReactionAdd, async function (reaction) {
  if (!reaction.message.guild) return;
  const guild = reaction.message.guild;

  if (skip(reaction.message.guild.id)) return;
  if (reaction.message.author?.bot) return;

  const cachedGuild = await getGuildModel(guild);

  if (!cachedGuild.db.voteXp || !cachedGuild.db.reactionVote) return;

  if (!reaction.emoji.id) {
    if (
      reaction.emoji.name != getEmoji(cachedGuild.db.voteEmote) &&
      reaction.emoji.name != cachedGuild.db.voteEmote
    )
      return;
  } else {
    if (`<:${reaction.emoji.name}:${reaction.emoji.id}>` != cachedGuild.db.voteEmote) return;
  }

  let targetMember = await guild.members.fetch(reaction.message.author!.id);
  let member = await guild.members.fetch(reaction.users.cache.last()!.id);

  if (!targetMember || !member || member.user.bot || targetMember.id == member.id) return;

  const cachedMember = await guildMemberModel.cache.get(member);

  if (!cachedMember.db.reactionVote) return;

  for (const role of targetMember.roles.cache.values()) {
    const cachedRole = await guildRoleModel.cache.get(role);
    if (cachedRole.db.noXp) return;
  }

  // Get author multiplier
  const userModel = await getUserModel(member.user);
  const myUser = await userModel.fetch();
  const value = fct.getVoteMultiplier(myUser);

  const toWait = getWaitTime(
    cachedMember.cache.lastVoteDate,
    cachedGuild.db.voteCooldownSeconds * 1000,
  );

  if (toWait.remaining > 0) return;

  cachedMember.cache.lastVoteDate = new Date();

  await statFlushCache.addVote(targetMember, value);
});
