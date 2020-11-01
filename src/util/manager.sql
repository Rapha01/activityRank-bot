SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET AUTOCOMMIT = 0;
START TRANSACTION;
SET time_zone = "+00:00";

USE `manager`;

CREATE TABLE `setting` (
  `id` varchar(64) NOT NULL,
  `value` varchar(4096) NOT NULL DEFAULT ''
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

ALTER TABLE `setting`
  ADD PRIMARY KEY (`id`);

INSERT INTO `setting` (`id`, `value`) VALUES
	('footer',''),('footerUntil','1586829600');

CREATE TABLE `guildRoute` (
  `guildId` BIGINT NOT NULL DEFAULT '0',
  `dbShardId` SMALLINT NOT NULL DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

ALTER TABLE `guildRoute`
  ADD PRIMARY KEY (`guildid`);

CREATE TABLE `userRoute` (
  `userId` BIGINT NOT NULL DEFAULT '0',
  `dbShardId` SMALLINT NOT NULL DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

ALTER TABLE `userRoute`
  ADD PRIMARY KEY (`userId`);

CREATE TABLE `dbShard` (
  `id` BIGINT NOT NULL DEFAULT '0',
  `hostExtern` varchar(45) NOT NULL DEFAULT '0',
  `hostIntern` varchar(45) NOT NULL DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `dbShard` (`id`, `hostExtern`, `hostIntern`) VALUES
('0', '','10.0.0.4'),
('1', '','10.0.0.7');

ALTER TABLE `dbShard`
  ADD PRIMARY KEY (`id`);

CREATE TABLE `botStat` (
  `commands1h` INT NOT NULL DEFAULT '0',
  `botInvites1h` INT NOT NULL DEFAULT '0',
  `botKicks1h` INT NOT NULL DEFAULT '0',
  `voiceMinutes1h` INT NOT NULL DEFAULT '0',
  `textMessages1h` INT NOT NULL DEFAULT '0',
  `roleAssignments1h` INT NOT NULL DEFAULT '0',
  `rolesDeassignments1h` INT NOT NULL DEFAULT '0',
  `serverCount` INT NOT NULL DEFAULT '0',
  `addDate` BIGINT NOT NULL DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `botShardStat` (
  `shardId` MEDIUMINT NOT NULL,
  `status` varchar(64) NOT NULL DEFAULT '',
  `serverCount` INT NOT NULL DEFAULT '0',
  `uptimeSeconds` INT NOT NULL DEFAULT '0',
  `readyDate` BIGINT NOT NULL DEFAULT '0',
  `ip` BIGINT NOT NULL DEFAULT '0',
  `changedHealthDate` BIGINT NOT NULL DEFAULT '0',
  `commands1h` INT NOT NULL DEFAULT '0',
  `botInvites1h` INT NOT NULL DEFAULT '0',
  `botKicks1h` INT NOT NULL DEFAULT '0',
  `voiceMinutes1h` INT NOT NULL DEFAULT '0',
  `textMessages1h` INT NOT NULL DEFAULT '0',
  `roleAssignments1h` INT NOT NULL DEFAULT '0',
  `rolesDeassignments1h` INT NOT NULL DEFAULT '0',
  `changedStatDate` BIGINT NOT NULL DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

ALTER TABLE `botShardStat`
  ADD PRIMARY KEY (`shardId`);

CREATE TABLE `productKey` (
  `key` varchar(128) NOT NULL,
  `type` varchar(64) NOT NULL DEFAULT '',
  `userId` BIGINT NOT NULL DEFAULT '0',
  `consumeDate` BIGINT NOT NULL DEFAULT '0',
  `addDate` BIGINT NOT NULL DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

ALTER TABLE `productKey`
  ADD PRIMARY KEY (`key`);
COMMIT;
