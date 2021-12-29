const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const { botId, botAuth, admin } = require('../../const/keys.js').get();


main = async () => {  
  const rest = new REST({ version: '9' }).setToken(botAuth);
  try {
    console.log('');
    console.log(`🗑️ Clearing local application (/) commands... 🗑️`);
    for (const guild in admin.guildIds) {
      await rest.put(
        Routes.applicationGuildCommands(botId, guild),
        { body: [] }
      );
    }
    console.log(`🗑️ Successfully cleared local application (/) commands. 🗑️`);
    console.log('');
  } catch (error) {
    console.error(error);
  }
}
main();