# Architecture
<!-- TODO: improve this documentation -->

## Repostory Layout

ActivityRank is set up as a monorepo, with all executable components in [apps](apps).

### Deployment

All components should be deployed in production as instances of their Docker containers. <!-- TODO: better CI setup -->
Ideally, these containers will be built in [GitHub CI](.github/workflows/ci.yml),
but they may also be built on the target VPS.

In development, semi-permanent containers such as the database can be deployed
via the root docker-compose file ([docker-compose.yml](docker-compose.yml)).
Other components, like the bot module, should be run via a typical node process
through their `pnpm dev` scripts.

#### Development deployment example

An example of running in development (to work primarily on the bot module)
is shown here:

1. Run the manager and database in Docker containers.

    ```sh
    docker compose up db manager
    ```

2. Run the development script for the bot.

    ```sh
    pnpm --filter bot run dev:watch
    ```

#### Deploying in production

In production, containers tend to be spread out across multiple servers.

1. Initialise Swarm mode

    Keys and configs are Swarm features; we run the container as a service with a
    size of 1.

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
        -p 3005:3000 \
        ghcr.io/rapha01/activityrank/manager 
    ```

## Deployment Structure

### Overview

The bot is designed for easy scalability. There should be only one instance of
the Manager service deployed, and any number of instances of the Bot service
deployed. At the moment, we only use one instance of the bot service on a 64GB
RAM server. RAM is our current limiting factor for scale, likely because of
Discord.JS's aggressive caching.

Guilds and users are also designed to be shardable in the database, but we
haven't yet needed to implement that either. The Manager DB keeps a record of
`guildId -> database shard ID` and `userId -> database shard ID`, which is
queried whenever a member or guild is updated.

As messages are sent in guilds, the Bot service recieves MESSAGE_CREATE events
via its Gateway (Discord WS) connection. Each shard of the bot aggregates its XP
and statistics in a cache -
[`src/bot/statFlushCache.ts`](apps/bot/src/bot/statFlushCache.ts) and
[`src/bot/xpFlushCache.ts`](apps/bot/src/bot/xpFlushCache.ts), and the bot
module periodically collects and flushes these statistics
([`src/models/shardDb/statFlush.ts`](apps/bot/src/models/shardDb/statFlush.ts))
to the appropriate sharded database.
