import type { Generated, Insertable, Selectable, Updateable } from 'kysely';

export interface BonusSchema {
  guildId: string;
  userId: string;
  alltime: Generated<number>;
  year: Generated<number>;
  month: Generated<number>;
  week: Generated<number>;
  day: Generated<number>;
  changeDate: Generated<number>;
  addDate: Generated<number>;
}
export type Bonus = Selectable<BonusSchema>;
export type NewBonus = Insertable<BonusSchema>;
export type BonusUpdate = Updateable<BonusSchema>;

export interface GuildSchema {
  guildId: string;
  prefix: Generated<string>;
  tokens: Generated<number>;
  tokensBurned: Generated<number>;
  voteTag: Generated<string>;
  voteEmote: Generated<string>;
  bonusTag: Generated<string>;
  bonusEmote: Generated<string>;
  entriesPerPage: Generated<number>;
  showNicknames: Generated<number>;
  textXp: Generated<number>;
  voiceXp: Generated<number>;
  inviteXp: Generated<number>;
  voteXp: Generated<number>;
  bonusXp: Generated<number>;
  notifyLevelupDm: Generated<number>;
  notifyLevelupCurrentChannel: Generated<number>;
  notifyLevelupWithRole: Generated<number>;
  notifyLevelupOnlyWithRole: Generated<number>;
  takeAwayAssignedRolesOnLevelDown: Generated<number>;
  levelFactor: Generated<number>;
  voteCooldownSeconds: Generated<number>;
  textMessageCooldownSeconds: Generated<number>;
  xpPerVoiceMinute: Generated<number>;
  xpPerTextMessage: Generated<number>;
  xpPerVote: Generated<number>;
  xpPerInvite: Generated<number>;
  xpPerBonus: Generated<number>;
  bonusPerTextMessage: Generated<number>;
  bonusPerVoiceMinute: Generated<number>;
  bonusPerVote: Generated<number>;
  bonusPerInvite: Generated<number>;
  bonusUntilDate: Generated<number>;
  reactionVote: Generated<number>;
  allowMutedXp: Generated<number>;
  allowDeafenedXp: Generated<number>;
  allowSoloXp: Generated<number>;
  allowInvisibleXp: Generated<number>;
  allowDownvotes: Generated<number>;
  commandOnlyChannel: Generated<string>;
  autopost_levelup: Generated<string>;
  autopost_serverJoin: Generated<string>;
  autopost_servereave: Generated<string>;
  autopost_voiceChannelJoin: Generated<string>;
  autopost_voiceChanneleave: Generated<string>;
  autoname_totalUserCount: Generated<string>;
  autoname_onlineUserCount: Generated<string>;
  autoname_activeUsersast24h: Generated<string>;
  autoname_serverJoinsast24h: Generated<string>;
  autoname_servereavesast24h: Generated<string>;
  levelupMessage: Generated<string>;
  serverJoinMessage: Generated<string>;
  servereaveMessage: Generated<string>;
  voiceChannelJoinMessage: Generated<string>;
  voiceChanneleaveMessage: Generated<string>;
  roleAssignMessage: Generated<string>;
  roleDeassignMessage: Generated<string>;
  lastCommandDate: Generated<number>;
  lastTokenBurnDate: Generated<number>;
  resetDay: Generated<number>;
  resetHour: Generated<number>;
  joinedAtDate: Generated<number>;
  leftAtDate: Generated<number>;
  addDate: Generated<number>;
  isBanned: Generated<number>;
}
export type Guild = Selectable<GuildSchema>;
export type NewGuild = Insertable<GuildSchema>;
export type GuildUpdate = Updateable<GuildSchema>;

export interface GuildChannelSchema {
  guildId: string;
  channelId: string;
  noXp: Generated<number>;
  noCommand: Generated<number>;
}
export type GuildChannel = Selectable<GuildChannelSchema>;
export type NewGuildChannel = Insertable<GuildChannelSchema>;
export type GuildChannelUpdate = Updateable<GuildChannelSchema>;

export interface GuildMemberSchema {
  guildId: string;
  userId: string;
  notifyLevelupDm: Generated<number>;
  tokensBurned: Generated<number>;
  reactionVote: Generated<number>;
  inviter: Generated<string>;
}
export type GuildMember = Selectable<GuildMemberSchema>;
export type NewGuildMember = Insertable<GuildMemberSchema>;
export type GuildMemberUpdate = Updateable<GuildMemberSchema>;

export interface GuildRoleSchema {
  guildId: string;
  roleId: string;
  assignLevel: Generated<number>;
  deassignLevel: Generated<number>;
  assignMessage: Generated<string>;
  deassignMessage: Generated<string>;
  noXp: Generated<number>;
}
export type GuildRole = Selectable<GuildRoleSchema>;
export type NewGuildRole = Insertable<GuildRoleSchema>;
export type GuildRoleUpdate = Updateable<GuildRoleSchema>;

export interface InviteSchema {
  guildId: string;
  userId: string;
  alltime: Generated<number>;
  year: Generated<number>;
  month: Generated<number>;
  week: Generated<number>;
  day: Generated<number>;
  changeDate: Generated<number>;
  addDate: Generated<number>;
}
export type Invite = Selectable<InviteSchema>;
export type NewInvite = Insertable<InviteSchema>;
export type InviteUpdate = Updateable<InviteSchema>;

export interface TextMessageSchema {
  guildId: string;
  userId: string;
  channelId: string;
  alltime: Generated<number>;
  year: Generated<number>;
  month: Generated<number>;
  week: Generated<number>;
  day: Generated<number>;
  changeDate: Generated<number>;
  addDate: Generated<number>;
}
export type TextMessage = Selectable<TextMessageSchema>;
export type NewTextMessage = Insertable<TextMessageSchema>;
export type TextMessageUpdate = Updateable<TextMessageSchema>;

export interface UserSchema {
  userId: string;
  tokens: Generated<number>;
  tokensBought: Generated<number>;
  tokensGifted: Generated<number>;
  voteMultiplier: Generated<number>;
  voteMultiplierUntil: Generated<number>;
  lastAskForPremiumDate: Generated<number>;
  addDate: Generated<number>;
  isBanned: Generated<number>;
  patreonTier: Generated<number>;
  patreonTierUntilDate: Generated<number>;
  lastTopggUpvoteDate: Generated<number>;
}
export type User = Selectable<UserSchema>;
export type NewUser = Insertable<UserSchema>;
export type UserUpdate = Updateable<UserSchema>;

export interface VoiceMinuteSchema {
  guildId: string;
  userId: string;
  channelId: string;
  alltime: Generated<number>;
  year: Generated<number>;
  month: Generated<number>;
  week: Generated<number>;
  day: Generated<number>;
  changeDate: Generated<number>;
  addDate: Generated<number>;
}
export type VoiceMinute = Selectable<VoiceMinuteSchema>;
export type NewVoiceMinute = Insertable<VoiceMinuteSchema>;
export type VoiceMinuteUpdate = Updateable<VoiceMinuteSchema>;

export interface VoteSchema {
  guildId: string;
  userId: string;
  alltime: Generated<number>;
  year: Generated<number>;
  month: Generated<number>;
  week: Generated<number>;
  day: Generated<number>;
  changeDate: Generated<number>;
  addDate: Generated<number>;
}
export type Vote = Selectable<VoteSchema>;
export type NewVote = Insertable<VoteSchema>;
export type VoteUpdate = Updateable<VoteSchema>;

export interface ShardDB {
  bonus: BonusSchema;
  guild: GuildSchema;
  guildChannel: GuildChannelSchema;
  guildMember: GuildMemberSchema;
  guildRole: GuildRoleSchema;
  invite: InviteSchema;
  textMessage: TextMessageSchema;
  user: UserSchema;
  voiceMinute: VoiceMinuteSchema;
  vote: VoteSchema;
}
