UPDATE mysql.user SET plugin = 'mysql_native_password' WHERE User = 'root';
FLUSH PRIVILEGES;
-- phpMyAdmin SQL Dump
-- version 5.0.1
-- https://www.phpmyadmin.net/
--
-- Host: 138.197.105.22
-- Erstellungszeit: 30. Apr 2020 um 23:43
-- Server-Version: 5.7.29-0ubuntu0.18.04.1
-- PHP-Version: 7.2.27

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET AUTOCOMMIT = 0;
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Datenbank: `activityrank`
--
CREATE DATABASE IF NOT EXISTS `activityrank` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE `activityrank`;

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `bonus`
--

CREATE TABLE `bonus` (
  `guildid` varchar(32) NOT NULL,
  `userid` varchar(32) NOT NULL,
  `alltime` int(11) NOT NULL DEFAULT '0',
  `year` int(11) NOT NULL DEFAULT '0',
  `month` int(11) NOT NULL DEFAULT '0',
  `week` int(11) NOT NULL DEFAULT '0',
  `day` int(11) NOT NULL DEFAULT '0',
  `haschanged` tinyint(1) NOT NULL DEFAULT '0',
  `datechanged` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `datebackedup` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `dateadded` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `command`
--

CREATE TABLE `command` (
  `guildid` varchar(32) NOT NULL,
  `userid` varchar(32) NOT NULL,
  `command` varchar(32) NOT NULL,
  `alltime` int(11) NOT NULL DEFAULT '0',
  `year` int(11) NOT NULL DEFAULT '0',
  `month` int(11) NOT NULL DEFAULT '0',
  `week` int(11) NOT NULL DEFAULT '0',
  `day` int(11) NOT NULL DEFAULT '0',
  `haschanged` tinyint(1) NOT NULL DEFAULT '0',
  `datechanged` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `datebackedup` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `dateadded` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `gl_admin`
--

CREATE TABLE `gl_admin` (
  `id` int(11) NOT NULL DEFAULT '0',
  `footer` varchar(4096) NOT NULL DEFAULT '',
  `footeruntil` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `backupmode` int(11) NOT NULL DEFAULT '0',
  `dateadded` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `gl_botstat`
--

CREATE TABLE `gl_botstat` (
  `commandsday` int(11) NOT NULL DEFAULT '0',
  `commandcounts` varchar(1024) NOT NULL DEFAULT '[]',
  `joins24h` int(11) NOT NULL DEFAULT '0',
  `leaves24h` int(11) NOT NULL DEFAULT '0',
  `voicemembers24h` int(11) NOT NULL DEFAULT '0',
  `voicechannels24h` int(11) NOT NULL DEFAULT '0',
  `voiceminutesday` int(11) NOT NULL DEFAULT '0',
  `textmembers24h` int(11) NOT NULL DEFAULT '0',
  `textchannels24h` int(11) NOT NULL DEFAULT '0',
  `textmessagesday` int(11) NOT NULL DEFAULT '0',
  `rolesassignmentsday` int(11) NOT NULL DEFAULT '0',
  `rolesdeassignmentsday` int(11) NOT NULL DEFAULT '0',
  `servercount` int(11) NOT NULL DEFAULT '0',
  `dateadded` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `gl_externupvote`
--

CREATE TABLE `gl_externupvote` (
  `userid` varchar(32) NOT NULL,
  `source` varchar(32) NOT NULL DEFAULT '',
  `dateadded` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `gl_product`
--

CREATE TABLE `gl_product` (
  `type` varchar(32) NOT NULL,
  `typeid` varchar(32) NOT NULL,
  `plan` varchar(32) NOT NULL,
  `until` datetime NOT NULL DEFAULT '1970-01-01 00:00:00',
  `txnplatform` varchar(32) NOT NULL DEFAULT '',
  `txnid` varchar(256) NOT NULL DEFAULT '',
  `dateadded` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `gl_shard`
--

CREATE TABLE `gl_shard` (
  `shardid` mediumint(9) NOT NULL,
  `status` varchar(64) NOT NULL DEFAULT '',
  `servercount` int(11) NOT NULL DEFAULT '0',
  `ip` bigint(20) NOT NULL DEFAULT '0',
  `uptimesec` int(11) NOT NULL DEFAULT '0',
  `dateready` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `datechanged` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `haschanged` tinyint(1) NOT NULL DEFAULT '0',
  `dateadded` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `guild`
--

CREATE TABLE `guild` (
  `guildid` varchar(32) NOT NULL,
  `votetag` varchar(56) NOT NULL DEFAULT 'likes',
  `voteemote` varchar(256) NOT NULL DEFAULT '❤',
  `bonustag` varchar(56) NOT NULL DEFAULT 'bonus',
  `bonusemote` varchar(256) NOT NULL DEFAULT ':trophy:',
  `deassignassignedroles` tinyint(1) NOT NULL DEFAULT '0',
  `pointspervoiceminute` tinyint(4) NOT NULL DEFAULT '3',
  `pointspertextmessage` tinyint(4) NOT NULL DEFAULT '6',
  `pointspervote` tinyint(4) NOT NULL DEFAULT '20',
  `pointsperbonus` tinyint(4) NOT NULL DEFAULT '1',
  `bonuspertextmessage` tinyint(4) NOT NULL DEFAULT '6',
  `bonuspervoiceminute` tinyint(4) NOT NULL DEFAULT '3',
  `bonuspervote` tinyint(4) NOT NULL DEFAULT '20',
  `bonusuntil` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `levelfactor` int(11) NOT NULL DEFAULT '100',
  `prefix` varchar(32) NOT NULL DEFAULT 'ar!',
  `showvoicescore` tinyint(1) NOT NULL DEFAULT '1',
  `showtextscore` tinyint(1) NOT NULL DEFAULT '1',
  `showvotescore` tinyint(1) NOT NULL DEFAULT '1',
  `voteinterval` int(11) NOT NULL DEFAULT '30',
  `post_levelup` varchar(32) NOT NULL DEFAULT '0',
  `post_serverjoin` varchar(32) NOT NULL DEFAULT '0',
  `post_serverleave` varchar(32) NOT NULL DEFAULT '0',
  `post_voicechanneljoin` varchar(32) NOT NULL DEFAULT '0',
  `post_voicechannelleave` varchar(32) NOT NULL DEFAULT '0',
  `text_levelup` varchar(2048) NOT NULL DEFAULT 'Congratulations <mention>! You have reached level <level>!',
  `text_serverjoin` varchar(1024) NOT NULL DEFAULT 'Welcome <mention>. Have a good time here!',
  `text_serverleave` varchar(1024) NOT NULL DEFAULT 'Oh no! <name> left the server!',
  `text_voicechanneljoin` varchar(1024) NOT NULL DEFAULT '<name> has joined <channel>.',
  `text_voicechannelleave` varchar(1024) NOT NULL DEFAULT '<name> has left <channel>.',
  `text_roleassignment` varchar(512) NOT NULL DEFAULT 'You have been granted the role <rolename>!',
  `text_roledeassignment` varchar(512) NOT NULL DEFAULT 'The role <rolename> has been taken from you!',
  `notifylevelupdm` tinyint(1) NOT NULL DEFAULT '0',
  `notifylevelupchannel` tinyint(1) NOT NULL DEFAULT '0',
  `notifyleveluponlywithrole` tinyint(1) NOT NULL DEFAULT '0',
  `textmessagecooldown` smallint(6) NOT NULL DEFAULT '10',
  `entriesperpage` smallint(6) NOT NULL DEFAULT '10',
  `allowdownvotes` tinyint(1) NOT NULL DEFAULT '1',
  `allowmutedxp` tinyint(1) NOT NULL DEFAULT '0',
  `allowvotewithoutmention` tinyint(1) NOT NULL DEFAULT '1',
  `botjoindate` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `botleavedate` datetime NOT NULL DEFAULT '1970-01-01 00:00:00',
  `dateresettedserver` datetime NOT NULL DEFAULT '1970-01-01 00:00:00',
  `dateresettedchannel` datetime NOT NULL DEFAULT '1970-01-01 00:00:00',
  `dateresetteduser` datetime NOT NULL DEFAULT '1970-01-01 00:00:00',
  `haschanged` tinyint(1) NOT NULL DEFAULT '0',
  `datechanged` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `datebackedup` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `dateadded` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `guildchannel`
--

CREATE TABLE `guildchannel` (
  `guildid` varchar(32) NOT NULL,
  `channelid` varchar(32) NOT NULL,
  `noxp` tinyint(1) NOT NULL DEFAULT '0',
  `receivelevelupdates` tinyint(1) NOT NULL DEFAULT '0',
  `name_totalusercount` tinyint(1) NOT NULL DEFAULT '0',
  `name_onlineusercount` tinyint(1) NOT NULL DEFAULT '0',
  `name_activeuserslast24h` tinyint(1) NOT NULL DEFAULT '0',
  `name_totalvoiceminutes` varchar(16) NOT NULL DEFAULT '0',
  `name_totaltextmessages` varchar(16) NOT NULL DEFAULT '0',
  `name_serverjoinslast24h` tinyint(1) NOT NULL DEFAULT '0',
  `name_serverleaveslast24h` tinyint(1) NOT NULL DEFAULT '0',
  `name_roleusercount` varchar(32) NOT NULL DEFAULT '0',
  `name_activityusercount` varchar(64) NOT NULL DEFAULT '0',
  `haschanged` tinyint(1) NOT NULL DEFAULT '0',
  `datechanged` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `datebackedup` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `dateadded` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `guildmember`
--

CREATE TABLE `guildmember` (
  `guildid` varchar(32) NOT NULL,
  `userid` varchar(32) NOT NULL,
  `lastvote` datetime NOT NULL DEFAULT '1970-01-01 00:00:00',
  `lasttextmessage` datetime NOT NULL DEFAULT '1970-01-01 00:00:00',
  `receivelevelupdates` tinyint(1) NOT NULL DEFAULT '1',
  `notifylevelupdm` tinyint(1) NOT NULL DEFAULT '1',
  `joinedserver` datetime NOT NULL DEFAULT '1970-01-01 00:00:00',
  `leftserver` datetime NOT NULL DEFAULT '1970-01-01 00:00:00',
  `haschanged` tinyint(1) NOT NULL DEFAULT '0',
  `datechanged` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `datebackedup` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `dateadded` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `guildrole`
--

CREATE TABLE `guildrole` (
  `guildid` varchar(32) NOT NULL,
  `roleid` varchar(32) NOT NULL,
  `assignlevel` int(11) NOT NULL DEFAULT '0',
  `deassignlevel` int(11) NOT NULL DEFAULT '0',
  `assignmessage` varchar(512) NOT NULL DEFAULT '',
  `deassignmessage` varchar(512) NOT NULL DEFAULT '',
  `noxp` tinyint(1) NOT NULL DEFAULT '0',
  `assignedday` int(11) NOT NULL DEFAULT '0',
  `assignedweek` int(11) NOT NULL DEFAULT '0',
  `assignedmonth` int(11) NOT NULL DEFAULT '0',
  `assignedyear` int(11) NOT NULL DEFAULT '0',
  `assignedalltime` int(11) NOT NULL DEFAULT '0',
  `deassignedday` int(11) NOT NULL DEFAULT '0',
  `deassignedweek` int(11) NOT NULL DEFAULT '0',
  `deassignedmonth` int(11) NOT NULL DEFAULT '0',
  `deassignedyear` int(11) NOT NULL DEFAULT '0',
  `deassignedalltime` int(11) NOT NULL DEFAULT '0',
  `haschanged` tinyint(1) NOT NULL DEFAULT '0',
  `datechanged` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `datebackedup` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `dateadded` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `textmessage`
--

CREATE TABLE `textmessage` (
  `guildid` varchar(32) NOT NULL,
  `userid` varchar(32) NOT NULL,
  `channelid` varchar(32) NOT NULL,
  `alltime` int(11) NOT NULL DEFAULT '0',
  `year` int(11) NOT NULL DEFAULT '0',
  `month` int(11) NOT NULL DEFAULT '0',
  `week` int(11) NOT NULL DEFAULT '0',
  `day` int(11) NOT NULL DEFAULT '0',
  `haschanged` tinyint(1) NOT NULL DEFAULT '0',
  `datechanged` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `datebackedup` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `dateadded` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `voiceminute`
--

CREATE TABLE `voiceminute` (
  `guildid` varchar(32) NOT NULL,
  `userid` varchar(32) NOT NULL,
  `channelid` varchar(32) NOT NULL,
  `alltime` int(11) NOT NULL DEFAULT '0',
  `year` int(11) NOT NULL DEFAULT '0',
  `month` int(11) NOT NULL DEFAULT '0',
  `week` int(11) NOT NULL DEFAULT '0',
  `day` int(11) NOT NULL DEFAULT '0',
  `haschanged` tinyint(1) NOT NULL DEFAULT '0',
  `datechanged` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `datebackedup` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `dateadded` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `vote`
--

CREATE TABLE `vote` (
  `guildid` varchar(32) NOT NULL,
  `userid` varchar(32) NOT NULL,
  `alltime` int(11) NOT NULL DEFAULT '0',
  `year` int(11) NOT NULL DEFAULT '0',
  `month` int(11) NOT NULL DEFAULT '0',
  `week` int(11) NOT NULL DEFAULT '0',
  `day` int(11) NOT NULL DEFAULT '0',
  `haschanged` tinyint(1) NOT NULL DEFAULT '0',
  `datechanged` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `datebackedup` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `dateadded` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Indizes der exportierten Tabellen
--

--
-- Indizes für die Tabelle `bonus`
--
ALTER TABLE `bonus`
  ADD PRIMARY KEY (`guildid`,`userid`) USING BTREE;

--
-- Indizes für die Tabelle `command`
--
ALTER TABLE `command`
  ADD PRIMARY KEY (`guildid`,`userid`,`command`) USING BTREE;

--
-- Indizes für die Tabelle `gl_admin`
--
ALTER TABLE `gl_admin`
  ADD PRIMARY KEY (`id`);

--
-- Indizes für die Tabelle `gl_externupvote`
--
ALTER TABLE `gl_externupvote`
  ADD PRIMARY KEY (`userid`,`source`,`dateadded`) USING BTREE;

--
-- Indizes für die Tabelle `gl_product`
--
ALTER TABLE `gl_product`
  ADD PRIMARY KEY (`txnplatform`,`txnid`);

--
-- Indizes für die Tabelle `gl_shard`
--
ALTER TABLE `gl_shard`
  ADD PRIMARY KEY (`shardid`);

--
-- Indizes für die Tabelle `guild`
--
ALTER TABLE `guild`
  ADD PRIMARY KEY (`guildid`);

--
-- Indizes für die Tabelle `guildchannel`
--
ALTER TABLE `guildchannel`
  ADD PRIMARY KEY (`guildid`,`channelid`) USING BTREE;

--
-- Indizes für die Tabelle `guildmember`
--
ALTER TABLE `guildmember`
  ADD PRIMARY KEY (`guildid`,`userid`);

--
-- Indizes für die Tabelle `guildrole`
--
ALTER TABLE `guildrole`
  ADD PRIMARY KEY (`guildid`,`roleid`);

--
-- Indizes für die Tabelle `textmessage`
--
ALTER TABLE `textmessage`
  ADD PRIMARY KEY (`guildid`,`userid`,`channelid`) USING BTREE;

--
-- Indizes für die Tabelle `voiceminute`
--
ALTER TABLE `voiceminute`
  ADD PRIMARY KEY (`guildid`,`userid`,`channelid`) USING BTREE;

--
-- Indizes für die Tabelle `vote`
--
ALTER TABLE `vote`
  ADD PRIMARY KEY (`guildid`,`userid`) USING BTREE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
