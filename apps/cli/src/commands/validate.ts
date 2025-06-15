import * as p from '@clack/prompts';
import pc from 'picocolors';
import { Command } from 'clipanion';
import { commandsSchema } from '../util/commandSchema.ts';
import { getConfigLoader } from '../util/loaders.ts';

export class ValidateCommand extends Command {
  static override paths = [['validate']];
  static override usage = Command.Usage({
    category: 'Develop',
    description: `Validate ${pc.green('config/commands.json')}.`,
    details: `
      Checks that ${pc.green('config/commands.json')} is a valid list of commands.
    `,
  });

  override async execute() {
    const spin = p.spinner();
    spin.start('Validating config...');

    const loader = await getConfigLoader();
    await loader.load({ name: 'commands', schema: commandsSchema, secret: false });

    spin.stop(pc.green('✔︎ commands.json validated'));
  }
}
