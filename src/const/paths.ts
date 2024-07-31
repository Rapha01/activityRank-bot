import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const rootDir = fileURLToPath(new URL('../..', import.meta.url));
const distDir = join(rootDir, 'dist');
export const configDir = join(rootDir, 'config');

export const botDir = join(distDir, 'bot');

export const packageFile = join(rootDir, 'package.json');
