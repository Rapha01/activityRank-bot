import { readFile } from 'node:fs/promises';
import { packageFile } from './paths.js';

import { configLoader, schemas } from '@activityrank/cfg';
import type { EmojiNames } from './emoji.generated.js';

export const isProduction = process.env.NODE_ENV === 'production';
const loader = await configLoader();

export const config = await loader.loadConfig('config', { schema: schemas.bot.config });
export const keys = await loader.loadSecret('keys', { schema: schemas.bot.keys });
export const privileges = await loader.loadConfig('privileges', { schema: schemas.bot.privileges });
export const emojiIds = await loader.loadConfig('emoji', { schema: schemas.bot.emojis });

export function emoji(name: EmojiNames) {
  const id = emojiIds[name];
  if (!id) {
    throw new Error(`Failed to resolve bot emoji "${name}".`);
  }
  return `<:${name}:${id}>`;
}

const pkgfile = await readFile(packageFile);
const pkg = JSON.parse(pkgfile.toString());

export const version = pkg.version as string;

export const PrivilegeLevel = {
  Developer: 'DEVELOPER',
  Moderator: 'MODERATOR',
  HelpStaff: 'HELPSTAFF',
} as const;

export type PrivilegeLevel = (typeof PrivilegeLevel)[keyof typeof PrivilegeLevel];

const privilegeLevels: { [k in PrivilegeLevel]: number } = {
  DEVELOPER: 3,
  MODERATOR: 2,
  HELPSTAFF: 1,
};

export function hasPrivilege(requirement: PrivilegeLevel, testCase: PrivilegeLevel | undefined) {
  if (!testCase) return false;
  return privilegeLevels[testCase] >= privilegeLevels[requirement];
}

export function isPrivileged(userId: string) {
  return Object.keys(privileges).includes(userId);
}
