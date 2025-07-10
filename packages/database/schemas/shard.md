# Shard Schema

This document describes deprecations, requirements, and other notes for tables in the sharded databases.

## General Notes

- MySQL does not support a native boolean type. `tinyint(4)` or `tinyint(1)` types likely represent a boolean.
- Most columns are `NOT NULL DEFAULT '0'` by default. This may be a good refactor at some point.
  - Some columns have defaults when they really shouldn't.
- Timestamps are saved as `bigint`s, in seconds, unless otherwise documented.

## Actively Used Tables

### `bonus`

|           Key | Type       | Nullable | Default |
| ------------: | ---------- | :------: | ------- |
| **`guildId`** | bigint(20) |    ×     |         |
|  **`userId`** | bigint(20) |    ×     |         |
|     `alltime` | int(11)    |    ×     | 0       |
|        `year` | int(11)    |    ×     | 0       |
|       `month` | int(11)    |    ×     | 0       |
|        `week` | int(11)    |    ×     | 0       |
|         `day` | int(11)    |    ×     | 0       |
|  `changeDate` | bigint(20) |    ×     | 0       |
|     `addDate` | bigint(20) |    ×     | 0       |

**Primary Key**: `guildId`, `userId`

### `guild`

|                                Key | Type          | Nullable | Default    |
| ---------------------------------: | ------------- | :------: | ---------- |
|                      **`guildId`** | bigint(20)    |    ×     |            |
|                          `voteTag` | varchar(56)   |    ×     | "likes"    |
|                        `voteEmote` | varchar(128)  |    ×     | ":heart:"  |
|                         `bonusTag` | varchar(56)   |    ×     | "bonus"    |
|                       `bonusEmote` | varchar(128)  |    ×     | ":trophy:" |
|                   `entriesPerPage` | smallint(6)   |    ×     | 12         |
|                    `showNicknames` | tinyint(4)    |    ×     | false      |
|                           `textXp` | tinyint(4)    |    ×     | true       |
|                          `voiceXp` | tinyint(4)    |    ×     | true       |
|                         `inviteXp` | tinyint(4)    |    ×     | true       |
|                           `voteXp` | tinyint(4)    |    ×     | true       |
|                          `bonusXp` | tinyint(4)    |    ×     | true       |
|                  `notifyLevelupDm` | tinyint(4)    |    ×     | false      |
|      `notifyLevelupCurrentChannel` | tinyint(4)    |    ×     | false      |
|            `notifyLevelupWithRole` | tinyint(4)    |    ×     | true       |
|        `notifyLevelupOnlyWithRole` | tinyint(4)    |    ×     | false      |
| `takeAwayAssignedRolesOnLevelDown` | tinyint(4)    |    ×     | false      |
|                      `levelFactor` | int(11)       |    ×     | 100        |
|              `voteCooldownSeconds` | int(11)       |    ×     | 1800       |
|       `textMessageCooldownSeconds` | smallint(6)   |    ×     | 0          |
|                 `xpPerVoiceMinute` | smallint(6)   |    ×     | 3          |
|                 `xpPerTextMessage` | smallint(6)   |    ×     | 6          |
|                        `xpPerVote` | smallint(6)   |    ×     | 30         |
|                      `xpPerInvite` | smallint(6)   |    ×     | 300        |
|                       `xpPerBonus` | smallint(6)   |    ×     | 1          |
|              `bonusPerTextMessage` | smallint(6)   |    ×     | 6          |
|              `bonusPerVoiceMinute` | smallint(6)   |    ×     | 3          |
|                     `bonusPerVote` | smallint(6)   |    ×     | 30         |
|                   `bonusPerInvite` | smallint(6)   |    ×     | 200        |
|                   `bonusUntilDate` | bigint(20)    |    ×     | 0          |
|                     `reactionVote` | tinyint(4)    |    ×     | false      |
|                     `allowMutedXp` | tinyint(4)    |    ×     | true       |
|                  `allowDeafenedXp` | tinyint(4)    |    ×     | true       |
|                      `allowSoloXp` | tinyint(4)    |    ×     | true       |
|                 `autopost_levelup` | bigint(20)    |    ×     | 0          |
|              `autopost_serverJoin` | bigint(20)    |    ×     | 0          |
|             `autopost_serverLeave` | bigint(20)    |    ×     | 0          |
|                   `levelupMessage` | varchar(2048) |    ×     | ""         |
|                `serverJoinMessage` | varchar(1024) |    ×     | ""         |
|                `roleAssignMessage` | varchar(1024) |    ×     | ""         |
|              `roleDeassignMessage` | varchar(1024) |    ×     | ""         |
|                  `lastCommandDate` | bigint(20)    |    ×     | 0          |
|                         `resetDay` | tinyint(4)    |    ×     | 0          |
|                        `resetHour` | tinyint(4)    |    ×     | 0          |
|                     `joinedAtDate` | bigint(20)    |    ×     | 0          |
|                       `leftAtDate` | bigint(20)    |    ×     | 0          |
|                          `addDate` | bigint(20)    |    ×     | 0          |
|                         `isBanned` | tinyint(4)    |    ×     | false      |
|              `resetDeletedMembers` | tinyint(1)    |    ×     | false      |
|                 `stickyLevelRoles` | tinyint(1)    |    ×     | true       |
|                         `apiToken` | char(64)      |    ☑︎     | NULL       |

**Primary Key**: `guildId`

#### Deprecated / Unused Columns

- `prefix`: Switched to slash commands
- `tokens`, `tokensBurned`, `lastTokenBurnDate`: Switched to Patreon from tokens system
- `allowInvisibleXp`: required Presences intent; took too much bandwidth
- `allowDownvotes`: Disabled to reduce unkind behviour
- `commandOnlyChannel`: Replaced with native behaviour (Integrations menu)
- Others: never implemented

|                            Key | Type          | Nullable | Default |
| -----------------------------: | ------------- | :------: | ------- |
|                       `prefix` | varchar(32)   |    ×     | "ar!"   |
|                       `tokens` | int(11)       |    ×     | 0       |
|                 `tokensBurned` | int(11)       |    ×     | 0       |
|            `lastTokenBurnDate` | bigint(20)    |    ×     | 0       |
|             `allowInvisibleXp` | tinyint(4)    |    ×     | true    |
|               `allowDownvotes` | tinyint(4)    |    ×     | true    |
|           `commandOnlyChannel` | bigint(20)    |    ×     | 0       |
|           `serverLeaveMessage` | varchar(1024) |    ×     | ""      |
|      `voiceChannelJoinMessage` | varchar(512)  |    ×     | ""      |
|     `voiceChannelLeaveMessage` | varchar(512)  |    ×     | ""      |
|    `autopost_voiceChannelJoin` | bigint(20)    |    ×     | 0       |
|   `autopost_voiceChannelLeave` | bigint(20)    |    ×     | 0       |
|      `autoname_totalUserCount` | bigint(20)    |    ×     | 0       |
|     `autoname_onlineUserCount` | bigint(20)    |    ×     | 0       |
|  `autoname_activeUsersLast24h` | bigint(20)    |    ×     | 0       |
|  `autoname_serverJoinsLast24h` | bigint(20)    |    ×     | 0       |
| `autoname_serverLeavesLast24h` | bigint(20)    |    ×     | 0       |

### `guildChannel`

|             Key | Type       | Nullable | Default |
| --------------: | ---------- | :------: | ------- |
|   **`guildId`** | bigint(20) |    ×     |         |
| **`channelId`** | bigint(20) |    ×     |         |
|          `noXp` | tinyint(4) |    ×     | false   |
|     `noCommand` | tinyint(4) |    ×     | false   |

**Primary Key**: `guildId`, `channelId`

### `guildMember`

|               Key | Type       | Nullable | Default |
| ----------------: | ---------- | :------: | ------- |
|     **`guildId`** | bigint(20) |    ×     |         |
|      **`userId`** | bigint(20) |    ×     |         |
| `notifyLevelupDm` | tinyint(4) |    ×     | true    |
|    `reactionVote` | tinyint(4) |    ×     | true    |
|         `inviter` | bigint(20) |    ×     | 0       |
|         `alltime` | int(11)    |    ×     | 0       |
|            `year` | int(11)    |    ×     | 0       |
|           `month` | int(11)    |    ×     | 0       |
|            `week` | int(11)    |    ×     | 0       |
|             `day` | int(11)    |    ×     | 0       |

**Primary Key**: `guildId`, `userId`

#### Deprecated / Unused Columns

|            Key | Type    | Nullable | Default |
| -------------: | ------- | :------: | ------- |
| `tokensBurned` | int(11) |    ×     | 0       |

### `guildRole`

|                Key | Type          | Nullable | Default |
| -----------------: | ------------- | :------: | ------- |
|      **`guildId`** | bigint(20)    |    ×     |         |
|       **`roleId`** | bigint(20)    |    ×     |         |
|      `assignLevel` | int(11)       |    ×     | 0       |
|    `deassignLevel` | int(11)       |    ×     | 0       |
|    `assignMessage` | varchar(1024) |    ×     | ""      |
|  `deassignMessage` | varchar(1024) |    ×     | ""      |
| `xpPerVoiceMinute` | smallint(6)   |    ×     | 0       |
| `xpPerTextMessage` | smallint(6)   |    ×     | 0       |
|        `xpPerVote` | smallint(6)   |    ×     | 0       |
|      `xpPerInvite` | smallint(6)   |    ×     | 0       |
|             `noXp` | tinyint(4)    |    ×     | false   |

**Primary Key**: `guildId`, `roleId`

### `invite`

|           Key | Type       | Nullable | Default |
| ------------: | ---------- | :------: | ------- |
| **`guildId`** | bigint(20) |    ×     |         |
|  **`userId`** | bigint(20) |    ×     |         |
|     `alltime` | int(11)    |    ×     | 0       |
|        `year` | int(11)    |    ×     | 0       |
|       `month` | int(11)    |    ×     | 0       |
|        `week` | int(11)    |    ×     | 0       |
|         `day` | int(11)    |    ×     | 0       |
|  `changeDate` | bigint(20) |    ×     | 0       |
|     `addDate` | bigint(20) |    ×     | 0       |

**Primary Key**: `guildId`, `userId`

### `textMessage`

|             Key | Type       | Nullable | Default |
| --------------: | ---------- | :------: | ------- |
|   **`guildId`** | bigint(20) |    ×     |         |
|    **`userId`** | bigint(20) |    ×     |         |
| **`channelId`** | bigint(20) |    ×     |         |
|       `alltime` | int(11)    |    ×     | 0       |
|          `year` | int(11)    |    ×     | 0       |
|         `month` | int(11)    |    ×     | 0       |
|          `week` | int(11)    |    ×     | 0       |
|           `day` | int(11)    |    ×     | 0       |
|    `changeDate` | bigint(20) |    ×     | 0       |
|       `addDate` | bigint(20) |    ×     | 0       |

**Primary Key**: `guildId`, `userId`, `channelId`

### `user`

|                     Key | Type       | Nullable | Default |
| ----------------------: | ---------- | :------: | ------- |
|            **`userId`** | bigint(20) |    ×     |         |
|        `voteMultiplier` | int(11)    |    ×     | 1       |
|   `voteMultiplierUntil` | bigint(20) |    ×     | 0       |
| `lastAskForPremiumDate` | bigint(20) |    ×     | 0       |
|               `addDate` | bigint(20) |    ×     | 0       |
|              `isBanned` | tinyint(4) |    ×     | false   |
|           `patreonTier` | tinyint(4) |    ×     | 0       |
|  `patreonTierUntilDate` | bigint(20) |    ×     | 0       |
|   `lastTopggUpvoteDate` | bigint(20) |    ×     | 0       |

**Primary Key**: `userId`

#### Deprecated / Unused Columns

|            Key | Type    | Nullable | Default |
| -------------: | ------- | :------: | ------- |
|       `tokens` | int(11) |    ×     | 10      |
| `tokensBought` | int(11) |    ×     | 0       |
| `tokensGifted` | int(11) |    ×     | 0       |

### `voiceMinute`

|             Key | Type       | Nullable | Default |
| --------------: | ---------- | :------: | ------- |
|   **`guildId`** | bigint(20) |    ×     |         |
|    **`userId`** | bigint(20) |    ×     |         |
| **`channelId`** | bigint(20) |    ×     |         |
|       `alltime` | int(11)    |    ×     | 0       |
|          `year` | int(11)    |    ×     | 0       |
|         `month` | int(11)    |    ×     | 0       |
|          `week` | int(11)    |    ×     | 0       |
|           `day` | int(11)    |    ×     | 0       |
|    `changeDate` | bigint(20) |    ×     | 0       |
|       `addDate` | bigint(20) |    ×     | 0       |

**Primary Key**: `guildId`, `userId`, `channelId`

### `vote`

|           Key | Type       | Nullable | Default |
| ------------: | ---------- | :------: | ------- |
| **`guildId`** | bigint(20) |    ×     |         |
|  **`userId`** | bigint(20) |    ×     |         |
|     `alltime` | int(11)    |    ×     | 0       |
|        `year` | int(11)    |    ×     | 0       |
|       `month` | int(11)    |    ×     | 0       |
|        `week` | int(11)    |    ×     | 0       |
|         `day` | int(11)    |    ×     | 0       |
|  `changeDate` | bigint(20) |    ×     | 0       |
|     `addDate` | bigint(20) |    ×     | 0       |

**Primary Key**: `guildId`, `userId`
