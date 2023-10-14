import { fileURLToPath } from 'node:url';
import path from 'node:path';

export const botDir = fileURLToPath(new URL('..', import.meta.url));
export const commandsDir = path.join(botDir, 'commandsSlash');
export const adminDir = path.join(botDir, 'commandsAdmin');
export const contextDir = path.join(botDir, 'contextMenus');
export const eventsDir = path.join(botDir, 'events');
