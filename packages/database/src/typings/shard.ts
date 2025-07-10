import type { Generated, Insertable, Selectable, Updateable } from 'kysely';

export interface BonusSchema {
  guildId: string;
  userId: string;
  alltime: Generated<number>;
  year: Generated<number>;
  month: Generated<number>;
  week: Generated<number>;
  day: Generated<number>;
  changeDate: Generated<string>;
  addDate: Generated<string>;
}

export interface GuildSchema {
  guildId: string;
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
  bonusUntilDate: Generated<string>; // bigint
  reactionVote: Generated<number>;
  allowMutedXp: Generated<number>;
  allowDeafenedXp: Generated<number>;
  allowSoloXp: Generated<number>;
  /** @deprecated */
  allowInvisibleXp: Generated<number>;
  /** @deprecated */
  commandOnlyChannel: Generated<string>;
  autopost_levelup: Generated<string>;
  autopost_serverJoin: Generated<string>;
  levelupMessage: Generated<string>;
  serverJoinMessage: Generated<string>;
  roleAssignMessage: Generated<string>;
  roleDeassignMessage: Generated<string>;
  lastCommandDate: Generated<string>; // bigint
  lastTokenBurnDate: Generated<string>; // bigint
  resetDay: Generated<number>;
  resetHour: Generated<number>;
  joinedAtDate: Generated<string>; // bigint
  leftAtDate: Generated<string>; // bigint
  addDate: Generated<string>;
  isBanned: Generated<number>;
  resetDeletedMembers: Generated<number>;
  stickyLevelRoles: Generated<number>;
  apiToken: string | null;
}

export interface GuildChannelSchema {
  guildId: string;
  channelId: string;
  noXp: Generated<number>;
  noCommand: Generated<number>;
}

export interface GuildMemberSchema {
  guildId: string;
  userId: string;
  notifyLevelupDm: Generated<number>;
  /** @deprecated */
  tokensBurned: Generated<number>;
  reactionVote: Generated<number>;
  inviter: Generated<string>;
  alltime: Generated<number>;
  year: Generated<number>;
  month: Generated<number>;
  week: Generated<number>;
  day: Generated<number>;
}

export interface GuildRoleSchema {
  guildId: string;
  roleId: string;
  assignLevel: Generated<number>;
  deassignLevel: Generated<number>;
  assignMessage: Generated<string>;
  deassignMessage: Generated<string>;
  xpPerVoiceMinute: Generated<number>;
  xpPerTextMessage: Generated<number>;
  xpPerVote: Generated<number>;
  xpPerInvite: Generated<number>;
  noXp: Generated<number>;
}

export interface InviteSchema {
  guildId: string;
  userId: string;
  alltime: Generated<number>;
  year: Generated<number>;
  month: Generated<number>;
  week: Generated<number>;
  day: Generated<number>;
  changeDate: Generated<string>;
  addDate: Generated<string>;
}

export interface TextMessageSchema {
  guildId: string;
  userId: string;
  channelId: string;
  alltime: Generated<number>;
  year: Generated<number>;
  month: Generated<number>;
  week: Generated<number>;
  day: Generated<number>;
  changeDate: Generated<string>;
  addDate: Generated<string>;
}

export interface UserSchema {
  userId: string;
  /** @deprecated */
  tokens: Generated<number>;
  /** @deprecated */
  tokensBought: Generated<number>;
  /** @deprecated */
  tokensGifted: Generated<number>;
  voteMultiplier: Generated<number>;
  voteMultiplierUntil: Generated<number>;
  lastAskForPremiumDate: Generated<string>; // bigint
  addDate: Generated<string>;
  isBanned: Generated<number>;
  patreonTier: Generated<number>;
  patreonTierUntilDate: Generated<string>;
  lastTopggUpvoteDate: Generated<string>;
}

export interface VoiceMinuteSchema {
  guildId: string;
  userId: string;
  channelId: string;
  alltime: Generated<number>;
  year: Generated<number>;
  month: Generated<number>;
  week: Generated<number>;
  day: Generated<number>;
  changeDate: Generated<string>;
  addDate: Generated<string>;
}

export interface VoteSchema {
  guildId: string;
  userId: string;
  alltime: Generated<number>;
  year: Generated<number>;
  month: Generated<number>;
  week: Generated<number>;
  day: Generated<number>;
  changeDate: Generated<string>;
  addDate: Generated<string>;
}

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

export namespace ShardDB {
  export namespace Schema {
    export type Bonus = BonusSchema;
    export type Guild = GuildSchema;
    export type GuildChannel = GuildChannelSchema;
    export type GuildMember = GuildMemberSchema;
    export type GuildRole = GuildRoleSchema;
    export type Invite = InviteSchema;
    export type TextMessage = TextMessageSchema;
    export type User = UserSchema;
    export type VoiceMinute = VoiceMinuteSchema;
    export type Vote = VoteSchema;
  }

  export type Bonus = Selectable<BonusSchema>;
  export type NewBonus = Insertable<BonusSchema>;
  export type BonusUpdate = Updateable<BonusSchema>;

  export type Guild = Selectable<GuildSchema>;
  export type NewGuild = Insertable<GuildSchema>;
  export type GuildUpdate = Updateable<GuildSchema>;

  export type GuildChannel = Selectable<GuildChannelSchema>;
  export type NewGuildChannel = Insertable<GuildChannelSchema>;
  export type GuildChannelUpdate = Updateable<GuildChannelSchema>;

  export type GuildMember = Selectable<GuildMemberSchema>;
  export type NewGuildMember = Insertable<GuildMemberSchema>;
  export type GuildMemberUpdate = Updateable<GuildMemberSchema>;

  export type GuildRole = Selectable<GuildRoleSchema>;
  export type NewGuildRole = Insertable<GuildRoleSchema>;
  export type GuildRoleUpdate = Updateable<GuildRoleSchema>;

  export type Invite = Selectable<InviteSchema>;
  export type NewInvite = Insertable<InviteSchema>;
  export type InviteUpdate = Updateable<InviteSchema>;

  export type TextMessage = Selectable<TextMessageSchema>;
  export type NewTextMessage = Insertable<TextMessageSchema>;
  export type TextMessageUpdate = Updateable<TextMessageSchema>;

  export type User = Selectable<UserSchema>;
  export type NewUser = Insertable<UserSchema>;
  export type UserUpdate = Updateable<UserSchema>;

  export type VoiceMinute = Selectable<VoiceMinuteSchema>;
  export type NewVoiceMinute = Insertable<VoiceMinuteSchema>;
  export type VoiceMinuteUpdate = Updateable<VoiceMinuteSchema>;

  export type Vote = Selectable<VoteSchema>;
  export type NewVote = Insertable<VoteSchema>;
  export type VoteUpdate = Updateable<VoteSchema>;
}
