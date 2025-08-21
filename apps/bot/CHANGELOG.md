# Changelog

## 7.13.0

### Minor Changes

- [#189](https://github.com/Rapha01/activityRank-bot/pull/189) [`81ddb7a`](https://github.com/Rapha01/activityRank-bot/commit/81ddb7a7b6b783d41cac832e863dee72d69d64a4) Thanks [@piemot](https://github.com/piemot)! - Ask for premium in cooldownUtil

- [#189](https://github.com/Rapha01/activityRank-bot/pull/189) [`6fdca9f`](https://github.com/Rapha01/activityRank-bot/commit/6fdca9f39476903649af582878a7de0867acf5c8) Thanks [@piemot](https://github.com/piemot)! - Improve ask for premium message (directs to Discord Shop as the way to subscribe to servers)

### Patch Changes

- [#187](https://github.com/Rapha01/activityRank-bot/pull/187) [`cec0594`](https://github.com/Rapha01/activityRank-bot/commit/cec059416258d841acaf9834fa68980d486d17b0) Thanks [@piemot](https://github.com/piemot)! - improve reset logging

- [#187](https://github.com/Rapha01/activityRank-bot/pull/187) [`280fbe3`](https://github.com/Rapha01/activityRank-bot/commit/280fbe3c3c0cfd49a56574caaee81a83f6956a8a) Thanks [@piemot](https://github.com/piemot)! - Include Discord entitlement info in /serverinfo

## 7.12.1

### Patch Changes

- [#185](https://github.com/Rapha01/activityRank-bot/pull/185) [`8d33f58`](https://github.com/Rapha01/activityRank-bot/commit/8d33f58ff2c8bbaf32e4309f5b52cfa7a6a875a1) Thanks [@piemot](https://github.com/piemot)! - Rewrite @activityrank/cfg for better error messages and api surface

- Updated dependencies [[`8d33f58`](https://github.com/Rapha01/activityRank-bot/commit/8d33f58ff2c8bbaf32e4309f5b52cfa7a6a875a1)]:
  - @activityrank/cfg@0.2.0

## [7.12.0](https://github.com/Rapha01/activityRank-bot/compare/bot-v7.11.0...bot-v7.12.0) (2025-07-19)

### Features

- add alternate component registry system ([c10dd1a](https://github.com/Rapha01/activityRank-bot/commit/c10dd1a63fc5b187fdff0b51aa5f29d909527870))
- update /rank to use components v2 ([ebbc149](https://github.com/Rapha01/activityRank-bot/commit/ebbc14980c165494b04577256b2aa3a94d658cd1))
- use emoji in /memberinfo ([e7ecfd5](https://github.com/Rapha01/activityRank-bot/commit/e7ecfd54178271e2247e2890bf7bbb359eeddcc3))

## [7.11.0](https://github.com/Rapha01/activityRank-bot/compare/bot-v7.10.0...bot-v7.11.0) (2025-07-18)

### Features

- exempt premium guilds from ads ([3e3c254](https://github.com/Rapha01/activityRank-bot/commit/3e3c25403737ddc0cdaa34b5c22a16bc2769b43d))

### Bug Fixes

- error in docs of helper type ([08083ab](https://github.com/Rapha01/activityRank-bot/commit/08083ab3502003982448466c7e500d5cba2e1bc2))

## [7.10.0](https://github.com/Rapha01/activityRank-bot/compare/bot-v7.9.0...bot-v7.10.0) (2025-07-10)

### Features

- improve /config-messages ui ([f1a837a](https://github.com/Rapha01/activityRank-bot/commit/f1a837a570de089ca9f4cb6201236d1d86bddb6b))
- improve /config-role menu ui ([37a9742](https://github.com/Rapha01/activityRank-bot/commit/37a9742dcfce70c10fe4e4a026c53b32878a8434))
- improve usability of /config-channel ([c74253a](https://github.com/Rapha01/activityRank-bot/commit/c74253a5a865bd4e79410fbfd0724f9d202af034))
- set join notify channel in /config-server ([49a13d5](https://github.com/Rapha01/activityRank-bot/commit/49a13d5a14c38308d6b48639afbf336b8a4af14d))

## [7.9.0](https://github.com/Rapha01/activityRank-bot/compare/bot-v7.8.0...bot-v7.9.0) (2025-07-09)

### Features

- **icons:** add deleted-channel emoji ([2e828d2](https://github.com/Rapha01/activityRank-bot/commit/2e828d2d9435224087dd3398efb687277f700564))
- **icons:** yes and no emoji ([7e39f96](https://github.com/Rapha01/activityRank-bot/commit/7e39f9666fb30aafaa69515c114baca4da5265b0))
- standardise embed colors across the bot ([4b5ddf5](https://github.com/Rapha01/activityRank-bot/commit/4b5ddf51878d32f40be3446a6343a6a9a0bd2663))

### Bug Fixes

- **i18n:** move `pt` to `pt-BR` ([d7594fd](https://github.com/Rapha01/activityRank-bot/commit/d7594fd7cb74340e3f3bbc8af7c8c8bdec58ab9c))
- **style:** standardise embed colors ([305a76e](https://github.com/Rapha01/activityRank-bot/commit/305a76e1be5d22b16295dfefe79889dacce79634))

## [7.8.0](https://github.com/Rapha01/activityRank-bot/compare/bot-v7.7.1...bot-v7.8.0) (2025-06-18)

### Features

- allow resetting settings of a deleted role ([fdb61c3](https://github.com/Rapha01/activityRank-bot/commit/fdb61c3a78101e6dbd5eb52523cbc1982bdfb47e))

### Bug Fixes

- reduce risk of uncaught errors with eval ([de30c07](https://github.com/Rapha01/activityRank-bot/commit/de30c076dfe3a6f82b9c3621f1b53471a50913ed))

## [7.7.1](https://github.com/Rapha01/activityRank-bot/compare/bot-v7.7.0...bot-v7.7.1) (2025-05-19)

### Bug Fixes

- errors with getting rank of empty members ([419c5f2](https://github.com/Rapha01/activityRank-bot/commit/419c5f287dbb488ca544ee25ca7811a91e0a5931))
- errors with getting rank of empty members ([e554f75](https://github.com/Rapha01/activityRank-bot/commit/e554f75eb682aabaf4ba32ac6bada8d802f740f5))

## [7.7.0](https://github.com/Rapha01/activityRank-bot/compare/bot/v7.6.1...bot-v7.7.0) (2025-05-16)

### Features

- add /update-roles metadata ([f1a8632](https://github.com/Rapha01/activityRank-bot/commit/f1a8632423ad466e7144be4b7998ba697714abf4))
- update-roles command ([d996dc3](https://github.com/Rapha01/activityRank-bot/commit/d996dc31054e2ef588d6f48c1a5c547ae33d94af))

### Bug Fixes

- inactive members showing rank [#1](https://github.com/Rapha01/activityRank-bot/issues/1) ([34ebbcf](https://github.com/Rapha01/activityRank-bot/commit/34ebbcfb405f47295462bd4f82da31d56dce2ee4))
- incorrect arguments -&gt; rounding errors ([d27e79d](https://github.com/Rapha01/activityRank-bot/commit/d27e79dfa65ca474ff582d2afafdeb2c982a42e4))
- streamline /config-role levels ([5e1eb32](https://github.com/Rapha01/activityRank-bot/commit/5e1eb32893fcd93acf99710c480c5d84b5e3c4ab))
- updated rank queries ([3e649b3](https://github.com/Rapha01/activityRank-bot/commit/3e649b362e477827c4c0716e2daf74f1fe1f225c))
