import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v9';
import { commandFiles, contextFiles, adminFiles } from './command-files.js';
import { get as getKeys } from '../const/keys.js';
import type {
  CommandInteraction,
  RESTPostAPIChatInputApplicationCommandsJSONBody,
  SlashCommandBuilder,
} from 'discord.js';
const { botId, botAuth, adminGuild } = getKeys();

const commands: RESTPostAPIChatInputApplicationCommandsJSONBody[] = [];
const adminCommands: RESTPostAPIChatInputApplicationCommandsJSONBody[] = [];

export default async function () {
  interface FileExport {
    default: {
      data: SlashCommandBuilder;
      execute: (i: CommandInteraction<'cached'>) => Promise<unknown>;
    };
  }

  for (const file of commandFiles) {
    const { default: command } = (await import(`../bot/commandsSlash/${file}`)) as FileExport;
    commands.push(command.data.toJSON());
  }
  for (const file of contextFiles) {
    const { default: command } = (await import(`../bot/contextMenus/${file}`)) as FileExport;
    commands.push(command.data.toJSON());
  }
  for (const file of adminFiles) {
    const { default: command } = (await import(`../bot/commandsAdmin/${file}`)) as FileExport;
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
    console.log(`Loaded local application and admin (/) commands in admin guild (${adminGuild})`);
  } catch (error) {
    console.error(error);
  }
}
