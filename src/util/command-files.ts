import fs from 'fs';
import { fileURLToPath } from 'url';

export const commandFiles = fs
  .readdirSync(fileURLToPath(new URL('../bot/commandsSlash', import.meta.url)))
  .filter((file) => file.endsWith('.js') && !file.startsWith('-'));
export const contextFiles = fs
  .readdirSync(fileURLToPath(new URL('../bot/contextMenus', import.meta.url)))
  .filter((file) => file.endsWith('.js') && !file.startsWith('-'));

export const adminFiles = fs
  .readdirSync(fileURLToPath(new URL('../bot/commandsAdmin', import.meta.url)))
  .filter((file) => file.endsWith('.js') && !file.startsWith('-'));
