import Path from 'node:path';
import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import type { z } from 'zod/v4';
import * as schemas from './schemas.js';

type LoadOptions<T extends z.ZodTypeAny> =
  | {
      name: string;
      schema: T;
      secret: boolean;
    }
  | {
      name: string;
      schema: T;
      devOnly: true;
    };

function configLoader(basePath?: string | null) {
  if (process.env.NODE_ENV === 'production' && basePath) {
    throw new TypeError('[@activityrank/cfg] basePath should not be provided in production mode.');
  }
  if (process.env.NODE_ENV === 'development' && !basePath) {
    throw new TypeError('[@activityrank/cfg] basePath must be provided in development mode.');
  }

  const path = basePath ? Path.resolve(basePath) : null;

  function getLoadPath(opts: { name: string; secret?: boolean }): URL {
    if (path) {
      // Use `config.json` in dev; `config` for Secrets
      // `path` is only provided in dev, so the .json file ending is valid
      return pathToFileURL(Path.join(path, `${opts.name}.json`));
    }
    // Secrets are mounted into `/run/secrets`. Configs are mounted into the root dir.
    const mountPath = opts.secret ? '/run/secrets' : '/';
    return pathToFileURL(Path.join(mountPath, opts.name));
  }

  async function load<T extends z.ZodTypeAny>(opts: LoadOptions<T>): Promise<z.infer<T>> {
    const match = /(.*)\..*$/.exec(opts.name);
    if (match) {
      console.warn(
        `Loading file with name "${opts.name}". Files have their .json extensions appended to them by default. Did you mean to use "${match[1]}" instead?`,
      );
    }
    const loadPath = getLoadPath(opts);

    const file = await readFile(loadPath);
    const contents = JSON.parse(file.toString());

    return opts.schema.parse(contents);
  }

  return { getLoadPath, load, path };
}

export { configLoader, schemas };
