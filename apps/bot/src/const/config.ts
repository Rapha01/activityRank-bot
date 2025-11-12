import { readFile } from 'node:fs/promises';
import { configLoader, schemas } from '@activityrank/cfg';
import type { EmojiNames } from './emoji.generated.js';
import { packageFile } from './paths.js';

export const isProduction = process.env.NODE_ENV === 'production';
const loader = await configLoader();

export const config = await loader.loadConfig('config', { schema: schemas.bot.config });
export const keys = await loader.loadSecret('keys', { schema: schemas.bot.keys });

export function emoji(name: EmojiNames) {
  const id = config.emoji[name];
  if (!id) {
    throw new Error(`Failed to resolve bot emoji "${name}".`);
  }
  return `<:${name}:${id}>`;
}
export function emojiId(name: EmojiNames) {
  const id = config.emoji[name];
  if (!id) {
    throw new Error(`Failed to resolve bot emoji "${name}".`);
  }
  return id;
}

const pkgfile = await readFile(packageFile);
const pkg = JSON.parse(pkgfile.toString());

export const version = pkg.version as string;

export const StaffEntitlementLevel = {
  Developer: 'DEVELOPER',
  Moderator: 'MODERATOR',
  HelpStaff: 'HELPSTAFF',
} as const;

export type StaffEntitlementLevel =
  (typeof StaffEntitlementLevel)[keyof typeof StaffEntitlementLevel];

const staffEntitlementLevels: { [k in StaffEntitlementLevel]: number } = {
  DEVELOPER: 10,
  MODERATOR: 5,
  HELPSTAFF: 1,
};

export function getStaffEntitlement(userId: string) {
  const isStaff = Object.keys(config.staffEntitlements).includes(userId);
  if (!isStaff) {
    return { isStaff } as const;
  }
  const entitlementLevel = config.staffEntitlements[userId];
  return { isStaff, entitlementLevel };
}

export function hasStaffEntitlement(
  requirement: StaffEntitlementLevel,
  testCase: StaffEntitlementLevel | undefined,
) {
  if (!testCase) return false;
  return staffEntitlementLevels[testCase] >= staffEntitlementLevels[requirement];
}
