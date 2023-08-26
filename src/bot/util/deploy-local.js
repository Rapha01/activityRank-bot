import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v9';
import fs from 'fs';
import path from 'path';
import { get as getKeys } from '../../const/keys.js';
const { adminGuild, botAuth } = getKeys();

const commands = [];
const adminCommands = [];
const commandFiles = fs
  .readdirSync(path.resolve(__dirname, '../commandsSlash'))
  .filter((file) => file.endsWith('.js') && !file.startsWith('-'));
const contextFiles = fs
  .readdirSync(path.resolve(__dirname, '../contextMenus'))
  .filter((file) => file.endsWith('.js') && !file.startsWith('-'));
const adminFiles = fs
  .readdirSync(path.resolve(__dirname, '../commandsAdmin'))
  .filter((file) => file.endsWith('.js') && !file.startsWith('-'));

export default async (client) => {
  for (const file of commandFiles) {
    const command = require(`../commandsSlash/${file}`);
    commands.push(command.data.toJSON());
  }
  for (const file of contextFiles) {
    const command = require(`../contextMenus/${file}`);
    commands.push(command.data.toJSON());
  }
  for (const file of adminFiles) {
    const command = require(`../commandsAdmin/${file}`);
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
