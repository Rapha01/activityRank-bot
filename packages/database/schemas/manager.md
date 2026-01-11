# Manager Schema

This document describes deprecations, requirements, and other notes for tables in the manager database.

## General Notes

- MySQL does not support a native boolean type. `tinyint(4)` or `tinyint(1)` types likely represent a boolean.
- Most columns are `NOT NULL DEFAULT '0'` by default. This may be a good refactor at some point.
  - Many columns have defaults when they really shouldn't.
- Timestamps are saved as `bigint`s, in seconds, unless otherwise documented.

## Actively Used Tables

### `botShardStat`

|                    Key | Type        | Nullable | Default |
|-----------------------:|-------------|:--------:|---------|
|          **`shardId`** | int         |    ×     |         |
|               `status` | tinyint     |    ×     |         |
|          `serverCount` | int         |    ×     | 0       |
|        `uptimeSeconds` | int         |    ×     | 0       |
|            `readyDate` | bigint      |    ×     | 0       |
|                   `ip` | varchar(64) |    ×     |         |
|    `changedHealthDate` | bigint      |    ×     | 0       |
|           `commands1h` | int         |    ×     | 0       |
|         `botInvites1h` | int         |    ×     | 0       |
|           `botKicks1h` | int         |    ×     | 0       |
|       `voiceMinutes1h` | int         |    ×     | 0       |
|       `textMessages1h` | int         |    ×     | 0       |
|    `roleAssignments1h` | int         |    ×     | 0       |
| `rolesDeassignments1h` | int         |    ×     | 0       |
|      `changedStatDate` | bigint      |    ×     | 0       |
|        `restartQueued` | tinyint     |    ×     | 0       |
|        `commandsTotal` | int         |    ×     | 0       |
|    `textMessagesTotal` | int         |    ×     | 0       |

**Primary Key**: `shardId`

### `dbShard`

|      Key | Type        | Nullable | Default |
|---------:|-------------|:--------:|---------|
| **`id`** | smallint    |    ×     | 0       |
|   `host` | varchar(45) |    ×     | 0       |

**Primary Key**: `id`

#### Deprecated / Unused Columns

`hostIntern` and `hostExtern` fields should not be used.
They used to be used to differentiate between development
and production databases (`intern` and `extern` respectively).

|          Key | Type        | Nullable | Default |
|-------------:|-------------|:--------:|---------|
| `hostExtern` | varchar(45) |    ×     | 0       |
| `hostIntern` | varchar(45) |    ×     | 0       |

### `guildRoute`

|           Key | Type     | Nullable | Default |
|--------------:|----------|:--------:|---------|
| **`guildId`** | bigint   |    ×     | 0       |
|   `dbShardId` | smallint |    ×     | 0       |

**Primary Key**: `guildId`

### `session`

Used to store OAuth2 sessions on the dashboard.
Expired sessions should be cleared periodically.

Sessions in this database have the same expiry as 
their linked Discord OAuth2 `access_token`s.

> `user_id` references `web_user(id)`

|             Key | Type         | Nullable | Default |
|----------------:|--------------|:--------:|---------|
|        **`id`** | varchar(255) |    ×     |         |
|       `user_id` | bigint(20)   |    ×     |         |
|  `access_token` | varchar(255) |    ×     |         |
| `refresh_token` | varchar(255) |    ×     |         |
|    `expires_at` | datetime     |    ×     |         |

**Primary Key**: `id`

### `userRoute`

|          Key | Type     | Nullable | Default |
|-------------:|----------|:--------:|---------|
| **`userId`** | bigint   |    ×     | 0       |
|  `dbShardId` | smallint |    ×     | 0       |

**Primary Key**: `userId`

### `web_user`

Represents dashboard users. Keeps a cache of their username and avatar hash.

|           Key | Type        | Nullable | Default |
|--------------:|-------------|:--------:|---------|
|      **`id`** | bigint(20)  |    ×     |         |
|    `username` | varchar(32) |    ×     |         |
| `avatar_hash` | varchar(32) |    ☑︎    | NULL    |

**Primary Key**: `id`

## Unused Tables

### `botStat`

Used to be used to collect global stats. Became unmaintained at some point and was never restored.

|                    Key | Type   | Nullable | Default |
|-----------------------:|--------|:--------:|---------|
|           `commands1h` | int    |    ×     | 0       |
|         `botInvites1h` | int    |    ×     | 0       |
|           `botKicks1h` | int    |    ×     | 0       |
|       `voiceMinutes1h` | int    |    ×     | 0       |
|       `textMessages1h` | int    |    ×     | 0       |
|    `roleAssignments1h` | int    |    ×     | 0       |
| `rolesDeassignments1h` | int    |    ×     | 0       |
|          `serverCount` | int    |    ×     | 0       |
|              `addDate` | bigint |    ×     | 0       |

**Primary Key**: none

### `productKey`

|           Key | Type         | Nullable | Default |
|--------------:|--------------|:--------:|---------|
|     **`key`** | varchar(128) |    ×     |         |
|        `type` | varchar(64)  |    ×     | ""      |
|      `userId` | bigint       |    ×     | 0       |
| `consumeDate` | bigint       |    ×     | 0       |
|     `addDate` | bigint       |    ×     | 0       |

**Primary Key**: `key`

### `setting`

Used to be used to broadcast messages in the footer of `/top` and `/rank` messages.
This functionality has been removed.

|      Key | Type          | Nullable | Default |
|---------:|---------------|:--------:|---------|
| **`id`** | varchar(64)   |    ×     |         |
|  `value` | varchar(4096) |    ×     | ""      |

**Primary Key**: `id`
