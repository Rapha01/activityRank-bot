# @activityrank/database

A package providing a [Kysely](https://kysely.dev) database interface and
TypeScript typings to the other parts of the bot.

Also holds the [migration history](./migrations) (since 2025) and [current database schemas](./schemas).

## Directories

- [schemas](./schemas) contains the schemas of the databases that should be currently active.
  These files are meant to stay up-to-date with changes made to the database.
  - The root level contains Markdown files documenting the current state of the schemas.
  - The [schemas/full](./schemas/full) directory hosts SQL files appropriate to build an
    entirely new version of an active production database.
  - The [schemas/stripped](./schemas/stripped) files instead host database schemas without 
    unused tables and sometimes columns.
  - Both `schemas/full` and `schemas/stripped` must work with reasonably recent versions of all ActivityRank apps.
- [migrations](./migrations) contains the history of updates made to the database.
- [src/typings](./src/typings) contains Kysely typings, which should be similar to the schemas
  described in [schemas/stripped](./schemas/stripped).
