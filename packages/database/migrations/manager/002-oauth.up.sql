CREATE TABLE `session` (
  `id` varchar(255) NOT NULL PRIMARY KEY,
  `user_id` bigint(20) NOT NULL REFERENCES web_user(id),
  `access_token` varchar(255) NOT NULL,
  `refresh_token` varchar(255) NOT NULL,
  `expires_at` datetime NOT NULL
);

CREATE TABLE `web_user` (
  `id` bigint(20) NOT NULL,
  `username` varchar(32) NOT NULL,
  `avatar_hash` varchar(32) DEFAULT NULL,
  PRIMARY KEY (`id`)
);
