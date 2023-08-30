import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v9';
import { commandFiles, contextFiles, adminFiles } from './command-files.js';
import { get as getKeys } from '../const/keys.js';
const { botId, botAuth, adminGuild } = getKeys();

const commands = [];
const adminCommands = [];

export default async function () {
  for (const file of commandFiles) {
    const { default: command } = await import(`../bot/commandsSlash/${file}`);
    commands.push(command.data.toJSON());
  }
  for (const file of contextFiles) {
    const { default: command } = await import(`../bot/contextMenus/${file}`);
    commands.push(command.data.toJSON());
  }
  for (const file of adminFiles) {
    const { default: command } = await import(`../bot/commandsAdmin/${file}`);
    adminCommands.push(command.data.toJSON());
  }

  const rest = new REST({ version: '9' }).setToken(botAuth);

  try {
    console.log('Refreshing GLOBAL application (/) commands...');
    await rest.put(Routes.applicationCommands(botId), { body: commands });
    console.log(
      'Successfully reloaded GLOBAL application (/) commands.\nRefreshing admin commands...',
    );
    await rest.put(Routes.applicationGuildCommands(botId, adminGuild), {
      body: adminCommands,
    });
    console.log(
      `Loaded local application and admin (/) commands in admin guild (${adminGuild})`,
    );
  } catch (error) {
    console.error(error);
  }
}
