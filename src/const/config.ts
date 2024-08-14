import { readFile } from 'node:fs/promises';
import type {
  ConfigInstance,
  KeyInstance,
  PrivilegeInstance,
  PrivilegeLevel as PL,
} from './config.types.js';
import { packageFile } from './paths.js';

const LOAD_LOCAL_CONFIG = process.env.LOAD_LOCAL_CONFIG === '1';

// read from Docker Compose configs/secrets locations
const [conffile, privfile, keyfile, pkgfile] = await Promise.all([
  readFile(LOAD_LOCAL_CONFIG ? './config/config.json' : '/conf'),
  readFile(LOAD_LOCAL_CONFIG ? './config/privilege.json' : '/privileges'),
  readFile(LOAD_LOCAL_CONFIG ? './config/keys.json' : '/run/secrets/keys'),
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
  return Object.keys(getPrivileges()).includes(userId);
}

export const config = JSON.parse(conffile.toString()) as ConfigInstance;
export const keys = JSON.parse(keyfile.toString()) as KeyInstance;
const privileges = JSON.parse(privfile.toString());

export const getPrivileges = (prod: boolean = isProduction) =>
  privileges[prod ? 'production' : 'development'] as PrivilegeInstance;

const pkg = JSON.parse(pkgfile.toString());
export const version = pkg.version as string;
