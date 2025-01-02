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

    // const loader = configLoader(process.env.CONFIG_PATH ?? new URL('config', process.cwd()));
    const loaders = [
      configLoader(new URL('config/', `file:${process.cwd()}/../..`)),
      configLoader(`file:${process.cwd()}/../../config/`),
    ];

    expect(() => configLoader(), 'configLoader requires a path in dev mode').toThrow(TypeError);

    for (const loader of loaders) {
      expect(loader.getLoadPath({ name: 'config.json', secret: false })).toEqual(
        new URL(`file:${process.cwd()}/../../config/config.json`),
      );

      expect(
        async () => await loader.load({ name: 'config.example.json', schema: schemas.bot.config, secret: false }),
      ).to.not.throw();
      expect(
        loader.load({ name: 'config.example.json', schema: schemas.bot.keys, secret: false }),
      ).rejects.toThrowError();
      // even though `secret` is incorrect here, it doesn't matter in dev mode
      expect(
        async () => await loader.load({ name: 'config.example.json', schema: schemas.bot.config, secret: true }),
      ).to.not.throw();
    }
  });

  it('should load from standard docker paths in production mode', async () => {
    process.env.NODE_ENV = 'production';
    expect(
      () => configLoader(new URL('config', `file:${process.cwd()}`)),
      'configLoader always uses Docker paths in production mode',
    ).toThrow(TypeError);

    const loader = configLoader();

    expect(loader.getLoadPath({ name: 'config.json', secret: false })).toEqual(new URL('config.json', 'file:/'))
    expect(loader.getLoadPath({ name: 'config.json', secret: true })).toEqual(new URL('config.json', 'file:/run/config'))
  });
});
