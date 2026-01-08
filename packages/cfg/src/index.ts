import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { findWorkspaceDir } from '@pnpm/find-workspace-dir';
import isDocker from 'is-docker';
import parseJson, { JSONError } from 'parse-json';
import { parse as parseToml, TomlError } from 'smol-toml';
import { z } from 'zod/v4';
import * as schemas from './schemas.ts';

type LoadOptions<T extends z.ZodTypeAny> = {
  schema: T;
  secret: boolean;
};

/**
 * Returns a configured loader bound to the resolved config/secret directories.
 *
 * - If pathOverride is provided it is used as the base path.
 * - If the environment variable `CONFIG_PATH` is set it is used as the base path.
 * - If running in Docker, configs are expected at `/` and secrets at `/run/secrets`.
 * - Otherwise configs and secrets are resolved relative to the pnpm workspace.
 */
async function configLoader(pathOverride?: string) {
  const override = pathOverride ?? process.env.CONFIG_PATH ?? null;

  let configPath: string;
  let secretPath: string;

  if (override) {
    configPath = override;
    secretPath = override;
  } else if (isDocker()) {
    // Configs are mounted into the root dir.
    // Secrets are mounted into `/run/secrets`.
    configPath = path.resolve('/');
    secretPath = path.resolve('/run/secrets');
  } else {
    const workspaceDir = await findWorkspaceDir(process.cwd());
    if (!workspaceDir) {
      throw new Error(
        'Failed to find workspace directory.\n\nConfiguration is resolved relative to the `pnpm-workspace.yaml` file when run outside a Docker container. Ensure your current working directory is inside the monorepo.',
      );
    }
    configPath = path.join(workspaceDir, 'config');
    secretPath = path.join(workspaceDir, 'config');
  }

  function getLoadPaths(name: string, secret: boolean): string[] {
    const base = secret ? secretPath : configPath;
    return [
      path.join(base, name),
      path.join(base, `${name}.json`),
      path.join(base, `${name}.toml`),
    ];
  }

  type ParserError = JSONError | TomlError;
  const parsers: ((s: string) => unknown)[] = [parseJson, parseToml];

  async function safeLoadString<T extends z.ZodTypeAny>(
    content: string,
    schema: T,
  ): Promise<
    | { ok: true; data: z.infer<T> }
    | { ok: false; type: 'parserError'; causes: ParserError[] }
    | { ok: false; type: 'zodError'; cause: z.ZodError }
  > {
    const parsingErrors: ParserError[] = [];
    let value: unknown;
    for (const parse of parsers) {
      try {
        value = parse(content);
        break;
      } catch (err) {
        if (err instanceof JSONError || err instanceof TomlError) {
          parsingErrors.push(err);
          continue;
        }
        // Unknown runtime error during parsing -> rethrow
        throw err;
      }
    }

    if (!value) {
      return { ok: false, type: 'parserError', causes: parsingErrors };
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
        `Failed to validate config "${name}" against the provided schema.\n\n---\n\n${z.prettifyError(loaded.cause)}`,
      );
    }

    // Should be unreachable because union above is exhaustive
    throw new Error('Unexpected error while loading config string.');
  }

  async function load<T extends z.ZodTypeAny>(
    name: string,
    opts: LoadOptions<T>,
  ): Promise<z.infer<T>> {
    if (path.extname(name)) {
      console.warn(
        `Loading file with name "${name}". Note: files without extensions will be resolved to \`${name}.json\` or \`${name}.toml\` automatically.`,
      );
    }

    const files = getLoadPaths(name, opts.secret ?? false);
    const attempted: string[] = [];

    for (const p of files) {
      try {
        const content = await readFile(p, 'utf8');
        return await loadString(content, opts.schema, name);
      } catch (err) {
        const e = err as NodeJS.ErrnoException;
        attempted.push(p);
        if (e.code === 'ENOENT') {
          // Try next path
          continue;
        }
        // Propagate non-ENOENT errors
        throw err;
      }
    }

    throw new Error(
      `Failed to find file with name "${name}". Tried paths:\n${attempted.map((s) => `  - ${s}`).join('\n')}`,
    );
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
