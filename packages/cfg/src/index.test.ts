import { describe, expect, it } from 'vitest';
import { configLoader } from './index.js';
import * as schemas from './schemas.js';

/* 
  - When in PRODUCTION mode, files are loaded from Docker secrets & configs
  - When in DEVELOPMENT mode, files are loaded from a *single* arbitrary path
*/

describe('fn', () => {
  it('should function properly, given a path in dev mode', async () => {
    process.env.NODE_ENV = 'development';

    const loaders = [
      configLoader(`${process.cwd()}/../../config/`),
      configLoader('../../config/'),
      configLoader(`${process.cwd()}/../../config`),
      configLoader('../../config'),
    ];

    expect(() => configLoader(), 'configLoader requires a path in dev mode').toThrow(TypeError);

    for (const loader of loaders) {
      expect(loader.getLoadPath({ name: 'config', secret: false })).toEqual(
        new URL(`file:${process.cwd()}/../../config/config.json`),
      );

      await expect(
        loader.load({ name: 'config', schema: schemas.bot.config, secret: false }),
      ).resolves.toBeDefined();

      await expect(
        loader.load({ name: 'config', schema: schemas.bot.keys, secret: false }),
      ).rejects.toThrowError();

      // even though `secret` is incorrect here, it shouldn't matter in dev mode.
      await expect(
        loader.load({ name: 'config', schema: schemas.bot.config, secret: true }),
      ).resolves.toBeDefined();
    }
  });

  it('should load from standard docker paths in production mode', async () => {
    process.env.NODE_ENV = 'production';
    expect(
      () => configLoader(`${process.cwd()}/../../config`),
      'configLoader always uses Docker paths in production mode',
    ).toThrow(TypeError);

    const loader = configLoader();

    expect(loader.getLoadPath({ name: 'config.json', secret: false })).toEqual(
      new URL('file:/config.json'),
    );
    expect(loader.getLoadPath({ name: 'config.json', secret: true })).toEqual(
      new URL('file:/run/secrets/config.json'),
    );
  });
});
