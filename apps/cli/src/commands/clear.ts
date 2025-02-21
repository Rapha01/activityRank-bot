import { z } from 'zod';
import * as p from '@clack/prompts';
import pc from 'picocolors';
import { Command, Option } from 'clipanion';
import { DiscordCommandManagementCommand } from '../util/classes.ts';

const snowflakeSchema = z.string().regex(/^\d{17,20}$/);

export class ClearCommand extends DiscordCommandManagementCommand {
  static override paths = [['clear']];
  static override usage = Command.Usage({
    category: 'Deploy',
    description: 'Clear local Slash Commands.',
    details: `
      Clears the bot's Slash Commands. This command should mostly be used in development.

      If a list of guild IDs is provided, all global and guild-specific commands will be cleared 
      in the list of guild IDs. Otherwise, the list defined in \`config.developmentServers\` will be used.
    `,
    examples: [['Clear slash commands globally and from `config.developmentServers`', '$0 clear']],
  });

  guildIds = Option.Rest({ required: 0 });

  override async execute() {
    p.intro(pc.bgCyan(pc.blackBright('  Clear Local Commands  ')));

    await super.execute();

    const api = this.getApi();
    const guilds = z
      .array(snowflakeSchema)
      .parse(this.guildIds.length > 0 ? this.guildIds : this.config.developmentServers);

    const spin = p.spinner();
    spin.start('Clearing commands...');

    await api.applicationCommands.bulkOverwriteGlobalCommands(this.keys.botId, []);
    for (const [i, guild] of guilds.entries()) {
      spin.message(`Clearing commands [${i}/${guilds.length}]`);
      await api.applicationCommands.bulkOverwriteGuildCommands(this.keys.botId, guild, []);
    }

    spin.stop(`Cleared global commands and local commands from ${guilds.length} guilds`);
  }
}
export class ClearProductionCommand extends DiscordCommandManagementCommand {
  static override paths = [['clear', 'production']];
  static override usage = Command.Usage({
    category: 'Deploy',
    description: 'Clear production Slash Commands.',
    details: `
      Clears the bot's Slash Commands. This command should mostly be used in production.

      This command can be used to clear either all globally deployed commands, or all 
      locally deployed commands in \`config.developmentServers\` - which should be admin commands.
    `,
    examples: [
      ['Clear globally deployed slash commands', '$0 clear production'],
      [
        'Clear locally deployed slash commands in `config.developmentServers`',
        '$0 clear production',
      ],
    ],
  });

  override async execute() {
    p.intro(pc.bgCyan(pc.blackBright('  Clear Production Commands  ')));

    await super.execute();

    const api = this.getApi();
    const type = await p.select({
      message: `You are clearing with ${pc.cyan('production credentials')}. What commands would you like to clear?`,
      options: [
        { label: 'Clear globally deployed commands', value: 'GLOBAL' },
        { label: 'Clear administrative commands', value: 'ADMIN' },
      ],
    });

    if (type === 'GLOBAL') {
      await api.applicationCommands.bulkOverwriteGlobalCommands(this.keys.botId, []);

      p.outro(
        `Successfully cleared all global commands. Run ${pc.magenta('activityrank deploy production')} to recreate them.`,
      );
    } else if (type === 'ADMIN') {
      for (const guild of this.config.developmentServers) {
        await api.applicationCommands.bulkOverwriteGuildCommands(this.keys.botId, guild, []);
      }

      p.outro(
        `Successfully cleared local commands in ${this.config.developmentServers.length} servers.
        Run ${pc.magenta('activityrank deploy production')} to recreate them.`,
      );
    }
  }
}
