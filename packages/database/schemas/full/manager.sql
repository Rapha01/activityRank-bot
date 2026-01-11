USE `manager`;

CREATE TABLE `botShardStat` (
  `shardId` int NOT NULL,
  `status` tinyint NOT NULL,
  `serverCount` int NOT NULL DEFAULT '0',
  `uptimeSeconds` int NOT NULL DEFAULT '0',
  `readyDate` bigint NOT NULL DEFAULT '0',
  `ip` varchar(64) NOT NULL,
  `changedHealthDate` bigint NOT NULL DEFAULT '0',
  `commands1h` int NOT NULL DEFAULT '0',
  `botInvites1h` int NOT NULL DEFAULT '0',
  `botKicks1h` int NOT NULL DEFAULT '0',
  `voiceMinutes1h` int NOT NULL DEFAULT '0',
  `textMessages1h` int NOT NULL DEFAULT '0',
  `roleAssignments1h` int NOT NULL DEFAULT '0',
  `rolesDeassignments1h` int NOT NULL DEFAULT '0',
  `changedStatDate` bigint NOT NULL DEFAULT '0',
  `restartQueued` tinyint NOT NULL DEFAULT '0',
  `commandsTotal` int NOT NULL DEFAULT '0',
  `textMessagesTotal` int NOT NULL DEFAULT '0',
  PRIMARY KEY (`shardId`)
);

CREATE TABLE `botStat` (
  `commands1h` int NOT NULL DEFAULT '0',
  `botInvites1h` int NOT NULL DEFAULT '0',
  `botKicks1h` int NOT NULL DEFAULT '0',
  `voiceMinutes1h` int NOT NULL DEFAULT '0',
  `textMessages1h` int NOT NULL DEFAULT '0',
  `roleAssignments1h` int NOT NULL DEFAULT '0',
  `rolesDeassignments1h` int NOT NULL DEFAULT '0',
  `serverCount` int NOT NULL DEFAULT '0',
  `addDate` bigint NOT NULL DEFAULT '0'
);

CREATE TABLE `dbShard` (
  `id` smallint NOT NULL DEFAULT '0',
  `hostExtern` varchar(45) NOT NULL DEFAULT '0',
  `hostIntern` varchar(45) NOT NULL DEFAULT '0',
  `host` varchar(45) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
);

CREATE TABLE `guildRoute` (
  `guildId` bigint NOT NULL DEFAULT '0',
  `dbShardId` smallint NOT NULL DEFAULT '0',
  PRIMARY KEY (`guildId`)
);

CREATE TABLE `productKey` (
  `key` varchar(128) NOT NULL,
  `type` varchar(64) NOT NULL DEFAULT '',
  `userId` bigint NOT NULL DEFAULT '0',
  `consumeDate` bigint NOT NULL DEFAULT '0',
  `addDate` bigint NOT NULL DEFAULT '0',
  PRIMARY KEY (`key`)
);

CREATE TABLE `session` (
  `id` varchar(255) NOT NULL PRIMARY KEY,
  `user_id` bigint(20) NOT NULL REFERENCES web_user(id),
  `access_token` varchar(255) NOT NULL,
  `refresh_token` varchar(255) NOT NULL,
  `expires_at` datetime NOT NULL
);

CREATE TABLE `setting` (
  `id` varchar(64) NOT NULL,
  `value` varchar(4096) NOT NULL DEFAULT '',
  PRIMARY KEY (`id`)
);

CREATE TABLE `userRoute` (
  `userId` bigint NOT NULL DEFAULT '0',
  `dbShardId` smallint NOT NULL DEFAULT '0',
  PRIMARY KEY (`userId`)
);

CREATE TABLE `web_user` (
  `id` bigint(20) NOT NULL PRIMARY KEY,
  `username` varchar(32) NOT NULL UNIQUE,
  `avatar_hash` varchar(32) DEFAULT NULL
);
