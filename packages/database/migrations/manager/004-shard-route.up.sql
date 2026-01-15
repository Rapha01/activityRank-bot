USE `manager`;

ALTER TABLE `botShardStat` MODIFY COLUMN `shardId` int NOT NULL;
ALTER TABLE `dbShard` MODIFY COLUMN `id` smallint NOT NULL DEFAULT '0';
