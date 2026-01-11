---
"@activityrank/database": minor
---

- Swap a `mediumint` column to the standard `int`
- Use `smallint` for `dbShard` ids (`dbShard(id)` is referenced in `guildRoute` and `userRoute` by `smallint`s anyways)
