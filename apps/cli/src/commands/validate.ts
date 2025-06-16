import * as p from '@clack/prompts';
import pc from 'picocolors';
import { Command } from 'clipanion';
import { ConfigurableCommand2 } from '../util/classes.ts';
import { commandsSchema } from '../util/commandSchema.ts';

export class ValidateCommand extends ConfigurableCommand2 {
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

    const loader = await this.getConfigLoader();
    await loader.load({ name: 'commands', schema: commandsSchema, secret: false });

    spin.stop(pc.green('✔︎ commands.json validated'));
  }
}
