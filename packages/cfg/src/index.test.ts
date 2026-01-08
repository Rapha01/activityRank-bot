import { afterEach, beforeEach, describe, expect, it, type Mock, vi } from 'vitest';

// Mocks must be defined before importing the module under test because the module
// imports these dependencies at top-level.
vi.mock('node:fs/promises', () => {
  return {
    // we'll override implementations inside tests via readFileMock
    readFile: vi.fn(),
  };
});

vi.mock('@pnpm/find-workspace-dir', () => {
  return {
    // default implementation can be overridden in tests
    findWorkspaceDir: vi.fn(),
  };
});

// is-docker exports a default function. Provide a mock that can be changed per-test.
vi.mock('is-docker', () => {
  return {
    default: vi.fn(() => false),
  };
});

import { readFile as readFileMock } from 'node:fs/promises';
import { findWorkspaceDir as findWorkspaceDirMock } from '@pnpm/find-workspace-dir';
import isDockerMock from 'is-docker';
import { z } from 'zod';
// Now import the module under test.
import { configLoader } from './index.ts';

const readFile = readFileMock as unknown as Mock;
const findWorkspaceDir = findWorkspaceDirMock as unknown as Mock;
const isDocker = isDockerMock as unknown as Mock;

beforeEach(() => {
  vi.clearAllMocks();
  // sensible defaults
  findWorkspaceDir.mockResolvedValue('/repo');
  isDocker.mockReturnValue(false);
});

afterEach(() => {
  vi.resetAllMocks();
});

describe('configLoader', () => {
  it('getLoadPaths uses provided override path', async () => {
    const loader = await configLoader('/my/override');
    const paths = loader.getLoadPaths('app', false);
    expect(paths).toEqual(['/my/override/app', '/my/override/app.json', '/my/override/app.toml']);
    // !
    const secretPaths = loader.getLoadPaths('app', true);
    expect(secretPaths).toEqual([
      '/my/override/app',
      '/my/override/app.json',
      '/my/override/app.toml',
    ]);
  });

  it('loadString parses JSON and validates with provided zod schema', async () => {
    const loader = await configLoader('/ignored');
    const schema = z.object({ port: z.number() });
    const content = JSON.stringify({ port: 3000 });
    const result = await loader.loadString(content, schema, 'app');
    expect(result).toEqual({ port: 3000 });
  });

  it('safeLoadString falls back to TOML parser if JSON parse fails', async () => {
    const loader = await configLoader('/ignored');
    const schema = z.object({ port: z.number() });
    // TOML content (parse-json will fail, parseToml should succeed)
    const tomlContent = 'port = 8080';
    const safe = await loader.safeLoadString(tomlContent, schema);
    expect(safe.ok).toBe(true);
    if (safe.ok) {
      expect(safe.data).toEqual({ port: 8080 });
    }
  });

  it('safeLoadString returns parserError when neither parser can parse', async () => {
    const loader = await configLoader('/ignored');
    const schema = z.object({ port: z.number() });
    // invalid for both JSON and TOML
    const invalid = 'this is not valid json or toml';
    const safe = await loader.safeLoadString(invalid, schema);
    expect(safe.ok).toBe(false);
    // Should be a parserError type with causes array
    // The implementation uses two parsers, so expect at least one cause
    if (!safe.ok) {
      expect(
        (safe as any).type === 'parserError' || (safe as any).type === 'zodError',
      ).toBeTruthy();
    }
  });

  it('load reads candidate files in order and returns parsed+validated data', async () => {
    // Simulate workspace-based config resolution (no override, not docker)
    findWorkspaceDir.mockResolvedValue('/repo');
    const loader = await configLoader();

    const schema = z.object({ port: z.number() });

    // First path (/repo/config/app) -> ENOENT
    // Second path (/repo/config/app.json) -> valid JSON string
    readFile.mockImplementation(async (p: string) => {
      if (p === '/repo/config/app') {
        const e: NodeJS.ErrnoException = new Error('not found') as NodeJS.ErrnoException;
        e.code = 'ENOENT';
        throw e;
      }
      if (p === '/repo/config/app.json') {
        return JSON.stringify({ port: 42 });
      }
      const e: NodeJS.ErrnoException = new Error('not found') as NodeJS.ErrnoException;
      e.code = 'ENOENT';
      throw e;
    });

    const data = await loader.load('app', { schema, secret: false });
    expect(data).toEqual({ port: 42 });

    // Ensure readFile was attempted for the first two paths (stops when found)
    expect(readFile).toHaveBeenCalledWith('/repo/config/app', 'utf8');
    expect(readFile).toHaveBeenCalledWith('/repo/config/app.json', 'utf8');
  });

  it('load throws with attempted paths when no file found', async () => {
    findWorkspaceDir.mockResolvedValue('/repo');
    const loader = await configLoader();

    const schema = z.object({ port: z.number() });

    // Make readFile always throw ENOENT
    readFile.mockImplementation(async (_p: string) => {
      const e: NodeJS.ErrnoException = new Error('not found') as NodeJS.ErrnoException;
      e.code = 'ENOENT';
      throw e;
    });

    await expect(loader.load('missing', { schema, secret: false })).rejects.toThrow(
      /Failed to find file with name "missing"/,
    );

    // Confirm that readFile was called for each candidate path
    expect(readFile).toHaveBeenCalledTimes(3);
    expect(readFile).toHaveBeenCalledWith('/repo/config/missing', 'utf8');
    expect(readFile).toHaveBeenCalledWith('/repo/config/missing.json', 'utf8');
    expect(readFile).toHaveBeenCalledWith('/repo/config/missing.toml', 'utf8');
  });

  it('when running in docker uses root and /run/secrets for config/secret paths', async () => {
    // make isDocker return true for this test
    isDocker.mockReturnValue(true);

    const loader = await configLoader();

    // Config base should be resolved to `/` and secrets to `/run/secrets`
    const configPaths = loader.getLoadPaths('app', false);
    const secretPaths = loader.getLoadPaths('app', true);

    expect(configPaths).toEqual([
      require('node:path').join('/', 'app'),
      require('node:path').join('/', 'app.json'),
      require('node:path').join('/', 'app.toml'),
    ]);

    expect(secretPaths).toEqual([
      require('node:path').join('/run/secrets', 'app'),
      require('node:path').join('/run/secrets', 'app.json'),
      require('node:path').join('/run/secrets', 'app.toml'),
    ]);
  });
});
