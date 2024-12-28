import { readFile } from 'node:fs/promises';
import type {
  ConfigInstance,
  KeyInstance,
  PrivilegeInstance,
  PrivilegeLevel as PL,
} from './config.types.js';
import { packageFile } from './paths.js';

// read from Docker Compose configs/secrets locations
const [conffile, privfile, keyfile, pkgfile] = await Promise.all([
  readFile(process.env.CONFIG_PATH ?? '/conf'),
  readFile(process.env.PRIVILEGE_PATH ?? '/privileges'),
  readFile(process.env.KEYS_PATH ?? '/run/secrets/keys'),
  readFile(packageFile),
]);

export const isProduction = process.env.NODE_ENV === 'production';
export const PrivilegeLevel = {
  Developer: 'DEVELOPER',
  Moderator: 'MODERATOR',
  HelpStaff: 'HELPSTAFF',
} as const;
const privilegeLevels: { [k in PL]: number } = {
  DEVELOPER: 3,
  MODERATOR: 2,
  HELPSTAFF: 1,
};

export function hasPrivilege(requirement: PL, testCase: PL | undefined) {
  if (!testCase) return false;
  return privilegeLevels[testCase] >= privilegeLevels[requirement];
}
export function isPrivileged(userId: string) {
  return Object.keys(privileges).includes(userId);
}

export const config = JSON.parse(conffile.toString()) as ConfigInstance;
export const keys = JSON.parse(keyfile.toString()) as KeyInstance;
export const privileges = JSON.parse(privfile.toString()) as PrivilegeInstance;

const pkg = JSON.parse(pkgfile.toString());
export const version = pkg.version as string;
