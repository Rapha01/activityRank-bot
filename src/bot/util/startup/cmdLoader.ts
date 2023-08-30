import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Collection } from 'discord.js';

let files = [];

const botDir = fileURLToPath(new URL('../..', import.meta.url));
const contextDir = path.join(botDir, 'contextMenus');
const commandsDir = path.join(botDir, 'commandsSlash');
const adminDir = path.join(botDir, 'commandsAdmin');

function getRecursive(dir) {
  fs.readdirSync(dir).forEach((file) => {
    const absolute = path.join(dir, file);
    if (fs.statSync(absolute).isDirectory()) return getRecursive(absolute);
    if (absolute.endsWith('.js')) files.push(absolute);
  });
}

getRecursive(commandsDir);

files = files.map((fileName) => fileName.replace(commandsDir + '/', ''));

export default async (client) => {
  client.commands = new Collection();
  client.adminCommands = new Collection();

  files.forEach(async (fileName) => {
    const { default: command } = await import(path.join(commandsDir, fileName));
    client.commands.set(fileName.slice(0, -3), command);
  });

  for (const file of fs.readdirSync(contextDir)) {
    if (!file.endsWith('.js')) return;
    client.commands.set(
      file.slice(0, -3),
      await import(path.join(contextDir, file)),
    );
  }

  for (const file of fs.readdirSync(adminDir)) {
    if (!file.endsWith('.js')) return;
    const { default: command } = await import(path.join(adminDir, file));
    command.isAdmin = true;
    if (
      !command.requiredPrivileges ||
      typeof command.requiredPrivileges !== 'number' ||
      command.requiredPrivileges > 5 ||
      command.requiredPrivileges < 1
    )
      throw new Error(
        `Admin command ${file} does not have a valid requiredPrivileges field!`,
      );
    client.adminCommands.set(file.slice(0, -3), command);
  }

  client.logger.debug('Loaded internal command registry');
};
