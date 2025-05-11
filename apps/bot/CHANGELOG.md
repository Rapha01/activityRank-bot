# Bot Changelog

All notable changes to this project will be documented in this file.

# [@actvityrank/bot@7.5.0](https://github.com/rapha01/activityRank-bot/compare/v6.1.0...@actvityrank/bot@7.5.0) - (2025-03-01)

## <!-- 1 -->🚀 Features

- Allow disabling levelroles on rejoin ([a05f1bd](https://github.com/rapha01/activityRank-bot/commit/a05f1bd82a3d43c67cd2d339d12b4b25b54305bb))
- **patreon:** Increase xp-per roles for Patreons ([75d725f](https://github.com/rapha01/activityRank-bot/commit/75d725f299b9f12b87ab98804eba3af97ec3d5d1))
- Produce API keys as a bot command ([04ce73e](https://github.com/rapha01/activityRank-bot/commit/04ce73e55519a66c4bffbb29d96f5b58db333c54))
- Add i18next ([8330286](https://github.com/rapha01/activityRank-bot/commit/8330286c90ce19e8d0825ee88b3e6d30190bacc5))
- Create commands generator ([c53724d](https://github.com/rapha01/activityRank-bot/commit/c53724d09f61492eedfb6337bdc9d8e8f5d1c550))
- Make TFunction available to commands ([d7717da](https://github.com/rapha01/activityRank-bot/commit/d7717da88ec0226ade4662acd99b3cefa68c8581))
- Translate /ping ([26ec326](https://github.com/rapha01/activityRank-bot/commit/26ec3262c2d866420f238265ce360ad179ac7458))
- Translate /bonus commands ([1e66edc](https://github.com/rapha01/activityRank-bot/commit/1e66edc1e1647b3365a58e3b97bd022c6aafd046))
- Provide TFunction to components ([96e7c53](https://github.com/rapha01/activityRank-bot/commit/96e7c53ecc7e38741883a0aa9e0e30fcadaa59c8))
- Translate simple config commands ([28e683f](https://github.com/rapha01/activityRank-bot/commit/28e683f26514307979a56f7a31377229a0f6d2b4))
- Provide t fn to autocompletes ([acaee8f](https://github.com/rapha01/activityRank-bot/commit/acaee8f33e248ddf214dda1d82e7cea8fb31afc0))
- Translate commands & add intl polyfills ([0378471](https://github.com/rapha01/activityRank-bot/commit/0378471913c46bdee8accc0ca23e8cd663d0e8f7))
- Command translations ([870eda7](https://github.com/rapha01/activityRank-bot/commit/870eda7d49a9ae3df7476895083a4418fb02e412))
- Translate reset commands ([9926844](https://github.com/rapha01/activityRank-bot/commit/992684481ed220221393146917081adf36dfe9dc))
- Allow announcement channels to be configured ([26bcd87](https://github.com/rapha01/activityRank-bot/commit/26bcd8732bb67b0995660ad4019891476609f5c4))
- /reset server members ([aac0b30](https://github.com/rapha01/activityRank-bot/commit/aac0b3081e7301505b80480a72d8e329b79a8809))
- **api:** UserId/rank route ([fd30203](https://github.com/rapha01/activityRank-bot/commit/fd30203f28f60f8c209da8aa1cfb3186a865d153))
- **all:** Use Knope for versioning ([06809f1](https://github.com/rapha01/activityRank-bot/commit/06809f1a67252d8d671054014556d6bb77a95871))
- Changelog workflow ([f60a39e](https://github.com/rapha01/activityRank-bot/commit/f60a39e563b2405451601aa54303a8cd741f6585))

## <!-- 2 -->🐛 Bug Fixes

- Subpath imports ([c1c781e](https://github.com/rapha01/activityRank-bot/commit/c1c781e5817bd1392677e28233df9fef8104b448))
- Swc preserve input assertions ([ad1f54e](https://github.com/rapha01/activityRank-bot/commit/ad1f54e7214e6c5fc43c68a47ddbc2fc319a3f2d))
- Ts autocomplete for path aliases ([aa2b635](https://github.com/rapha01/activityRank-bot/commit/aa2b63565dcce2f2b8d12dfcbba6f2e880427164))
- **ci:** Move linting workflow off of prettier ([7f30338](https://github.com/rapha01/activityRank-bot/commit/7f303385c718cb9a69048c762302c6ad2274b0a0))
- Derive from tsconfig.app.json ([a4ad27c](https://github.com/rapha01/activityRank-bot/commit/a4ad27c92cf84dbe75ebf8dff7a792ad99130c7a))
- Docker dependency management ([2b9d9fd](https://github.com/rapha01/activityRank-bot/commit/2b9d9fdee8198cc34a1efb511718c894522fd4be))
- Path to shard bot ([38fb4e5](https://github.com/rapha01/activityRank-bot/commit/38fb4e5fb9c26a5d3710d6bc0683ae5ed4202c08))
- Updating 5th xp-per role ([860e28d](https://github.com/rapha01/activityRank-bot/commit/860e28dc7e840f1f3402de8335068cd1b9bb8e85))
- Command and event paths ([9e93a18](https://github.com/rapha01/activityRank-bot/commit/9e93a18fd5bc5e6b6b75b4f319e726d7bbd16530))
- Import path ([9087224](https://github.com/rapha01/activityRank-bot/commit/9087224976091f2616da4dda888450aa8baa378d))
- Duplicate welcome message ([2136bfd](https://github.com/rapha01/activityRank-bot/commit/2136bfd2b8cc8f4f516335fd1d335e6a89f6d406))
- Exit manager on SIGINT/SIGTERM ([a4673fe](https://github.com/rapha01/activityRank-bot/commit/a4673fec41c71b08622a38bef70907941d23789b))
- Dev config path ([b532bce](https://github.com/rapha01/activityRank-bot/commit/b532bceba1238c0a30e70557cb3cb3e5a4f791c7))
- Invalid import ([02156d4](https://github.com/rapha01/activityRank-bot/commit/02156d4c8516916a172c72c646b0480f250b0146))
- Validate i18n namespaces ([540f7c4](https://github.com/rapha01/activityRank-bot/commit/540f7c431df61c9c4d9f60f91aa052bebdfc5e1d))
- Complete command-descriptions ([e83e891](https://github.com/rapha01/activityRank-bot/commit/e83e8911aad00feccb122ed54ec76b891e36ab46))
- Corepack downstream bug ([d916729](https://github.com/rapha01/activityRank-bot/commit/d9167295f9b61fa0e09c08676e096865c066e7ac))
- Merge conflict ([d6f0211](https://github.com/rapha01/activityRank-bot/commit/d6f02110c68e0434d5fed7eb83af82738ba5e211))
- Unsynced commands ([2b26ade](https://github.com/rapha01/activityRank-bot/commit/2b26aded5af723d60a01279515b07294660177aa))
- Command errors ([5a9fdd1](https://github.com/rapha01/activityRank-bot/commit/5a9fdd1e999a66a746299a56523f9f300e718575))
- **bot:** Allow announcement channels to be autosends ([f82fe96](https://github.com/rapha01/activityRank-bot/commit/f82fe9669cd7b059382fffc31d74bb5e5bbbde57))

## <!-- 5 -->🏠 Refactor

- **monorepo:** Move bot code into apps/bot ([a70c032](https://github.com/rapha01/activityRank-bot/commit/a70c032598e62a58e4c120f686fa5b01a7ce75de))
- **monorepo:** Use pnpm for packages ([4871cdf](https://github.com/rapha01/activityRank-bot/commit/4871cdfa5b958614ea5ff1107faf050cbf588682))
- **monorepo:** Move more bot files ([8ee3dea](https://github.com/rapha01/activityRank-bot/commit/8ee3deaea63495fff522063e0e57f3bfd5e419c0))
- **monorepo:** Move tsconfig to packages ([e10726b](https://github.com/rapha01/activityRank-bot/commit/e10726bd0572f9c687c99b9f2e186af15643ea61))
- Use native subpath imports ([9550dbe](https://github.com/rapha01/activityRank-bot/commit/9550dbe21e3b63f61864572941ce8e2a5db6cedf))
- Use env variables for config paths ([59e1228](https://github.com/rapha01/activityRank-bot/commit/59e122870481c9273e72036a30a283ab15f3386f))
- Use @activityrank/cfg for config in bot ([5c39556](https://github.com/rapha01/activityRank-bot/commit/5c39556027fe8c73073334d50c4e000f7f9819a7))
- Use activityrank/database for db manager ([7fd9236](https://github.com/rapha01/activityRank-bot/commit/7fd92360bcb1371516c351eb52a110db120caea2))
- Use @activityrank/database for shard db ([ca265ba](https://github.com/rapha01/activityRank-bot/commit/ca265bad8b4ec86506745b4a7a752c0698c13cd1))
- Use activityrank/database schema types ([c643437](https://github.com/rapha01/activityRank-bot/commit/c643437e9074edd31eb376bd1df95080cc49bb68))
- Rewrite @activityrank/cli ([3aa2543](https://github.com/rapha01/activityRank-bot/commit/3aa25439eaf0a0811a7813bc3474345417330d15))
- Migrate nested commands to new system ([6ac56ee](https://github.com/rapha01/activityRank-bot/commit/6ac56ee2e229d5d324678f2990c351f93581c9e1))
- Migrate admin commands ([f4d944a](https://github.com/rapha01/activityRank-bot/commit/f4d944a870f58e9b0dc6e6c35216fffdb6136d59))
- Update registry ([451bffd](https://github.com/rapha01/activityRank-bot/commit/451bffd9d0a9f833824129036e6dce5ca2e23590))

## <!-- 7 -->⚙️ Other

- **monorepo:** Improve bot Dockerfile ([5b56401](https://github.com/rapha01/activityRank-bot/commit/5b564015bc76792109716a2fb3294a141724d45f))
- Update manager tsconfig ([4e04a0f](https://github.com/rapha01/activityRank-bot/commit/4e04a0ffd75658851c27510cb5f7d2537f40b0af))
- Start migrating to biome ([c2c0275](https://github.com/rapha01/activityRank-bot/commit/c2c0275d2474a388a2649a47f82f32cd41ab72d6))
- Run Biome lints ([7f7965a](https://github.com/rapha01/activityRank-bot/commit/7f7965a994e37563653b15213f4f598734ef34a0))
- Run biome format ([9479175](https://github.com/rapha01/activityRank-bot/commit/9479175bcb00d93462cd279ae17d7ec4d68c0ffe))
- Bump versions ([d9033a4](https://github.com/rapha01/activityRank-bot/commit/d9033a408008f4c7fbef6e6bc1b9cf48e4ba8e71))
- Remove unused typings ([1df722c](https://github.com/rapha01/activityRank-bot/commit/1df722ce4fac8b10f2f11646fae4bb9b4b3665bb))
- Document the Command class ([63ef867](https://github.com/rapha01/activityRank-bot/commit/63ef867e264b060cde937f6643e72a65ebb7b193))
- Migrate most basic commands ([878bc85](https://github.com/rapha01/activityRank-bot/commit/878bc85a8e3f21eabe93579c39034a3a4acbbd9b))
- **regression:** Remove /debug and /debug-guild ([b76fe57](https://github.com/rapha01/activityRank-bot/commit/b76fe57253f003236e166d409980de337a19338d))
- Update accent translations ([b3b4f2e](https://github.com/rapha01/activityRank-bot/commit/b3b4f2eb4f4e02bc622dc85242a09a2a8ad6e11c))
- Prepare releases ([a8e7a09](https://github.com/rapha01/activityRank-bot/commit/a8e7a095981243a9a40530269ee44edd1fbd31e5))
- Move to cliff-jumper ([dbb6048](https://github.com/rapha01/activityRank-bot/commit/dbb604891ab1077217c3868fa43ff099e89a5674))

## Hotfix

- Command name bug ([22955fb](https://github.com/rapha01/activityRank-bot/commit/22955fb6b9376b8f23ba70bb1a0474573af07a69))
- Option handling ([c874ace](https://github.com/rapha01/activityRank-bot/commit/c874ace2333de2bb337bfd4a4479bf562f7f4407))

## Merge

- Migrate to a monorepo (#123) ([3848145](https://github.com/rapha01/activityRank-bot/commit/38481459ff6495d40d02b4009643d00234f33965)) ([#123](https://github.com/rapha01/activityRank-bot/pull/123))

## Style

- Resolve lint/suspicious/noDoubleEquals ([4f4eb7a](https://github.com/rapha01/activityRank-bot/commit/4f4eb7adcade0147f3b20734398b73a96f571c80))
- Fix most remaining lints ([ffaef74](https://github.com/rapha01/activityRank-bot/commit/ffaef740ef07c67913f3ed96d8d412a9b61d265b))
- Fmt ([4637044](https://github.com/rapha01/activityRank-bot/commit/46370445268df17b9177851f416eeb866ee0425b))

# [@actvityrank/bot@7.7.0](https://github.com/rapha01/activityRank-bot/compare/manager/v7.1.2...@actvityrank/bot@7.7.0) - (2025-03-01)

## <!-- 1 -->🚀 Features

- **all:** Use Knope for versioning ([06809f1](https://github.com/rapha01/activityRank-bot/commit/06809f1a67252d8d671054014556d6bb77a95871))

## <!-- 2 -->🐛 Bug Fixes

- **bot:** Allow announcement channels to be autosends ([f82fe96](https://github.com/rapha01/activityRank-bot/commit/f82fe9669cd7b059382fffc31d74bb5e5bbbde57))

## <!-- 7 -->⚙️ Other

- Prepare releases ([a8e7a09](https://github.com/rapha01/activityRank-bot/commit/a8e7a095981243a9a40530269ee44edd1fbd31e5))
