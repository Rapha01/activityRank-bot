import { getMemberModel } from 'bot/models/guild/guildMemberModel.js';
import { getGuildModel } from 'bot/models/guild/guildModel.js';
import { getUserModel } from 'bot/models/userModel.js';
import {
  ButtonStyle,
  ChatInputCommandInteraction,
  ComponentType,
  ContextMenuCommandInteraction,
  time,
  type GuildMember,
} from 'discord.js';
import { getRawVoteMultiplier, hasNoXpRole } from 'util/fct.js';
import { getWaitTime } from './cooldownUtil.js';
import statFlushCache from 'bot/statFlushCache.js';
import { PATREON_URL } from './constants.js';
import { assertUnreachable } from './typescript.js';
import { requireUser } from './predicates.js';
import { useConfirm } from './component.js';

/**
 * A cache of members in the format `guildId.userId` to the Date they can next upvote again.
 * TODO: This is a temporary fix because other measures (caches on the GuildMember object) should already be sufficient.
 */
const upvoteCache = new Map<string, Date>();

/**
 * The status of an attempt to upvote another member.
 */
export enum UpvoteAttempt {
  /** The target may be safely upvoted. */
  Allow,
  /** The guild has upvotes disabled globally. */
  DisabledGuild,
  /** Attempted to upvote a bot. */
  TargetBot,
  /** Attempted to upvote self. */
  TargetSelf,
  /** The target has a noXP role that prohibits adding XP. */
  TargetHasNoXP,
  /** The user has voted recently. */
  TimeoutNotElapsed,
}

type UpvoteAttemptResult =
  | { status: UpvoteAttempt.Allow }
  | {
      status:
        | UpvoteAttempt.DisabledGuild
        | UpvoteAttempt.TargetBot
        | UpvoteAttempt.TargetSelf
        | UpvoteAttempt.TargetHasNoXP;
    }
  | {
      status: UpvoteAttempt.TimeoutNotElapsed;
      nextUpvote: Date;
    };

/**
 * Check if an upvote is possible. Fails if `voter` is on cooldown.
 * @param voter The member attempting to upvote the `target`
 * @param target The member that is being upvoted
 * @returns Whether the upvote is possible
 */
export async function checkUpvote(
  voter: GuildMember,
  target: GuildMember,
): Promise<UpvoteAttemptResult> {
  if (voter.guild.id !== target.guild.id)
    throw new Error('Attempted to upvote members in different guilds');

  const cachedGuild = await getGuildModel(voter.guild);

  if (!cachedGuild.db.voteXp) return { status: UpvoteAttempt.DisabledGuild };
  if (target.user.bot) return { status: UpvoteAttempt.TargetBot };
  if (target.id == voter.id) return { status: UpvoteAttempt.TargetSelf };

  const cachedMember = await getMemberModel(voter);

  if (await hasNoXpRole(target)) return { status: UpvoteAttempt.TargetHasNoXP };

  // Check Command cooldown
  const toWait = getWaitTime(
    cachedMember.cache.lastVoteDate,
    cachedGuild.db.voteCooldownSeconds * 1000,
  );

  if (toWait.remaining > 0)
    return { status: UpvoteAttempt.TimeoutNotElapsed, nextUpvote: toWait.next };

  // TODO: [FIXME] - the upvoteCache check should not be necessary as toWait should already handle this
  const cachedNextVote = upvoteCache.get(`${voter.guild.id}.${voter.id}`);
  if (cachedNextVote && cachedNextVote.getTime() > Date.now()) {
    voter.client.logger.warn(
      { cachedMember, cachedGuild },
      'vote cache caught by fallback measure',
    );
    return { status: UpvoteAttempt.TimeoutNotElapsed, nextUpvote: cachedNextVote };
  }

  return { status: UpvoteAttempt.Allow };
}

export async function handleUpvoteAttempt(
  interaction: ChatInputCommandInteraction<'cached'> | ContextMenuCommandInteraction<'cached'>,
  targetMember: GuildMember,
  attempt: UpvoteAttemptResult,
) {
  const { status } = attempt;
  let errorResponse: string;

  if (status === UpvoteAttempt.DisabledGuild) {
    errorResponse = 'Voting is disabled on this server.';
  } else if (status === UpvoteAttempt.TargetBot) {
    errorResponse = 'You cannot upvote bots.';
  } else if (status === UpvoteAttempt.TargetSelf) {
    errorResponse = 'You cannot upvote yourself.';
  } else if (status === UpvoteAttempt.TargetHasNoXP) {
    errorResponse =
      'The member you are trying to upvote cannot be upvoted, because of an assigned noXp role.';
  } else if (status === UpvoteAttempt.TimeoutNotElapsed) {
    const next = time(attempt.nextUpvote, 'R');
    errorResponse = `You already voted recently. You will be able to vote again ${next}.`;
  } else if (status === UpvoteAttempt.Allow) {
    await confirmInviter(interaction, targetMember);
    return;
  } else {
    assertUnreachable(status);
  }

  await interaction.reply({ content: errorResponse, ephemeral: true });
}

async function confirmInviter(
  interaction: ChatInputCommandInteraction<'cached'> | ContextMenuCommandInteraction<'cached'>,
  targetMember: GuildMember,
) {
  await interaction.reply({
    content: `Are you sure that ${targetMember} was the person who invited you?\n-# **You cannot change this setting once you confirm it.**`,
    components: [
      {
        type: ComponentType.ActionRow,
        components: [
          {
            type: ComponentType.Button,
            customId: confirmButton.instanceId({
              data: { target: targetMember },
              predicate: requireUser(interaction.user),
            }),
            style: ButtonStyle.Primary,
            label: 'Confirm',
          },
          {
            type: ComponentType.Button,
            customId: denyButton.instanceId({ predicate: requireUser(interaction.user) }),
            style: ButtonStyle.Secondary,
            label: 'Cancel',
          },
        ],
      },
    ],
    allowedMentions: { users: [] },
  });
}

const { confirmButton, denyButton } = useConfirm<{ target: GuildMember }>({
  async confirmFn({ interaction, data, drop }) {
    await interaction.deferUpdate();

    // Get author multiplier
    const userModel = await getUserModel(interaction.user);
    const myUser = await userModel.fetch();
    const multiplier = getRawVoteMultiplier(
      parseInt(myUser.lastTopggUpvoteDate),
      parseInt(myUser.patreonTierUntilDate),
      myUser.patreonTier,
    );

    const cachedMember = await getMemberModel(interaction.member);
    const cachedGuild = await getGuildModel(interaction.guild);

    cachedMember.cache.lastVoteDate = new Date();

    await statFlushCache.addVote(data.target, multiplier);
    upvoteCache.set(
      `${interaction.guild.id}.${interaction.user.id}`,
      new Date(Date.now() + cachedGuild.db.voteCooldownSeconds * 1000),
    );

    if (multiplier > 1) {
      await interaction.editReply({
        content: `You have successfully voted for ${data.target}. Your vote counts \`${multiplier}x\`.`,
        components: [],
        allowedMentions: { users: [data.target.id] },
      });
    } else {
      await interaction.editReply({
        content: `You have successfully voted for ${data.target}. Upvote the bot on top.gg or subscribe [on Patreon](<${PATREON_URL}>) to increase your voting power!`,
        components: [],
        allowedMentions: { users: [data.target.id] },
      });
    }
    drop();
  },
  async denyFn({ interaction, drop }) {
    await interaction.deferUpdate();
    await interaction.deleteReply();
    drop();
  },
});
