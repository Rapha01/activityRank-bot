import { z } from 'zod';
import type {
  RESTPutAPIApplicationCommandsJSONBody,
  RESTPutAPIApplicationGuildCommandsJSONBody,
} from 'discord-api-types/v10';
import * as p from '@clack/prompts';
import pc from 'picocolors';
import { Command, Option } from 'clipanion';
import { DiscordCommandManagementCommand } from '../util/classes.ts';
import { Deploy } from '../util/commandSchema.ts';

const snowflakeSchema = z.string().regex(/^\d{17,20}$/);

export class DeployCommand extends DiscordCommandManagementCommand {
  static override paths = [['deploy']];
  static override usage = Command.Usage({
    category: 'Deploy',
    description: 'Deploy Slash Commands to Discord.',
    details: `
      Deploy the bot's Slash Commands. This command should mostly be used in development.

      If a list of guild IDs is provided, all \`Global\` and \`LocalOnly\` commands will be deployed 
      to the list of guild IDs. Otherwise, they will be deployed to the list defined in \`config.developmentServers\`.
    `,
    examples: [
      ['Deploy to `config.developmentServers`', '$0 deploy'],
      ['Deploy all global commands (to **ALL SERVERS**)', '$0 deploy global'],
      ['Deploy to a specific list of servers', '$0 deploy 123456789123456789 234567890234567890'],
    ],
  });

  global = Option.Boolean('-g,--global', {
    description: `Set this flag to deploy commands to ${pc.underline('all servers')}.`,
    required: false,
  });
  guildIds = Option.Rest({ required: 0 });

  override async execute() {
    p.intro(pc.bgCyan(pc.blackBright('  Development Deployment  ')));

    await super.execute();

    const spin = p.spinner();
    spin.start('Loading internal resources...');

    const api = this.getApi();

    spin.stop('Loaded internals');

    const guilds = z
      .array(snowflakeSchema)
      .parse(this.guildIds.length > 0 ? this.guildIds : this.config.developmentServers);

    const localCommands: RESTPutAPIApplicationGuildCommandsJSONBody = [];
    const globalCommands: RESTPutAPIApplicationGuildCommandsJSONBody = [];

    for (const command of this.commands) {
      if (command.deployment === Deploy.Global) {
        globalCommands.push(command);
      } else if (command.deployment === Deploy.LocalOnly) {
        localCommands.push(command);
      }
    }

    if (this.global) {
      const resp = await p.confirm({
        message: `${pc.bgRed(' Are you sure ')} you want to deploy ${globalCommands.length} commands globally?
        This is a ${pc.green('development command')}; you may have meant ${pc.magenta('activityrank deploy production')}
        instead of the ${pc.magenta('--global')} flag.`,
        initialValue: false,
      });

      if (resp === true) {
        const spin = p.spinner();
        spin.start('Deploying commands...');

        await api.applicationCommands.bulkOverwriteGlobalCommands(this.keys.botId, globalCommands);

        spin.stop(
          `Wrote ${globalCommands.length} commands globally. 
          Commands that were not permitted to be deployed globally have been ignored.`,
        );
      }
    } else {
      const spin = p.spinner();
      spin.start(`Deploying commands [0/${guilds.length} guilds]`);

      for (const [i, guild] of guilds.entries()) {
        spin.message(`Deploying commands [${i}/${guilds.length} guilds]`);
        const commands = [...localCommands, ...globalCommands];
        await api.applicationCommands.bulkOverwriteGuildCommands(this.keys.botId, guild, commands);
      }

      spin.stop(
        `Wrote ${localCommands.length + globalCommands.length} commands to ${guilds.length} guilds.`,
      );
    }
  }
}

export class DeployProductionCommand extends DiscordCommandManagementCommand {
  static override paths = [['deploy', 'production']];
  static override usage = Command.Usage({
    category: 'Deploy',
    description: 'Deploy production Slash Commands to Discord.',
    details: `
      Deploy the bot's Slash Commands. This command should mostly be used with production credentials.
      \`LocalOnly\` slash commands will be ignored when deployed this way.
      
      This command can also be used to update admin commands; they will be updated in 
      all guilds specified in \`config.developmentGuilds\`.
      `,
    examples: [['Update production commands', '$0 deploy production']],
  });

  override async execute() {
    p.intro(pc.bgCyan(pc.blackBright('  Production Deployment  ')));

    await super.execute();

    const spin = p.spinner();
    spin.start('Loading internal resources...');

    const api = this.getApi();

    spin.stop('Loaded internals');

    const type = await p.select({
      message: `You are deploying with ${pc.cyan('production credentials')}. How would you like to deploy?`,
      options: [
        { label: 'Update globally deployed commands', value: 'GLOBAL' },
        { label: 'Update administrative commands', value: 'ADMIN' },
      ],
    });

    if (type === 'GLOBAL') {
      const globalCommands: RESTPutAPIApplicationCommandsJSONBody = [];

      for (const command of this.commands) {
        if (command.deployment === Deploy.Global) {
          globalCommands.push(command);
        }
      }

      await api.applicationCommands.bulkOverwriteGlobalCommands(this.keys.botId, globalCommands);

      p.outro(`Successfully deployed ${globalCommands.length} commands to production.`);
    } else if (type === 'ADMIN') {
      const localCommands: RESTPutAPIApplicationGuildCommandsJSONBody = [];

      for (const command of this.commands) {
        if (command.deployment === Deploy.LocalOnly) {
          localCommands.push(command);
        }
      }

      for (const guild of this.config.developmentServers) {
        await api.applicationCommands.bulkOverwriteGuildCommands(
          this.keys.botId,
          guild,
          localCommands,
        );
      }

      p.outro(
        `Successfully deployed ${localCommands.length} administrative commands to ${this.config.developmentServers.length} production servers.`,
      );
    }
  }
}
