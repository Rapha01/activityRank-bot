import { readFileSync } from 'node:fs';

export const isProduction = process.env.NODE_ENV === 'production';

// read from Docker Compose configs/secrets locations
const keyfile = readFileSync(
  process.env.KEYFILE_PATH ?? isProduction
    ? '/run/secrets/keys'
    : new URL('../../config/keys.json', import.meta.url)
);

const keys = JSON.parse(keyfile.toString());

export const getKeys = (prod: boolean = isProduction) =>
  keys[prod ? 'production' : 'development'] as KeyInstance;

export interface KeyInstance {
  botId: string;
  dblApiKey: string;
  patreonAccessToken: string;
  managerApiAuth: string;
  managerHost: string;
  managerDb: {
    dbName: string;
    dbPassword: string;
    dbUser: string;
  };
  shardDb: {
    dbName: string;
    dbPassword: string;
    dbUser: string;
  };
}
