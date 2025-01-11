CREATE DATABASE  IF NOT EXISTS `dbShard` /*!40100 DEFAULT CHARACTER SET latin1 */;
USE `dbShard`;
-- MySQL dump 10.13  Distrib 8.0.36, for macos14 (x86_64)
--
-- Host: 88.198.92.234    Database: dbShard
-- ------------------------------------------------------
-- Server version	5.7.30

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `bonus`
--

DROP TABLE IF EXISTS `bonus`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `guild`
--

DROP TABLE IF EXISTS `guild`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
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
  `joinedAtDate` bigint(20) NOT NULL DEFAULT '0',
  `leftAtDate` bigint(20) NOT NULL DEFAULT '0',
  `addDate` bigint(20) NOT NULL DEFAULT '0',
  `isBanned` tinyint(4) NOT NULL DEFAULT '0',
  `resetDeletedMembers` tinyint(1) NOT NULL DEFAULT '0',
  `stickyLevelRoles` tinyint(1) NOT NULL DEFAULT '1',
  `apiToken` char(64) DEFAULT NULL,
  PRIMARY KEY (`guildId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `guildChannel`
--

DROP TABLE IF EXISTS `guildChannel`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `guildChannel` (
  `guildId` bigint(20) NOT NULL,
  `channelId` bigint(20) NOT NULL,
  `noXp` tinyint(4) NOT NULL DEFAULT '0',
  `noCommand` tinyint(4) NOT NULL DEFAULT '0',
  PRIMARY KEY (`guildId`,`channelId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `guildMember`
--

DROP TABLE IF EXISTS `guildMember`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `guildRole`
--

DROP TABLE IF EXISTS `guildRole`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `invite`
--

DROP TABLE IF EXISTS `invite`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
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
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `session`
--

DROP TABLE IF EXISTS `session`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `session` (
  `id` varchar(255) NOT NULL,
  `expires_at` datetime NOT NULL,
  `user_id` bigint(20) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `session_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `user` (`userId`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `textMessage`
--

DROP TABLE IF EXISTS `textMessage`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `user`
--

DROP TABLE IF EXISTS `user`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `voiceMinute`
--

DROP TABLE IF EXISTS `voiceMinute`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `vote`
--

DROP TABLE IF EXISTS `vote`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `web_user`
--

DROP TABLE IF EXISTS `web_user`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `web_user` (
  `id` bigint(20) NOT NULL,
  `username` varchar(20) NOT NULL,
  `avatar_hash` varchar(32) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-01-09 23:29:25
