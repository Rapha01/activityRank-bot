import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = fileURLToPath(new URL('../..', import.meta.url));
const distDir = join(rootDir, 'dist');
export const configDir = join(rootDir, 'config');

export const botDir = join(distDir, 'bot');

export const packageFile = join(rootDir, 'package.json');
