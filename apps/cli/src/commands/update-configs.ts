import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { schemas } from '@activityrank/cfg';
import * as p from '@clack/prompts';
import { Command } from 'clipanion';
import pc from 'picocolors';
import { z } from 'zod/v4';
import { ConfigurableCommand2 } from '../util/classes.ts';
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
    const configRoot = await findWorkspaceConfig();

    const spin = p.spinner();
    spin.start('Updating schema files...');

    await writeFile(
      path.join(configRoot, 'config.schema.json'),
      JSON.stringify(z.toJSONSchema(schemas.config)),
    );
    await writeFile(
      path.join(configRoot, 'keys.schema.json'),
      JSON.stringify(z.toJSONSchema(schemas.keys)),
    );
    await writeFile(
      path.join(configRoot, 'privileges.schema.json'),
      JSON.stringify(z.toJSONSchema(schemas.privileges)),
    );
    await writeFile(
      path.join(configRoot, 'emoji.schema.json'),
      JSON.stringify(z.toJSONSchema(schemas.emojis)),
    );

    spin.stop(pc.green('✔︎ schema files updated'));
  }
}
