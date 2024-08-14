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

- [x] Add `alltime`, `year`, `month`, `week`, and `day` columns to the `dbShard`.`guildMember` table.

> [!IMPORTANT]
> The following actions need to be rolled out slowly,
> to ensure that there are no unforseen infrastructure limitations.

- [ ] on 10% of guilds:

  - [x] Allow the bot to add XP to the `guildMember` columns, in addition to the statistic tables.
  - [ ] Run a migration to ensure that XP in `guildMember` columns is equivalent
        to the calculated value from the statistic tables: otherwise, the XP would
        only be counted from the day the bot began using the `guildMember` table.

- [ ] on 25% of guilds:

  - [ ] Enable adding XP to the `guildMember` columns.
  - [ ] Run the migration to sync the `guildMember` and statistic tables.

- [ ] on 50% of guilds:

  - [ ] Enable adding XP to the `guildMember` columns.
  - [ ] Run the migration to sync the `guildMember` and statistic tables.

- [ ] on 100% of guilds:

  - [ ] Enable adding XP to the `guildMember` columns.
  - [ ] Run the migration to sync the `guildMember` and statistic tables.

- [ ] Parallel to the above step, on servers where XP is added to the `guildMember` columns,
      ensure that resets of statistics also affect the `guildMember` columns.
      Separating resets of statistics from those of XP is out of the scope of this step.

- [ ] Periodically, verify that calculated XP and XP stored in
      the `guildMember` columns are identical on a random subset of guilds.

- [ ] Begin displaying XP from the `guildMember` columns instead of
      calculating it from statistics. **This should likely be executed incrementally.**

- [ ] Separate the options to reset statistics and XP.

## replace-vars

`replace-vars` is a script that allows running SQL files while validating their required args. It can be run as so:

```sh
$ ./migration/replace-vars.mjs filename.sql arg1="a" arg2="b c d" | mysql -h 127.0.0.1 -u activityrank -pPASSWORD > result.tsv
```

### Directly running a script

For instance, to run [get-calculated-value](./get-calculated-value.sql) into a `.tsv` file (tab-separated values), a command might be:

```sh
./migration/replace-vars.mjs migration/get-calculated-value.sql guildId='"905898879785005106"' userId='"774660568728469585"' | \
mysql -h 127.0.0.1 -u activityrank -pPASSWORD > \
migration/result.tsv
```

### Preparing a script

To compile a script into a file that could be run with the `mysql` tool (via `\. <scriptpath>`), you could use the command:

```sh
./migration/replace-vars.mjs migration/guild-migrate-statxp-memberxp.sql guildId='"905898879785005106"' > migration/migrate.sql
```

```sh
mysql> \. ./migration/migrate.sql
```

## migrate-set

`migrate-set` is a tool to incrementally run the `guild-migrate-statxp-memberxp-condensed`
script - which is a condensed version of the
[`guild-migrate-statxp-memberxp.sql`](./guild-migrate-statxp-memberxp.sql) file.

The `HOST` environment variable is required, and should be set to the target database host.
All other credentials are fetched from the `'production'` segment of the [keys.json file](../config/keys.example.json).

It writes a log of its actions to [`migrate-set.log`](./migrate-set.log), in the format `{guild id} {affected rows} {changed rows}`.
It writes to STDOUT after every 1000 guilds processed.
