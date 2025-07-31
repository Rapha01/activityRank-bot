import path from 'node:path';
import { readFile } from 'node:fs/promises';
import { findWorkspaceDir } from '@pnpm/find-workspace-dir';
import { z } from 'zod/v4';
import { parse as parseToml, TomlError } from 'smol-toml';
import parseJson, { JSONError } from 'parse-json';
import * as schemas from './schemas.js';

type LoadOptions<T extends z.ZodTypeAny> = {
  name: string;
  schema: T;
  secret: boolean;
};

async function configLoader() {
  const isProduction = process.env.NODE_ENV === 'production';

  let configPath: string;
  let secretPath: string;

  if (isProduction) {
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

  function getLoadPaths(opts: { name: string; secret?: boolean }): string[] {
    const resPath = opts.secret ? secretPath : configPath;
    return [
      path.join(resPath, opts.name),
      path.join(resPath, `${opts.name}.json`),
      path.join(resPath, `${opts.name}.toml`),
    ];
  }

  async function loadString<T extends z.ZodTypeAny>(
    content: string,
    schema: T,
    name: string,
  ): Promise<z.infer<T>> {
    const failedParse = Symbol();

    let value: unknown = failedParse;
    const parsers: ((input: string) => unknown)[] = [parseJson, parseToml];
    for (const parser of parsers) {
      try {
        value = parser(content);
        break;
      } catch (error) {
        // if the parsing fails, just continue
        if (error instanceof JSONError || error instanceof TomlError) {
          continue;
        }
        throw error;
      }
    }

    if (value === failedParse) {
      throw new Error(`Failed to parse config "${name}" as JSON or TOML.`);
    }

    const parsed = await schema.safeParseAsync(value);

    if (!parsed.success) {
      throw new Error(
        `Failed to parse config "${name}" to the provided schema.\n\n---\n\n${z.formatError(parsed.error)}`,
      );
    }
    return parsed.data;
  }

  async function load<T extends z.ZodTypeAny>(opts: LoadOptions<T>): Promise<z.infer<T>> {
    // check if the provided path has an extension
    const match = /(.*)\..*$/.exec(opts.name);
    if (match) {
      console.warn(
        `Loading file with name "${opts.name}". Files have their .json extensions appended to them by default. Did you mean to use "${match[1]}" instead?`,
      );
    }
    const loadPaths = getLoadPaths(opts);

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
        `Failed to find file with name "${opts.name}". Expected to find file at "${loadPaths[0]}" (or with other file extensions).`,
      );
    }

    return await loadString(content, opts.schema, opts.name);
  }

  return { getLoadPaths, load, loadString };
}

export { configLoader, schemas };
