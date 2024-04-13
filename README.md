<div align="center">

![ActivityRank Wordmark](https://raw.githubusercontent.com/activityrankbot/assets/main/banners/wordmark.png)

# ActivityRank Manager

**The management module powering the ActivityRank Bot**

<!-- [![Latest Release](https://img.shields.io/github/v/release/Rapha01/activityRank-manager?style=for-the-badge)](https://github.com/Rapha01/activityRank-manager/releases) -->

[![License](https://img.shields.io/github/license/Rapha01/activityRank-manager?style=for-the-badge)](https://github.com/Rapha01/activityRank-manager/blob/main/LICENSE.txt)
[![Support Server](https://img.shields.io/discord/534598374985302027?style=for-the-badge&logo=discord&label=support%20server&link=https%3A%2F%2Factivityrank.me/support)](https://activityrank.me/support)

</div>

---

## Description

ActivityRank is a Discord bot focusing on flexible statistics and ranking.
This repository hosts the source code for the manager that enables higher-level management,
such as handling webhooks and routing shard queries.

The bot can be invited using [this link.](https://activityrank.me/invite)

## See Also:

### [Bot](https://github.com/Linck01/activityRank-bot)

Sharded bot capable of running in a distributed form across multiple servers.

### [Website](https://github.com/activityrankbot/website)

Website with features, commands and patchnotes for the bot.

## Contributors

Thank you for deciding to contribute! Pull requests are welcome.
For major changes, please open an issue first to discuss what you would like to change.

### Running with Docker

We use Docker to run the manager in production.

```sh
$ docker build -t activityrank/manager:dev .
$ docker run -p3005:3000 --init --name activityrank.manager activityrank/manager:dev
```

Alternatively, use the provided `docker compose` script with `docker compose up`.

If not running via Compose, remember to provide an appropriate mysql connection.
