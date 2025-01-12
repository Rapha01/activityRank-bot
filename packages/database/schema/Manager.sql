CREATE DATABASE  IF NOT EXISTS `manager` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;
USE `manager`;
-- MySQL dump 10.13  Distrib 8.0.36, for macos14 (x86_64)
--
-- Host: 88.99.189.124    Database: manager
-- ------------------------------------------------------
-- Server version	8.0.37

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
-- Table structure for table `botShardStat`
--

DROP TABLE IF EXISTS `botShardStat`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `botShardStat` (
  `shardId` mediumint NOT NULL,
  `status` tinyint NOT NULL,
  `serverCount` int NOT NULL DEFAULT '0',
  `uptimeSeconds` int NOT NULL DEFAULT '0',
  `readyDate` bigint NOT NULL DEFAULT '0',
  `ip` varchar(15) NOT NULL,
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `botStat`
--

DROP TABLE IF EXISTS `botStat`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `dbShard`
--

DROP TABLE IF EXISTS `dbShard`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `dbShard` (
  `id` bigint NOT NULL DEFAULT '0',
  `hostExtern` varchar(45) NOT NULL DEFAULT '0',
  `hostIntern` varchar(45) NOT NULL DEFAULT '0',
  `host` varchar(45) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `guildRoute`
--

DROP TABLE IF EXISTS `guildRoute`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `guildRoute` (
  `guildId` bigint NOT NULL DEFAULT '0',
  `dbShardId` smallint NOT NULL DEFAULT '0',
  PRIMARY KEY (`guildId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `productKey`
--

DROP TABLE IF EXISTS `productKey`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `productKey` (
  `key` varchar(128) NOT NULL,
  `type` varchar(64) NOT NULL DEFAULT '',
  `userId` bigint NOT NULL DEFAULT '0',
  `consumeDate` bigint NOT NULL DEFAULT '0',
  `addDate` bigint NOT NULL DEFAULT '0',
  PRIMARY KEY (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `setting`
--

DROP TABLE IF EXISTS `setting`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `setting` (
  `id` varchar(64) NOT NULL,
  `value` varchar(4096) NOT NULL DEFAULT '',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `userRoute`
--

DROP TABLE IF EXISTS `userRoute`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `userRoute` (
  `userId` bigint NOT NULL DEFAULT '0',
  `dbShardId` smallint NOT NULL DEFAULT '0',
  PRIMARY KEY (`userId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-01-09 23:28:46
