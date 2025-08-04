import { Events } from 'discord.js';
import { getRoleModel } from '#bot/models/guild/guildRoleModel.js';
import { getEmoji, getNativeEmoji } from '#bot/util/emoji.js';
import { event } from '#bot/util/registry/event.js';
import { getVoteMultiplier } from '../../util/fct.js';
import { getMemberModel } from '../models/guild/guildMemberModel.js';
import { getGuildModel } from '../models/guild/guildModel.js';
import { getUserModel } from '../models/userModel.js';
import skip from '../skip.js';
import statFlushCache from '../statFlushCache.js';
import { getWaitTime } from '../util/cooldownUtil.js';

export default event(Events.MessageReactionAdd, async (partialReaction, user) => {
  const reaction = partialReaction.partial ? await partialReaction.fetch() : partialReaction;
  if (!reaction.message.guild || !reaction.message.author) return;
  const guild = reaction.message.guild;

  if (skip()) return;
  if (reaction.message.author?.bot) return;

  const cachedGuild = await getGuildModel(guild);

  if (!cachedGuild.db.voteXp || !cachedGuild.db.reactionVote) return;

  const voteEmote = getEmoji(cachedGuild.db.voteEmote);

  if (!voteEmote) {
    reaction.client.logger.warn(
      { emoji: reaction.emoji },
      `Failed to parse voteEmoji for guild ${reaction.message.guildId}`,
    );
    return;
  }

  if (reaction.emoji.id) {
    // custom emoji
    if (!voteEmote.custom || reaction.emoji.id !== voteEmote.id) return;
  } else {
    // unicode emoji
    if (!reaction.emoji.name) return;
    const parsedEmoji = getNativeEmoji(reaction.emoji.name);
    if (voteEmote.custom || parsedEmoji?.emoji !== voteEmote.emoji) return;
  }

  const targetMember = await guild.members.fetch(reaction.message.author.id);
  const member = await guild.members.fetch(user.id);

  if (!targetMember || !member || member.user.bot || targetMember.id === member.id) return;

  const cachedMember = await getMemberModel(member);

  if (!cachedMember.db.reactionVote) return;

  // TODO: fetch/cache in bulk
  for (const role of targetMember.roles.cache.values()) {
    const cachedRole = await getRoleModel(role);
    if (cachedRole.db.noXp) return;
  }

  // Get author multiplier
  const userModel = await getUserModel(member.user);
  const value = getVoteMultiplier(await userModel.fetch());

  const toWait = getWaitTime(
    cachedMember.cache.lastVoteDate,
    cachedGuild.db.voteCooldownSeconds * 1000,
  );

  if (toWait.remaining > 0) return;

  cachedMember.cache.lastVoteDate = new Date();

  await statFlushCache.addVote(targetMember, value);
});
