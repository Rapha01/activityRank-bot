import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { findWorkspaceDir } from '@pnpm/find-workspace-dir';
import parseJson, { JSONError } from 'parse-json';
import { parse as parseToml, TomlError } from 'smol-toml';
import { z } from 'zod/v4';
import * as schemas from './schemas.js';

type LoadOptions<T extends z.ZodTypeAny> = {
  schema: T;
  secret: boolean;
};

async function configLoader(pathOverride?: string) {
  const isProduction = process.env.NODE_ENV === 'production';

  const override = pathOverride ?? process.env.CONFIG_PATH ?? null;

  let configPath: string;
  let secretPath: string;

  if (override) {
    configPath = override;
    secretPath = override;
  } else if (isProduction) {
    // Configs are mounted into the root dir.
    // Secrets are mounted into `/run/secrets`.
    configPath = path.resolve('/');
    secretPath = path.resolve('/run/secrets');
  } else {
    const workspaceDir = await findWorkspaceDir(process.cwd());
    if (!workspaceDir) {
      throw new Error(
        'Failed to find workspace directory.\n\nConfiguration is resolved relative to the `pnpm-workspace.yaml` file in development. Either set the `NODE_ENV` environment variable to "production" or ensure your current working directory is inside the monorepo.',
      );
    }
    configPath = path.join(workspaceDir, 'config');
    secretPath = path.join(workspaceDir, 'config');
  }

  function getLoadPaths(name: string, secret: boolean): string[] {
    const resPath = secret ? secretPath : configPath;
    return [
      path.join(resPath, name),
      path.join(resPath, `${name}.json`),
      path.join(resPath, `${name}.toml`),
    ];
  }

  async function safeLoadString<T extends z.ZodTypeAny>(
    content: string,
    schema: T,
  ): Promise<
    | { ok: true; data: z.infer<T> }
    | { ok: false; type: 'parserError'; causes: (JSONError | TomlError)[] }
    | { ok: false; type: 'zodError'; cause: z.ZodError }
  > {
    const failedParse = Symbol();

    let value: unknown = failedParse;
    const errors = [];
    const parsers: ((input: string) => unknown)[] = [parseJson, parseToml];
    for (const parser of parsers) {
      try {
        value = parser(content);
        break;
      } catch (error) {
        // if the parsing fails, just continue
        if (error instanceof JSONError || error instanceof TomlError) {
          errors.push(error);
          continue;
        }
        throw error;
      }
    }

    if (value === failedParse) {
      return { ok: false, type: 'parserError', causes: errors };
    }

    const parsed = await schema.safeParseAsync(value);

    if (!parsed.success) {
      return { ok: false, type: 'zodError', cause: parsed.error };
    }

    return { ok: true, data: parsed.data };
  }

  async function loadString<T extends z.ZodTypeAny>(
    content: string,
    schema: T,
    name: string,
  ): Promise<z.infer<T>> {
    const loaded = await safeLoadString(content, schema);
    if (loaded.ok) {
      return loaded.data;
    }

    if (loaded.type === 'parserError') {
      for (const cause of loaded.causes) {
        console.error(cause);
      }
      throw new Error(`Failed to parse config "${name}" as JSON or TOML.`);
    }
    if (loaded.type === 'zodError') {
      throw new Error(
        `Failed to parse config "${name}" to the provided schema.\n\n---\n\n${z.prettifyError(loaded.cause)}`,
      );
    }

    throw new Error('should never happen: previous clauses should be exhaustive');
  }

  async function load<T extends z.ZodTypeAny>(
    name: string,
    opts: LoadOptions<T>,
  ): Promise<z.infer<T>> {
    // check if the provided path has an extension
    const match = /(.*)\..*$/.exec(name);
    if (match) {
      console.warn(
        `Loading file with name "${name}". Files have their .json extensions appended to them by default. Did you mean to use "${match[1]}" instead?`,
      );
    }
    const loadPaths = getLoadPaths(name, opts.secret);

    let content: string | null = null;
    for (const loadPath of loadPaths) {
      try {
        content = await readFile(loadPath, 'utf8');
        break;
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
          continue;
        }
        throw error;
      }
    }
    if (content === null) {
      throw new Error(
        `Failed to find file with name "${name}". Expected to find file at "${loadPaths[0]}" (or with other file extensions).`,
      );
    }

    return await loadString(content, opts.schema, name);
  }

  async function loadSecret<T extends z.ZodTypeAny>(
    name: string,
    opts: Omit<LoadOptions<T>, 'secret'>,
  ): Promise<z.infer<T>> {
    return await load(name, { ...opts, secret: true });
  }

  async function loadConfig<T extends z.ZodTypeAny>(
    name: string,
    opts: Omit<LoadOptions<T>, 'secret'>,
  ): Promise<z.infer<T>> {
    return await load(name, { ...opts, secret: false });
  }

  return { getLoadPaths, load, loadSecret, loadConfig, loadString, safeLoadString };
}

export { configLoader, schemas };
