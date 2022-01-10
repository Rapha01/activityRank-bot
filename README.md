# ActivityRank Discord Bot
A discord bot dedicated to Levels, XP, Rankings and Statistics. Sharded and capable of running distributed on multiple machines.

[Live Bot Invite Link](https://discord.com/oauth2/authorize?client_id=534589798267224065&permissions=275884919872&scope=bot%20applications.commands)

## Other Repos

### [Manager](https://github.com/Linck01/activityRankManager)
Manager server responsible for routing database shard queries, handling webhooks and creating statistics.

### [DB](https://github.com/Linck01/activityRankDb)
Docker script for one database shard instance.

### [Website](https://github.com/Linck01/activityRankWebsite)
Website with features, commands and patchnotes for the bot.

## Docker
```bash
docker-compose -f docker-compose-developmentNodemon.yml up
docker-compose -f docker-compose-production.yml up
```

## Support and Inquiries
Please visit our support discord server: https://discord.com/invite/DE3eQ8H

## Contributing
Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.


## Important formatting information

### Slash commands
Slash commands can be found in the [commandsSlash](./src/bot/commandsSlash) folder. 
The top-level files contain the `data` in the form of a `SlashCommandBuilder`. 
Folders represent SubCommands and SubCommandGroups, and the files inside them only need an `async execute(i)` function.
