# Changelog

## 0.5.1

### Patch Changes

- [#215](https://github.com/Rapha01/activityRank-bot/pull/215) [`578e7d5`](https://github.com/Rapha01/activityRank-bot/commit/578e7d547b577d4216bcf4168b0935253ab44d54) Thanks [@piemot](https://github.com/piemot)! - fix shared-guilds requests being sent per-shard

## 0.5.0

### Minor Changes

- [#214](https://github.com/Rapha01/activityRank-bot/pull/214) [`75619de`](https://github.com/Rapha01/activityRank-bot/commit/75619de5cdbc3a8c00cb39c7f6c1163639e4aa01) Thanks [@piemot](https://github.com/piemot)! - Remove legacy /texts and /stats routes

### Patch Changes

- [#212](https://github.com/Rapha01/activityRank-bot/pull/212) [`f706359`](https://github.com/Rapha01/activityRank-bot/commit/f706359dc6c86e5673c63ac0764274834bace57f) Thanks [@piemot](https://github.com/piemot)! - Use Patreon tier IDs for rewards

- [#214](https://github.com/Rapha01/activityRank-bot/pull/214) [`6e05ae1`](https://github.com/Rapha01/activityRank-bot/commit/6e05ae1e5dbf252e696295d76b529166f5b2f367) Thanks [@piemot](https://github.com/piemot)! - Require authentication when accessing the bot API

- Updated dependencies [[`b35e729`](https://github.com/Rapha01/activityRank-bot/commit/b35e7291d29c04651acc81b73ce7420bcbd12568), [`f706359`](https://github.com/Rapha01/activityRank-bot/commit/f706359dc6c86e5673c63ac0764274834bace57f)]:
  - @activityrank/database@0.3.0
  - @activityrank/cfg@0.4.1

## 0.4.2

### Patch Changes

- [`20110c0`](https://github.com/Rapha01/activityRank-bot/commit/20110c012d41f1bf0388687157a3aa437d1d8826) Thanks [@piemot](https://github.com/piemot)! -

## 0.4.1

### Patch Changes

- [#209](https://github.com/Rapha01/activityRank-bot/pull/209) [`b6770ab`](https://github.com/Rapha01/activityRank-bot/commit/b6770abd8085e150556d9bf433d995941ae45d6e) Thanks [@piemot](https://github.com/piemot)! - Replace /broadcast internal route with /shared-guilds

- [#210](https://github.com/Rapha01/activityRank-bot/pull/210) [`31c8f1e`](https://github.com/Rapha01/activityRank-bot/commit/31c8f1ee23455e83c5c166d9b0202b177ba471fb) Thanks [@piemot](https://github.com/piemot)! - Allow Public API users to add/remove bonus XP

## 0.4.0

### Minor Changes

- [#205](https://github.com/Rapha01/activityRank-bot/pull/205) [`197d0dc`](https://github.com/Rapha01/activityRank-bot/commit/197d0dc06369760b973374fc0c39ea9ceb666b47) Thanks [@piemot](https://github.com/piemot)! - Allow manager to request data from bot instances via HTTP

## 0.3.11

### Patch Changes

- [#195](https://github.com/Rapha01/activityRank-bot/pull/195) [`9941b85`](https://github.com/Rapha01/activityRank-bot/commit/9941b853907f8f0e65a7fa945b4010c3d413a38a) Thanks [@piemot](https://github.com/piemot)! - Use .ts file extensions instead of .js

- Updated dependencies [[`aab152e`](https://github.com/Rapha01/activityRank-bot/commit/aab152ebcc4ba9516411085bed8abb0b59b0ed6c), [`9941b85`](https://github.com/Rapha01/activityRank-bot/commit/9941b853907f8f0e65a7fa945b4010c3d413a38a)]:
  - @activityrank/database@0.2.0
  - @activityrank/cfg@0.4.0

## 0.3.10

### Patch Changes

- [`96f1dd7`](https://github.com/Rapha01/activityRank-bot/commit/96f1dd77ff40167a3e09e986a6bc039f27843165) Thanks [@piemot](https://github.com/piemot)! - Update tsconfig for direct transpilation

- Updated dependencies [[`96f1dd7`](https://github.com/Rapha01/activityRank-bot/commit/96f1dd77ff40167a3e09e986a6bc039f27843165)]:
  - @activityrank/cfg@0.3.1
  - @activityrank/database@0.1.2

## 0.3.9

### Patch Changes

- [#190](https://github.com/Rapha01/activityRank-bot/pull/190) [`954f84b`](https://github.com/Rapha01/activityRank-bot/commit/954f84b06d45759d620e90d3403dda18b92d264e) Thanks [@piemot](https://github.com/piemot)! - Update kysely

- [#190](https://github.com/Rapha01/activityRank-bot/pull/190) [`3eef231`](https://github.com/Rapha01/activityRank-bot/commit/3eef231cd4f479ac210cce3695b741061fd3b1b4) Thanks [@piemot](https://github.com/piemot)! - Update dependencies

- Updated dependencies [[`9c7b93d`](https://github.com/Rapha01/activityRank-bot/commit/9c7b93d214929818e9fa05c3d279b5252b46a333), [`bd1a7eb`](https://github.com/Rapha01/activityRank-bot/commit/bd1a7eb684c338a13c5b0506b73d7140d8aa1909), [`954f84b`](https://github.com/Rapha01/activityRank-bot/commit/954f84b06d45759d620e90d3403dda18b92d264e), [`3eef231`](https://github.com/Rapha01/activityRank-bot/commit/3eef231cd4f479ac210cce3695b741061fd3b1b4)]:
  - @activityrank/cfg@0.3.0
  - @activityrank/database@0.1.1

## 0.3.8

### Patch Changes

- [#185](https://github.com/Rapha01/activityRank-bot/pull/185) [`8d33f58`](https://github.com/Rapha01/activityRank-bot/commit/8d33f58ff2c8bbaf32e4309f5b52cfa7a6a875a1) Thanks [@piemot](https://github.com/piemot)! - Rewrite @activityrank/cfg for better error messages and api surface

- Updated dependencies [[`8d33f58`](https://github.com/Rapha01/activityRank-bot/commit/8d33f58ff2c8bbaf32e4309f5b52cfa7a6a875a1)]:
  - @activityrank/cfg@0.2.0

## [0.3.7](https://github.com/Rapha01/activityRank-bot/compare/api-v0.3.6...api-v0.3.7) (2025-07-31)

### Bug Fixes

- incorrect Patreon API schemas ([3ece66f](https://github.com/Rapha01/activityRank-bot/commit/3ece66f2120d9cce9d4f8d24d909f553d480dbaa))

## [0.3.6](https://github.com/Rapha01/activityRank-bot/compare/api-v0.3.5...api-v0.3.6) (2025-07-25)

### Bug Fixes

- incorrect routes ([50000b0](https://github.com/Rapha01/activityRank-bot/commit/50000b0c57a4a088dcdf90037754a9afd9c6846f))

## [0.3.5](https://github.com/Rapha01/activityRank-bot/compare/api-v0.3.4...api-v0.3.5) (2025-07-25)

### Bug Fixes

- API reports the correct version ([8f1e4a3](https://github.com/Rapha01/activityRank-bot/commit/8f1e4a3f6710c3cc5cc5e49effa9a07f3cb74f0c))

## [0.3.4](https://github.com/Rapha01/activityRank-bot/compare/api/v0.3.3...api-v0.3.4) (2025-07-24)

### Features

- improve organization of api ([1212421](https://github.com/Rapha01/activityRank-bot/commit/121242142510871b2cce244431c1f012d96454e5))
- migrate manager features ([352c633](https://github.com/Rapha01/activityRank-bot/commit/352c633865939434de87374dc238579e39da3587))
