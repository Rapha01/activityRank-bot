# Migration to separated XP and Statistics

Separating XP and Statistics requires a fairly involved migration process, documented here.

## Goals

The separation project is necessary to implement per- role or channel XP boosts, among other features.
The existing `bonus`, `invite`, `textMessage`, and `voiceMinute` tables will remain,
but XP will not be tied to their values in any way.
Instead, the `alltime`, `year`, `month`, `week`, and `day` columns of the `guildMember` table will be used directly.

During timed resets, columns of the `guildMember` table will now need to be reset,
as well as the appropriate columns of the statistic tables.

XP and statistics may be reset independently.

## Todo

- [x] Add `alltime`, `year`, `month`, `week`, and `day` columns to the `dbShard`.`guildMember` table
- [ ] Begin attributing XP to the `guildMember` columns.<br/>**This should be executed incrementally:**
  - [x] on 10% of servers
  - [ ] on 25% of servers
  - [ ] on 50% of servers
  - [ ] on all servers
- [ ] On servers where XP is added to the `guildMember` columns,
      ensure that resets of statistics also affect the `guildMember` columns.
      At a later date, resets of statistics should be separated from resets of XP.
- [ ] Verify that calculated XP and XP stored in the `guildMember` columns are identical.
- [ ] Begin displaying XP from the `guildMember` columns instead of calculating it from statistics. **This should be executed incrementally.**
