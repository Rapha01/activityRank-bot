import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { configLoader, schemas } from '@activityrank/cfg';
import * as p from '@clack/prompts';
import { Command } from 'clipanion';
import pc from 'picocolors';
import invariant from 'tiny-invariant';
import { z } from 'zod/v4';
import { ConfigurableCommand2 } from '../util/classes.ts';
import { formatFile } from '../util/format.ts';
import { findWorkspaceConfig } from '../util/loaders.ts';

export class UpdateConfigCommand extends ConfigurableCommand2 {
  override hideConfigPath = true;
  static override paths = [['update-config']];
  static override usage = Command.Usage({
    category: 'Develop',
    description: `Update all JSON Schema config files (${pc.green('config/*.schema.json')}).`,
    details: `
      Reads schemas from the ${pc.green('@activityrank/cfg')} library and uses them 
      to update the JSON Schema definitions in \`config\`.
    `,
  });

  override async execute() {
    p.intro();
    const configRoot = await findWorkspaceConfig();

    const keys = [
      { file: 'config', schema: schemas.config },
      { file: 'keys', schema: schemas.keys },
    ];

    for (const key of keys) {
      // target `draft-7` because the most-used VSCode extension doesn't support `2020-12`
      const jsonSchema = z.toJSONSchema(key.schema, { target: 'draft-7' });
      // make fields all optional (different services require different keys)
      delete jsonSchema.required;

      const schemaFilePath = path.join(configRoot, `${key.file}.schema.json`);
      await writeFile(schemaFilePath, JSON.stringify(jsonSchema));
      await formatFile(schemaFilePath);
    }

    async function loadFile(
      path: string,
    ): Promise<{ exists: true; contents: string } | { exists: false }> {
      try {
        const contents = await readFile(path, 'utf-8');
        return { exists: true, contents };
      } catch (e) {
        if ((e as NodeJS.ErrnoException).code === 'ENOENT') {
          return { exists: false };
        }
        throw e;
      }
    }

    const loader = await configLoader();

    const errors = [];
    for (const key of keys) {
      const exampleName = `${key.file}.example.json`;
      const valueName = `${key.file}.json`;

      const example = await loadFile(path.join(configRoot, exampleName));
      const value = await loadFile(path.join(configRoot, valueName));

      const files = [
        [exampleName, example],
        [valueName, value],
      ] as const;

      for (const [filename, file] of files) {
        if (!file.exists) {
          // some config files might not need .example schemas, so skip
          continue;
        }

        const loaded = await loader.safeLoadString(file.contents, key.schema);
        if (!loaded.ok) {
          if (loaded.type === 'parserError') {
            errors.push({ type: 'parserError', causes: loaded.causes, filename } as const);
          } else if (loaded.type === 'zodError') {
            errors.push({ type: 'zodError', cause: loaded.cause, filename } as const);
          } else {
            assertUnreachable(loaded);
          }
        }
      }
    }

    // TODO: run Biome to format

    p.log.message('schema files updated', { symbol: pc.green('✔︎') });

    if (errors.length > 0) {
      for (const error of errors) {
        if (error.type === 'parserError') {
          invariant(error.causes);
          p.note(
            error.causes.map((cause) => cause.toString()).join('\n\n---\n\n'),
            pc.red(`Failed to parse ${error.filename} to JSON or TOML`),
          );
        } else if (error.type === 'zodError') {
          invariant(error.cause);
          p.note(
            z.prettifyError(error.cause),
            pc.red(`Failed to parse ${error.filename} to the schema`),
          );
        } else {
          assertUnreachable(error);
        }
      }

      p.cancel('Check your config files.');
    } else {
      p.outro('Config files match their schemas.');
    }

    // TODO: support TOML
  }
}

function assertUnreachable(_: never): never {
  throw new TypeError(
    'Reached an assertUnreachable() statement. This should never happen at runtime because TypeScript should check it.',
  );
}
