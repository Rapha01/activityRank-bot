const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const { Client, IntentsBitField } = require('discord.js');
const { botId, botAuth } = require('../../const/keys.js').get();

const client = new Client({ intents: [IntentsBitField.GUILDS] });

const main = async () => {
  await client.login(botAuth);
  const rest = new REST({ version: '9' }).setToken(botAuth);
  try {
    console.log('');
    console.log('🗑️ Clearing local application (/) commands... 🗑️');
    for (const guild of client.guilds.cache.keys()) {
      await rest.put(Routes.applicationGuildCommands(botId, guild), {
        body: [],
      });
    }
    console.log('🗑️ Successfully cleared local application (/) commands. 🗑️');
    console.log('');
  } catch (error) {
    console.error(error);
  }
};
main();
