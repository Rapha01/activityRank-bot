USE `manager`;

ALTER TABLE `web_user` MODIFY COLUMN `avatar_hash` varchar(34) DEFAULT NULL;
