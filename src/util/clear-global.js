import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v9';
import { get as getKeys } from '../const/keys.js';
const { botId, botAuth } = getKeys();

main = async () => {
  const rest = new REST({ version: '9' }).setToken(botAuth);
  try {
    console.log('');
    console.log(`🗑️ Clearing global application (/) commands. 🗑️`);
    await rest.put(Routes.applicationCommands(botId), { body: [] });
    console.log(
      `🗑️ Successfully cleared global application (/) commands. Commands may take up to one hour to update. 🗑️`,
    );
  } catch (error) {
    console.error(error);
  }
};
main();
