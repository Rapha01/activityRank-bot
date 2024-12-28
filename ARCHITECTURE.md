# Architecture
<!-- TODO: improve this documentation -->

## Repostory Layout

ActivityRank is set up as a monorepo, with all executable components in [apps](./apps). 

### Deployment

All components should be deployed in production as instances of their Docker containers. <!-- TODO: better CI setup -->
Ideally, these containers will be built in GitHub CI, but they may also be built on the target VPS. 

In development, semi-permanent containers such as the database can be deployed via the root docker-compose file ([docker-compose.yml](./docker-compose.yml)). 
Other components, like the bot module, should be run via a typical node process.


## Deployment Structure

### Repositories
* https://github.com/Rapha01/activityRank-bot
* https://github.com/Rapha01/activityRank-manager
* https://github.com/Rapha01/activityRank-web

### Overview

The bot is designed for easy scalability. 
There should be only one instance of the Manager repo deployed, and any number of instances
of the Bot repo deployed. At the moment, we only use one instance of the bot repo on a
64GB RAM server. RAM is our current limiting factor for scale, likely because of 
Discord.JS's aggressive caching.

Guilds and users are also designed to be shardable in the database, but we haven't yet needed to implement that either.
The Manager DB keeps a record of `guildId | userId -> database shard ID`, which is queried whenever a member
or guild is updated. 

As messages are sent in guilds, the Bot module recieves MESSAGE_CREATE events via its Gateway connection.
Each shard of the bot aggregates its XP and statistics in a cache - `src/bot/statFlushCache.ts` and `src/bot/xpFlushCache.ts`, 
and the bot module periodically collects and flushes these statistics (`src/models/shardDb/statFlush.ts`) to the 
appropriate sharded database.
