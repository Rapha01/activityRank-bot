import { readFile } from 'node:fs/promises';
import { packageFile } from './paths.js';
import { z } from 'zod';

import { configLoader, schemas } from '@activityrank/cfg';
import type { EmojiNames } from './emoji.generated.js';

export const isProduction = process.env.NODE_ENV === 'production';
const loader = () =>
  isProduction
    ? configLoader()
    : configLoader(process.env.CONFIG_PATH ?? `${import.meta.dirname}/../../../../config`);

export const config = await loader().load({
  name: 'config',
  schema: schemas.bot.config,
  secret: false,
});
export const keys = await loader().load({ name: 'keys', schema: schemas.bot.keys, secret: true });
export const privileges = await loader().load({
  name: 'privileges',
  schema: schemas.bot.privileges,
  secret: false,
});
export const emojiIds = await loader().load({
  name: 'emoji',
  schema: z.record(z.string(), z.string().regex(/\d{17,20}/)),
  secret: false,
});

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
