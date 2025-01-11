<!-- markdownlint-disable-file MD033 -->
<!-- markdownlint-disable-next-line MD041 -->
<div align="center">

![ActivityRank Wordmark](https://raw.githubusercontent.com/activityrankbot/assets/main/banners/wordmark.png)

# ActivityRank Monorepo

[![Latest Release](https://img.shields.io/github/v/release/Rapha01/activityRank-bot?style=for-the-badge)](https://github.com/Rapha01/activityRank-bot/releases)
[![License](https://img.shields.io/github/license/Rapha01/activityRank-bot?style=for-the-badge)](https://github.com/Rapha01/activityRank-bot/blob/main/LICENSE.txt)
[![Support Server](https://img.shields.io/discord/534598374985302027?style=for-the-badge&logo=discord&label=support%20server&link=https%3A%2F%2Factivityrank.me/support)](https://activityrank.me/support)

</div>

This repository houses the core components of [ActivityRank](https://activityrank.me), including:

* The ActivityRank Bot for Discord
* The Manager Service responsible for routing database shard queries and managing webhooks
* The ActivityRank Website

---

## Description

ActivityRank is a Discord bot focusing on flexible statistics and ranking.
It is sharded and capable of running in a distributed form across multiple servers.
This repository contains the source code for the ActivityRank Discord Bot,
the Manager service, and the ActivityRank Website.
It allows all components to be developed, deployed, and maintained in a unified manner.

## Getting Started

> [!IMPORTANT]
> If you only want to use the bot, invite it to your Discord server with [this link.](https://activityrank.me/invite)

### Prerequisites

Before you start developing, make sure you have the following installed:

* Node.js (v20.x or higher recommended)
* Pnpm
* Docker (optional, for containerized deployment)

### Setting Up the Project

1. Clone the repository:

    ```sh
    git clone https://github.com/Rapha01/activityRank-bot.git activityrank
    cd activityrank
    ```

2. Install dependencies:

    ```sh
    pnpm install
    ```

    This will install dependencies for all packages within the monorepo, thanks to pnpm Workspaces.

3. Configure your environment:

    The [config](config) folder hosts configuration files for the various apps in the monorepo.
    If you're using VSCode or another editor with a JSON Schema plug-in, these files will highlight potential errors.

### Running the Services

You can run all the services (bot, manager, and website) individually, or spin up everything at once using Docker or pnpm scripts. It is strongly recommended that you run at least the database via Docker.

#### Running with Docker

Build and run the database using Docker:

```sh
docker compose up db
```

Build and run the database and manager using Docker:

```sh
docker compose up db manager
```

Build and run the database, manager, and bot using Docker:

```sh
docker compose up db manager bot
```

This will build and start all the services listed - which are defined in the [docker-compose.yml](docker-compose.yml) file.

#### Running Individually

1. Ensure a valid MySQL connection is available and configured.
2. Start the manager:

    ```sh
    pnpm --filter=@activityrank/manager run start
    ```

3. Start the bot:

    ```sh
    pnpm --filter=@activityrank/bot run start
    ```

## Contributing

We welcome contributions! If you’d like to contribute, follow these steps:

1. Fork the repository and clone it to your local machine.
2. Make your changes in a separate branch.
3. Run tests and linting to ensure your code is in good shape.
4. Create a pull request with a clear explanation of what you’ve changed.

For large changes, it's a good idea to discuss them first by opening an issue.

Feel free to contact a maintainer on Discord -
send a message request to [`@piemot`](https://discord.com/users/270273690074087427)
or ask around in the [support server](https://activityrank.me/support).

## License

This project is licensed under the AGPL v3.0 License - see the [LICENSE](LICENSE.txt) file for details.
