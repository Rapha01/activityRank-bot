USE `dbShard`;

CREATE TABLE `bonus` (
  `guildId` bigint(20) NOT NULL,
  `userId` bigint(20) NOT NULL,
  `alltime` int(11) NOT NULL DEFAULT '0',
  `year` int(11) NOT NULL DEFAULT '0',
  `month` int(11) NOT NULL DEFAULT '0',
  `week` int(11) NOT NULL DEFAULT '0',
  `day` int(11) NOT NULL DEFAULT '0',
  `changeDate` bigint(20) NOT NULL DEFAULT '0',
  `addDate` bigint(20) NOT NULL DEFAULT '0',
  PRIMARY KEY (`guildId`,`userId`),
  KEY `guildId` (`guildId`)
);

CREATE TABLE `guild` (
  `guildId` bigint(20) NOT NULL,
  `prefix` varchar(32) NOT NULL DEFAULT 'ar!',
  `tokens` int(11) NOT NULL DEFAULT '0',
  `tokensBurned` int(11) NOT NULL DEFAULT '0',
  `voteTag` varchar(56) NOT NULL DEFAULT 'likes',
  `voteEmote` varchar(128) NOT NULL DEFAULT ':heart:',
  `bonusTag` varchar(56) NOT NULL DEFAULT 'bonus',
  `bonusEmote` varchar(128) NOT NULL DEFAULT ':trophy:',
  `entriesPerPage` smallint(6) NOT NULL DEFAULT '12',
  `showNicknames` tinyint(4) NOT NULL DEFAULT '0',
  `textXp` tinyint(4) NOT NULL DEFAULT '1',
  `voiceXp` tinyint(4) NOT NULL DEFAULT '1',
  `inviteXp` tinyint(4) NOT NULL DEFAULT '1',
  `voteXp` tinyint(4) NOT NULL DEFAULT '1',
  `bonusXp` tinyint(4) NOT NULL DEFAULT '1',
  `notifyLevelupDm` tinyint(4) NOT NULL DEFAULT '0',
  `notifyLevelupCurrentChannel` tinyint(4) NOT NULL DEFAULT '0',
  `notifyLevelupWithRole` tinyint(4) NOT NULL DEFAULT '1',
  `notifyLevelupOnlyWithRole` tinyint(4) NOT NULL DEFAULT '0',
  `takeAwayAssignedRolesOnLevelDown` tinyint(4) NOT NULL DEFAULT '0',
  `levelFactor` int(11) NOT NULL DEFAULT '100',
  `voteCooldownSeconds` int(11) NOT NULL DEFAULT '1800',
  `textMessageCooldownSeconds` smallint(6) NOT NULL DEFAULT '0',
  `xpPerVoiceMinute` smallint(6) NOT NULL DEFAULT '3',
  `xpPerTextMessage` smallint(6) NOT NULL DEFAULT '6',
  `xpPerVote` smallint(6) NOT NULL DEFAULT '30',
  `xpPerInvite` smallint(6) NOT NULL DEFAULT '300',
  `xpPerBonus` smallint(6) NOT NULL DEFAULT '1',
  `bonusPerTextMessage` smallint(6) NOT NULL DEFAULT '6',
  `bonusPerVoiceMinute` smallint(6) NOT NULL DEFAULT '3',
  `bonusPerVote` smallint(6) NOT NULL DEFAULT '30',
  `bonusPerInvite` smallint(6) NOT NULL DEFAULT '200',
  `bonusUntilDate` bigint(20) NOT NULL DEFAULT '0',
  `reactionVote` tinyint(4) NOT NULL DEFAULT '0',
  `allowMutedXp` tinyint(4) NOT NULL DEFAULT '1',
  `allowDeafenedXp` tinyint(4) NOT NULL DEFAULT '1',
  `allowSoloXp` tinyint(4) NOT NULL DEFAULT '1',
  `allowInvisibleXp` tinyint(4) NOT NULL DEFAULT '1',
  `allowDownvotes` tinyint(4) NOT NULL DEFAULT '1',
  `commandOnlyChannel` bigint(20) NOT NULL DEFAULT '0',
  `autopost_levelup` bigint(20) NOT NULL DEFAULT '0',
  `autopost_serverJoin` bigint(20) NOT NULL DEFAULT '0',
  `autopost_serverLeave` bigint(20) NOT NULL DEFAULT '0',
  `autopost_voiceChannelJoin` bigint(20) NOT NULL DEFAULT '0',
  `autopost_voiceChannelLeave` bigint(20) NOT NULL DEFAULT '0',
  `autoname_totalUserCount` bigint(20) NOT NULL DEFAULT '0',
  `autoname_onlineUserCount` bigint(20) NOT NULL DEFAULT '0',
  `autoname_activeUsersLast24h` bigint(20) NOT NULL DEFAULT '0',
  `autoname_serverJoinsLast24h` bigint(20) NOT NULL DEFAULT '0',
  `autoname_serverLeavesLast24h` bigint(20) NOT NULL DEFAULT '0',
  `levelupMessage` varchar(2048) NOT NULL DEFAULT '',
  `serverJoinMessage` varchar(1024) NOT NULL DEFAULT '',
  `serverLeaveMessage` varchar(1024) NOT NULL DEFAULT '',
  `voiceChannelJoinMessage` varchar(512) NOT NULL DEFAULT '',
  `voiceChannelLeaveMessage` varchar(512) NOT NULL DEFAULT '',
  `roleAssignMessage` varchar(1024) NOT NULL DEFAULT '',
  `roleDeassignMessage` varchar(1024) NOT NULL DEFAULT '',
  `lastCommandDate` bigint(20) NOT NULL DEFAULT '0',
  `lastTokenBurnDate` bigint(20) NOT NULL DEFAULT '0',
  `resetDay` tinyint(4) NOT NULL DEFAULT '0',
  `resetHour` tinyint(4) NOT NULL DEFAULT '0',
  `leaderboardWebhook` varchar(200) DEFAULT NULL,
  `joinedAtDate` bigint(20) NOT NULL DEFAULT '0',
  `leftAtDate` bigint(20) NOT NULL DEFAULT '0',
  `addDate` bigint(20) NOT NULL DEFAULT '0',
  `isBanned` tinyint(4) NOT NULL DEFAULT '0',
  `resetDeletedMembers` tinyint(1) NOT NULL DEFAULT '0',
  `stickyLevelRoles` tinyint(1) NOT NULL DEFAULT '1',
  `apiToken` char(64) DEFAULT NULL,
  PRIMARY KEY (`guildId`)
);

CREATE TABLE `guildChannel` (
  `guildId` bigint(20) NOT NULL,
  `channelId` bigint(20) NOT NULL,
  `noXp` tinyint(4) NOT NULL DEFAULT '0',
  `noCommand` tinyint(4) NOT NULL DEFAULT '0',
  PRIMARY KEY (`guildId`,`channelId`)
);

CREATE TABLE `guildMember` (
  `guildId` bigint(20) NOT NULL,
  `userId` bigint(20) NOT NULL,
  `notifyLevelupDm` tinyint(4) NOT NULL DEFAULT '1',
  `tokensBurned` int(11) NOT NULL DEFAULT '0',
  `reactionVote` tinyint(4) NOT NULL DEFAULT '1',
  `inviter` bigint(20) NOT NULL DEFAULT '0',
  `alltime` int(11) NOT NULL DEFAULT '0',
  `year` int(11) NOT NULL DEFAULT '0',
  `month` int(11) NOT NULL DEFAULT '0',
  `week` int(11) NOT NULL DEFAULT '0',
  `day` int(11) NOT NULL DEFAULT '0',
  PRIMARY KEY (`guildId`,`userId`)
);

CREATE TABLE `guildRole` (
  `guildId` bigint(20) NOT NULL,
  `roleId` bigint(20) NOT NULL,
  `assignLevel` int(11) NOT NULL DEFAULT '0',
  `deassignLevel` int(11) NOT NULL DEFAULT '0',
  `assignMessage` varchar(1024) NOT NULL DEFAULT '',
  `deassignMessage` varchar(1024) NOT NULL DEFAULT '',
  `xpPerVoiceMinute` smallint(6) NOT NULL DEFAULT '0',
  `xpPerTextMessage` smallint(6) NOT NULL DEFAULT '0',
  `xpPerVote` smallint(6) NOT NULL DEFAULT '0',
  `xpPerInvite` smallint(6) NOT NULL DEFAULT '0',
  `noXp` tinyint(4) NOT NULL DEFAULT '0',
  PRIMARY KEY (`guildId`,`roleId`)
);

CREATE TABLE `invite` (
  `guildId` bigint(20) NOT NULL,
  `userId` bigint(20) NOT NULL,
  `alltime` int(11) NOT NULL DEFAULT '0',
  `year` int(11) NOT NULL DEFAULT '0',
  `month` int(11) NOT NULL DEFAULT '0',
  `week` int(11) NOT NULL DEFAULT '0',
  `day` int(11) NOT NULL DEFAULT '0',
  `changeDate` bigint(20) NOT NULL DEFAULT '0',
  `addDate` bigint(20) NOT NULL DEFAULT '0',
  PRIMARY KEY (`guildId`,`userId`)
);

CREATE TABLE `textMessage` (
  `guildId` bigint(20) NOT NULL,
  `userId` bigint(20) NOT NULL,
  `channelId` bigint(20) NOT NULL,
  `alltime` int(11) NOT NULL DEFAULT '0',
  `year` int(11) NOT NULL DEFAULT '0',
  `month` int(11) NOT NULL DEFAULT '0',
  `week` int(11) NOT NULL DEFAULT '0',
  `day` int(11) NOT NULL DEFAULT '0',
  `changeDate` bigint(20) NOT NULL DEFAULT '0',
  `addDate` bigint(20) NOT NULL DEFAULT '0',
  PRIMARY KEY (`guildId`,`userId`,`channelId`)
);

CREATE TABLE `user` (
  `userId` bigint(20) NOT NULL,
  `tokens` int(11) NOT NULL DEFAULT '10',
  `tokensBought` int(11) NOT NULL DEFAULT '0',
  `tokensGifted` int(11) NOT NULL DEFAULT '0',
  `voteMultiplier` int(11) NOT NULL DEFAULT '1',
  `voteMultiplierUntil` bigint(20) NOT NULL DEFAULT '0',
  `lastAskForPremiumDate` bigint(20) NOT NULL DEFAULT '0',
  `addDate` bigint(20) NOT NULL DEFAULT '0',
  `isBanned` tinyint(4) NOT NULL DEFAULT '0',
  `patreonTier` tinyint(4) NOT NULL DEFAULT '0',
  `patreonTierUntilDate` bigint(20) NOT NULL DEFAULT '0',
  `lastTopggUpvoteDate` bigint(20) NOT NULL DEFAULT '0',
  PRIMARY KEY (`userId`)
);

CREATE TABLE `voiceMinute` (
  `guildId` bigint(20) NOT NULL,
  `userId` bigint(20) NOT NULL,
  `channelId` bigint(20) NOT NULL,
  `alltime` int(11) NOT NULL DEFAULT '0',
  `year` int(11) NOT NULL DEFAULT '0',
  `month` int(11) NOT NULL DEFAULT '0',
  `week` int(11) NOT NULL DEFAULT '0',
  `day` int(11) NOT NULL DEFAULT '0',
  `changeDate` bigint(20) NOT NULL DEFAULT '0',
  `addDate` bigint(20) NOT NULL DEFAULT '0',
  PRIMARY KEY (`guildId`,`userId`,`channelId`)
);

CREATE TABLE `vote` (
  `guildId` bigint(20) NOT NULL,
  `userId` bigint(20) NOT NULL,
  `alltime` int(11) NOT NULL DEFAULT '0',
  `year` int(11) NOT NULL DEFAULT '0',
  `month` int(11) NOT NULL DEFAULT '0',
  `week` int(11) NOT NULL DEFAULT '0',
  `day` int(11) NOT NULL DEFAULT '0',
  `changeDate` bigint(20) NOT NULL DEFAULT '0',
  `addDate` bigint(20) NOT NULL DEFAULT '0',
  PRIMARY KEY (`guildId`,`userId`)
);
