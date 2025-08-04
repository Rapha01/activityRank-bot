import path from 'node:path';
import type { configLoader, schemas } from '@activityrank/cfg';
import type { API } from '@discordjs/core';
import { findWorkspaceDir } from '@pnpm/find-workspace-dir';
import { UsageError } from 'clipanion';
import pc from 'picocolors';
import type { z } from 'zod/v4';

export async function findWorkspaceRoot(errorMessage?: string) {
  const workspaceDir = await findWorkspaceDir(process.cwd());
  if (!workspaceDir) {
    throw new UsageError(
      errorMessage ??
        `Could not find the root of the ${pc.cyan('activityrank')} monorepo. Provide a config path via the ${pc.cyan('--config')} flag or the ${pc.cyan('CONFIG_PATH')} environment variable.`,
    );
  }
  return workspaceDir;
}

export async function findWorkspaceConfig() {
  const root = await findWorkspaceRoot();
  return path.join(root, 'config');
}

// /**
//  * Gets a configLoader object, from (in order):
//  *
//  * 1. the provided path argument
//  * 2. the CONFIG_PATH environment variable
//  * 3. the workspace root
//  */
// export async function getConfigLoader(
//   _path?: string | undefined,
// ): Promise<ReturnType<typeof configLoader>> {
//   const cfgPath =
//     _path ?? process.env.CONFIG_PATH ?? path.join(await findWorkspaceRoot(), 'config');
//   return configLoader(cfgPath);
// }

export interface BaseConfig {
  config: z.infer<typeof schemas.bot.config>;
  keys: z.infer<typeof schemas.bot.keys>;
  api: API;
  loader: Awaited<ReturnType<typeof configLoader>>;
}

// /**
//  * Loads frequently-required config objects, like the config and keys from:
//  *
//  * 1. the provided path argument
//  * 2. the CONFIG_PATH environment variable
//  * 3. the workspace root
//  *
//  * If only the `configLoader` object is required, prefer {@link getConfigLoader}
//  * as it will avoid validating the `config.json` and `keys.json` files.
//  */
// export async function loadBaseConfig(configDirPath?: string | undefined): Promise<BaseConfig> {
//   const loader = await getConfigLoader(configDirPath);

//   const config = await loader.load({
//     name: 'config',
//     schema: schemas.bot.config,
//     secret: false,
//   });
//   const keys = await loader.load({ name: 'keys', schema: schemas.bot.keys, secret: true });

//   const rest = new REST();
//   rest.setToken(keys.botAuth);
//   const api = new API(rest);

//   return { config, keys, api, loader };
// }
