USE `manager`;

ALTER TABLE `botShardStat` MODIFY COLUMN `ip` varchar(64) NOT NULL;
