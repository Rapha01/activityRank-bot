import { fileURLToPath } from 'node:url';
import path from 'node:path';

const rootDir = fileURLToPath(new URL('../..', import.meta.url));
const distDir = path.join(rootDir, 'dist');
export const configDir = path.join(rootDir, 'config');

export const botDir = path.join(distDir, 'bot');

export const commandsDir = path.join(botDir, 'commandsSlash');
export const adminDir = path.join(botDir, 'commandsAdmin');
export const contextDir = path.join(botDir, 'contextMenus');
export const eventsDir = path.join(botDir, 'events');
