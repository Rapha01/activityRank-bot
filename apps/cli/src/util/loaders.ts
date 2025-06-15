import path from 'node:path';
import fs from 'node:fs/promises';
import type { z } from 'zod';
import { UsageError } from 'clipanion';
import { configLoader, schemas } from '@activityrank/cfg';
import { walkUp } from '../util/walkUp.ts';
import pc from 'picocolors';
import { REST } from '@discordjs/rest';
import { API } from '@discordjs/core';

/**
 * Walks up the directory tree, starting from the cwd, until it finds
 * one that has a `package.json` file with a `"name"` of "@activityrank/monorepo".
 */
export async function findWorkspaceRoot(errorMessage?: string) {
  for (const dir of walkUp(process.cwd())) {
    const checkFile = path.join(dir, 'package.json');

    let json: object;
    try {
      const content = await fs.readFile(checkFile);
      json = JSON.parse(content.toString());
    } catch (e) {
      continue;
    }

    if ('name' in json && json.name === '@activityrank/monorepo') {
      return dir;
    }
  }

  throw new UsageError(
    errorMessage ??
      `Could not find the root of the ${pc.cyan('activityrank')} monorepo. Provide a config path via the ${pc.cyan('--config')} flag or the ${pc.cyan('CONFIG_PATH')} environment variable.`,
  );
}

export async function findWorkspaceConfig() {
  const root = await findWorkspaceRoot();
  return path.join(root, 'config');
}

/**
 * Gets a configLoader object, from (in order):
 *
 * 1. the provided path argument
 * 2. the CONFIG_PATH environment variable
 * 3. the workspace root
 */
export async function getConfigLoader(
  _path?: string | undefined,
): Promise<ReturnType<typeof configLoader>> {
  const cfgPath =
    _path ?? process.env.CONFIG_PATH ?? path.join(await findWorkspaceRoot(), 'config');
  return configLoader(cfgPath);
}

export interface BaseConfig {
  config: z.infer<typeof schemas.bot.config>;
  keys: z.infer<typeof schemas.bot.keys>;
  api: API;
  loader: ReturnType<typeof configLoader>;
}

/**
 * Loads frequently-required config objects, like the config and keys from:
 *
 * 1. the provided path argument
 * 2. the CONFIG_PATH environment variable
 * 3. the workspace root
 *
 * If only the `configLoader` object is required, prefer {@link getConfigLoader}
 * as it will avoid validating the `config.json` and `keys.json` files.
 */
export async function loadBaseConfig(configDirPath?: string | undefined): Promise<BaseConfig> {
  const loader = await getConfigLoader(configDirPath);

  const config = await loader.load({
    name: 'config',
    schema: schemas.bot.config,
    secret: false,
  });
  const keys = await loader.load({ name: 'keys', schema: schemas.bot.keys, secret: true });

  const rest = new REST();
  rest.setToken(keys.botAuth);
  const api = new API(rest);

  return { config, keys, api, loader };
}
