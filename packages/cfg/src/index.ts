import type { z } from 'zod';
import { readFile } from 'node:fs/promises';
import * as schemas from './schemas.js';

interface LoadOptions<T extends z.ZodTypeAny> {
  name: string;
  schema: T;
  secret: boolean;
}

function configLoader(basePath?: URL | string | null) {
  if (process.env.NODE_ENV === 'production' && basePath) {
    throw new TypeError('[@activityrank/cfg] basePath should not be provided in production mode.');
  }
  if (process.env.NODE_ENV === 'development' && !basePath) {
    throw new TypeError('[@activityrank/cfg] basePath must be provided in development mode.');
  }

  const path = basePath ? new URL(basePath) : null;
  function getLoadPath(opts: { name: string; secret: boolean }): URL {
    return path
      ? new URL(opts.name, path)
      : opts.secret
        ? new URL(opts.name, 'file:/run/secrets')
        : new URL(opts.name, 'file:/');
  }

  async function load<T extends z.ZodTypeAny>(opts: LoadOptions<T>): Promise<z.infer<T>> {
    const loadPath = getLoadPath(opts);

    const file = await readFile(loadPath);
    const contents = JSON.parse(file.toString());

    return opts.schema.parse(contents);
  }

  return { getLoadPath, load, path };
}

export { configLoader, schemas };
