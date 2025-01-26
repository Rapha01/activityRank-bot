import { readFile } from 'node:fs/promises';
import { packageFile } from './paths.js';

import { configLoader, schemas } from '@activityrank/cfg';

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
