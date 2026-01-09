# Contributors' Guide

Thank you for your interest in contributing to ActivityRank! Here's some information to get you started.

## Repostory Layout

ActivityRank is set up as a monorepo, with all executable components in [apps](apps).

```
apps
|   Each of these can (and should) 
|   be hosted and ran separately.
├── api/
│   |   The public API and the manager.
│   |   There should be only one of these hosted.
├── bot/
│   |   The main processes of the bot.
├── cli/
│   |   Internal tools for managing the bot.
└── web/
    |   The source code for https://activityrank.me.
```

## Getting Started

In production, all components should be part of a Docker container as we tend to deploy them to VPSs. These images are build in [GitHub CI](.github/workflows/ci.yml).

In development, an actively-developed app should probably be run via a `pnpm run dev` script. More permanent elements, like the reverse proxy or database, should be run as local Docker instances.

### Database

On first startup, the database will be created. It will output a root password to stdout. 
If you will need root access (to manage user accounts, etc.), run 
```sh
docker compose up db | grep "GENERATED ROOT PASSWORD"
```
The database also creates an `activityrank` user by default with the password `PASSWORD`.

Once the database is launched, migrations can be ran. The SQL files in 
[`packages/database/schemas/full`](./packages/database/schemas/full) should 
contain the end-result of the migrations, but if migration steps are necessary,
[`packages/database/migrations`](./packages/database/migrations) can be ran one at a time instead.

To run the files from `schemas/full`, run
```sh
mysql -h 127.0.0.1 -u activityrank -p -e "CREATE DATABASE `manager`"
mysql -h 127.0.0.1 -u activityrank -p manager < packages/database/schemas/full/manager.sql
mysql -h 127.0.0.1 -u activityrank -p -e "CREATE DATABASE `dbShard`"
mysql -h 127.0.0.1 -u activityrank -p dbShard < packages/database/schemas/full/shard.sql
```

The manager database contains a table called `dbShard`. 
This table represents a list of the hosts where shard databases live.
To initialise it for development (where the default shard is run on localhost), run 

```sql
INSERT INTO `manager`.`dbShard` (id, host) VALUES (0, localhost);
```

### Other containers

Other containers should tend to work fine by default, or with modifications to the [`config`](./config) files.
Running in detached mode (with the `-d` flag) is useful for less-frequently altered containers.

For instance, to launch the api and database in the background, run
```sh
docker compose up -d db api
```

## Deploying to Production

> _See also [`apps/web/README.md`](./apps/web/README.md) for dashboard-specific information 
> like running with a reverse proxy._

In production, containers tend to be spread out across multiple servers.

1. Initialise Swarm mode

    Keys and configs are Swarm features; we run containers as services with a size of 1.

    ```sh
    docker swarm init
    ```

    Sometimes the `--advertise-addr` flag will need to be set. This should be set to
    the public IP address of the VPS. It is the
    [address that any child worker nodes would connect to](https://docs.docker.com/engine/swarm/swarm-tutorial/create-swarm/),
    if they existed.

2. Create necessary secrets and configs

    ```sh
    docker secret create keys ./keys.json
    docker config create config ./config.json
    # ...etc
    ```

3. Pull the latest version of the service

    ```sh
    docker pull ghcr.io/rapha01/activityrank/manager:latest
    ```

4. Deploy the service

    ```sh
    docker service create --name manager \
        --secret keys \
        --config config \
        --log-driver "local" \
        -p 3005:3000 \
        ghcr.io/rapha01/activityrank/manager 
    ```

### Rotating Secrets

A deployed service's config may need to be updated. Since a config cannot be deleted while a container is still using it,
we create a new config and assign it to the container with the appropriate name.

```sh
# Create a new config
docker config create config-2
# Use `config-2` with the target of `config`
docker service update <service> --config-rm config --config-add source=config-2,target=config
# Now that no service is using `config`, delete it
docker config rm config
```

## Overall Structure

The bot is designed for easy scalability. There should be only one instance of
the Manager service deployed, and any number of instances of the Bot service
deployed. At the moment, we only use one instance of the bot service on a 64GB
RAM server. RAM is our current limiting factor for scale, likely because of
Discord.JS's aggressive caching.

Guilds and users are also designed to be shardable in the database, but we
haven't yet needed to implement that either. The Manager DB keeps a record of
`guildId -> database shard ID` and `userId -> database shard ID`, which is
queried whenever a member or guild is updated.

As messages are sent in guilds, the Bot service recieves `MESSAGE_CREATE` events
via its Gateway (Discord WS) connection. Each shard of the bot aggregates its XP
and statistics in a cache -
[`src/bot/statFlushCache.ts`](apps/bot/src/bot/statFlushCache.ts) and
[`src/bot/xpFlushCache.ts`](apps/bot/src/bot/xpFlushCache.ts), and the bot
module periodically collects and flushes these statistics
([`src/models/shardDb/statFlush.ts`](apps/bot/src/models/shardDb/statFlush.ts))
to the appropriate sharded database.
