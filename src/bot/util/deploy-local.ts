import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v9';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { get as getKeys } from '../../const/keys.js';
const { adminGuild, botAuth } = getKeys();

const commands = [];
const adminCommands = [];
const commandFiles = fs
  .readdirSync(fileURLToPath(new URL('../commandsSlash', import.meta.url)))
  .filter((file) => file.endsWith('.js') && !file.startsWith('-'));
const contextFiles = fs
  .readdirSync(fileURLToPath(new URL('../contextMenus', import.meta.url)))
  .filter((file) => file.endsWith('.js') && !file.startsWith('-'));
const adminFiles = fs
  .readdirSync(pfileURLToPath(new URL('../commandsAdmin', import.meta.url)))
  .filter((file) => file.endsWith('.js') && !file.startsWith('-'));

export default async (client) => {
  for (const file of commandFiles) {
    const command = await import(`../commandsSlash/${file}`);
    commands.push(command.data.toJSON());
  }
  for (const file of contextFiles) {
    const command = await import(`../contextMenus/${file}`);
    commands.push(command.data.toJSON());
  }
  for (const file of adminFiles) {
    const command = await import(`../commandsAdmin/${file}`);
    adminCommands.push(command.data.toJSON());
  }

  const rest = new REST({ version: '9' }).setToken(botAuth);

  try {
    for (const guild of client.guilds.cache.keys()) {
      if (guild === adminGuild) {
        await rest.put(Routes.applicationGuildCommands(client.user.id, guild), {
          body: [...commands, ...adminCommands],
        });
        console.log(
          `Loaded local application and admin (/) commands in guild ${guild}`,
        );
      } else {
        await rest.put(Routes.applicationGuildCommands(client.user.id, guild), {
          body: commands,
        });
        console.log(`Loaded local application (/) commands in guild ${guild}`);
      }
    }
  } catch (error) {
    console.error(error);
  }
};