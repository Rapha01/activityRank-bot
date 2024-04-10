// ! DEPRECATED file. Prefer `models/types/kysely/shard.ts`.

/** @deprecated use `kysely` types instead. */
export interface BonusSchema {
  guildId: string; // BIGINT;
  userId: string; // BIGINT;
  alltime: number;
  year: number;
  month: number;
  week: number;
  day: number;
  changeDate: number; // BIGINT;
  addDate: number; // BIGINT;
}

/** @deprecated use `kysely` types instead. */
export interface GuildSchema {
  guildId: string; // BIGINT;
  prefix: string;
  tokens: number;
  tokensBurned: number;
  voteTag: string;
  voteEmote: string;
  bonusTag: string;
  bonusEmote: string;
  entriesPerPage: number;
  showNicknames: number;
  textXp: number;
  voiceXp: number;
  inviteXp: number;
  voteXp: number;
  bonusXp: number;
  notifyLevelupDm: number;
  notifyLevelupCurrentChannel: number;
  notifyLevelupWithRole: number;
  notifyLevelupOnlyWithRole: number;
  takeAwayAssignedRolesOnLevelDown: number;
  levelFactor: number;
  voteCooldownSeconds: number;
  textMessageCooldownSeconds: number;
  xpPerVoiceMinute: number;
  xpPerTextMessage: number;
  xpPerVote: number;
  xpPerInvite: number;
  xpPerBonus: number;
  bonusPerTextMessage: number;
  bonusPerVoiceMinute: number;
  bonusPerVote: number;
  bonusPerInvite: number;
  bonusUntilDate: number; // BIGINT;
  reactionVote: number;
  allowMutedXp: number;
  allowDeafenedXp: number;
  allowSoloXp: number;
  allowInvisibleXp: number;
  allowDownvotes: number;
  commandOnlyChannel: string; // BIGINT;
  autopost_levelup: string; // BIGINT;
  autopost_serverJoin: string; // BIGINT;
  autopost_servereave: string; // BIGINT;
  autopost_voiceChannelJoin: string; // BIGINT;
  autopost_voiceChanneleave: string; // BIGINT;
  autoname_totalUserCount: string; // BIGINT;
  autoname_onlineUserCount: string; // BIGINT;
  autoname_activeUsersast24h: string; // BIGINT;
  autoname_serverJoinsast24h: string; // BIGINT;
  autoname_servereavesast24h: string; // BIGINT;
  levelupMessage: string;
  serverJoinMessage: string;
  servereaveMessage: string;
  voiceChannelJoinMessage: string;
  voiceChanneleaveMessage: string;
  roleAssignMessage: string;
  roleDeassignMessage: string;
  lastCommandDate: number; // BIGINT;
  lastTokenBurnDate: number; // BIGINT;
  resetDay: number;
  resetHour: number;
  joinedAtDate: number; // BIGINT;
  leftAtDate: number; // BIGINT;
  addDate: number; // BIGINT;
  isBanned: number;
}

/** @deprecated use `kysely` types instead. */
export interface GuildChannelSchema {
  guildId: string; // BIGINT;
  channelId: string; // BIGINT;
  noXp: number;
  noCommand: number;
}

/** @deprecated use `kysely` types instead. */
export interface GuildMemberSchema {
  guildId: string; // BIGINT;
  userId: string; // BIGINT;
  notifyLevelupDm: number;
  tokensBurned: number;
  reactionVote: number;
  inviter: string; // BIGINT;
}

/** @deprecated use `kysely` types instead. */
export interface GuildRoleSchema {
  guildId: string; // BIGINT;
  roleId: string; // BIGINT;
  assignLevel: number;
  deassignLevel: number;
  assignMessage: string;
  deassignMessage: string;
  noXp: number;
}

/** @deprecated use `kysely` types instead. */
export interface InviteSchema {
  guildId: string; // BIGINT;
  userId: string; // BIGINT;
  alltime: number;
  year: number;
  month: number;
  week: number;
  day: number;
  changeDate: number; // BIGINT;
  addDate: number; // BIGINT;
}

/** @deprecated use `kysely` types instead. */
export interface TextMessageSchema {
  guildId: string; // BIGINT;
  userId: string; // BIGINT;
  channelId: string; // BIGINT;
  alltime: number;
  year: number;
  month: number;
  week: number;
  day: number;
  changeDate: number; // BIGINT;
  addDate: number; // BIGINT;
}

/** @deprecated use `kysely` types instead. */
export interface UserSchema {
  userId: string; // BIGINT;
  tokens: number;
  tokensBought: number;
  tokensGifted: number;
  voteMultiplier: number;
  voteMultiplierUntil: number; // BIGINT;
  lastAskForPremiumDate: number; // BIGINT;
  addDate: number; // BIGINT;
  isBanned: number;
  patreonTier: number;
  patreonTierUntilDate: number; // BIGINT;
  lastTopggUpvoteDate: number; // BIGINT;
}

/** @deprecated use `kysely` types instead. */
export interface VoiceMinuteSchema {
  guildId: string; // BIGINT;
  userId: string; // BIGINT;
  channelId: string; // BIGINT;
  alltime: number;
  year: number;
  month: number;
  week: number;
  day: number;
  changeDate: number; // BIGINT;
  addDate: number; // BIGINT;
}

/** @deprecated use `kysely` types instead. */
export interface VoteSchema {
  guildId: string; // BIGINT;
  userId: string; // BIGINT;
  alltime: number;
  year: number;
  month: number;
  week: number;
  day: number;
  changeDate: number; // BIGINT;
  addDate: number; // BIGINT;
}
