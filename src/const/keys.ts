import { readFileSync } from 'node:fs';

export const isProduction = process.env.NODE_ENV === 'production';

// read from Docker Compose configs/secrets locations
const keyfile = readFileSync(
  process.env.KEYFILE_PATH ?? isProduction
    ? '/run/secrets/keys'
    : new URL('../../config/keys.json', import.meta.url)
);
const conffile = readFileSync(
  process.env.CONFFILE_PATH ?? isProduction
    ? '/conf'
    : new URL('../../config/config.json', import.meta.url)
);

const keys = JSON.parse(keyfile.toString());
const config = JSON.parse(conffile.toString());

export const getKeys = (prod: boolean = isProduction) =>
  keys[prod ? 'production' : 'development'] as KeyInstance;

export const getConfig = () => config as ConfigInstance;

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
export interface ConfigInstance {
  disablePatreon?: boolean;
}
