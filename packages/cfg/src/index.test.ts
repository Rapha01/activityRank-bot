import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { z } from 'zod/v4';
import { configLoader, schemas } from './index.ts';

/* 
  - When in PRODUCTION mode, files are loaded from Docker secrets & configs
  - When in DEVELOPMENT mode, files are loaded relative to the `pnpm-workspace.yaml` file.
      All pnpm workspaces require a `pnpm-workspace.yaml` file (https://pnpm.io/workspaces), 
      so this is a reliable way of accessing the root.
*/

describe('fn', () => {
  it('should function properly in dev mode', async () => {
    process.env.NODE_ENV = 'development';

    const loader = await configLoader();

    expect(loader.getLoadPaths('config', false)).toEqual([
      path.join(process.cwd(), '../../config/config'),
      path.join(process.cwd(), '../../config/config.json'),
      path.join(process.cwd(), '../../config/config.toml'),
    ]);

    await expect(
      loader.load('config', { schema: schemas.bot.config, secret: false }),
    ).resolves.toBeDefined();

    await expect(
      loader.load('config', { schema: schemas.bot.keys, secret: false }),
    ).rejects.toThrowError();

    // even though `secret` is incorrect here, it shouldn't matter in dev mode.
    await expect(
      loader.load('config', { schema: schemas.bot.config, secret: true }),
    ).resolves.toBeDefined();
  });

  it('should load from standard docker paths in production mode', async () => {
    process.env.NODE_ENV = 'production';

    const loader = await configLoader();

    expect(loader.getLoadPaths('config', false)).toEqual([
      path.resolve('/config'),
      path.resolve('/config.json'),
      path.resolve('/config.toml'),
    ]);
    expect(loader.getLoadPaths('config', true)).toEqual([
      path.resolve('/run/secrets/config'),
      path.resolve('/run/secrets/config.json'),
      path.resolve('/run/secrets/config.toml'),
    ]);
  });

  it('should load both JSON and TOML files', async () => {
    const loader = await configLoader();

    await expect(
      loader.loadString('{"test": "value"}', z.object({ test: z.literal('value') }), 'example'),
    ).resolves.toStrictEqual({ test: 'value' });

    await expect(
      loader.loadString('test = "value"', z.object({ test: z.literal('value') }), 'example'),
    ).resolves.toStrictEqual({ test: 'value' });
  });
});
