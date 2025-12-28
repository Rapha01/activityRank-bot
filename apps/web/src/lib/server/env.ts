import logger from 'consola';
import { building } from '$app/environment';
import { env } from '$env/dynamic/private';
import { env as publicEnv } from '$env/dynamic/public';
import { PUBLIC_APP_VERSION, PUBLIC_COMMIT_HASH } from '$env/static/public';

type EnvVar = { key: string; staticValue?: string; optional?: boolean };
const ENV_VARIABLES: EnvVar[] = [
  { key: 'DISCORD_ID' },
  { key: 'DISCORD_TOKEN' },
  { key: 'DISCORD_SECRET' },

  { key: 'DB_HOST' },
  { key: 'DB_USER' },
  { key: 'DB_PASS' },
  { key: 'DB_NAME' },

  { key: 'MANAGER_HOST' },
  { key: 'MANAGER_AUTH' },

  { key: 'ORIGIN', optional: true },
  { key: 'PUBLIC_ORIGIN' },

  { key: 'PUBLIC_COMMIT_HASH', staticValue: PUBLIC_COMMIT_HASH, optional: true },
  { key: 'PUBLIC_APP_VERSION', staticValue: PUBLIC_APP_VERSION, optional: true },
];

function envVariableExists(variable: EnvVar): boolean {
  if (variable.staticValue !== undefined) {
    return variable.staticValue !== '';
  }

  if (variable.key.startsWith('PUBLIC_')) {
    return Reflect.has(publicEnv, variable.key) && Reflect.get(publicEnv, variable.key) !== '';
  } else {
    return Reflect.has(env, variable.key) && Reflect.get(env, variable.key) !== '';
  }
}

export function verifyEnvVariables() {
  if (building) {
    return;
  }

  const missingRequiredVars = ENV_VARIABLES.filter(
    (variable) => !variable.optional && !envVariableExists(variable),
  );
  const missingRecommendedVars = ENV_VARIABLES.filter(
    (variable) => variable.optional && !envVariableExists(variable),
  );

  if (missingRequiredVars.length > 0) {
    logger.fatal(
      `Missing required environment variables:\n${' '.repeat(8)}${missingRequiredVars.map((v) => v.key).join(', ')}`,
    );
  }

  if (missingRecommendedVars.length > 0) {
    logger.warn(
      `Missing suggested environment variables:\n${' '.repeat(7)}${missingRecommendedVars.map((v) => v.key).join(', ')}`,
    );
  }

  if (missingRequiredVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingRequiredVars.join(', ')}`);
  }

  if (missingRequiredVars.length === 0 && missingRecommendedVars.length === 0) {
    logger.success('Environment variables verified');
  }
}
