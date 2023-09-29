export interface bonus {
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

export interface guild {
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
  notifyevelupDm: number;
  notifyevelupCurrentChannel: number;
  notifyevelupWithRole: number;
  notifyevelupOnlyWithRole: number;
  takeAwayAssignedRolesOnevelDown: number;
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
  bonusUntilDate: string; // BIGINT;
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

export interface guildChannel {
  guildId: string; // BIGINT;
  channelId: string; // BIGINT;
  noXp: number;
  noCommand: number;
}

export interface guildMember {
  guildId: string; // BIGINT;
  userId: string; // BIGINT;
  notifyevelupDm: number;
  tokensBurned: number;
  reactionVote: number;
  inviter: string; // BIGINT;
}

export interface guildRole {
  guildId: string; // BIGINT;
  roleId: string; // BIGINT;
  assignevel: number;
  deassignevel: number;
  assignMessage: string;
  deassignMessage: string;
  noXp: number;
}

export interface invite {
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

export interface textMessage {
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

export interface user {
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

export interface voiceMinute {
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

export interface vote {
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
