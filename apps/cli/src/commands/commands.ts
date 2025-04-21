import { z } from 'zod';
import * as t from 'typanion';
import pc from 'picocolors';
import { Command, Option, UsageError } from 'clipanion';
import { DiscordCommandManagementCommand } from '../util/classes.ts';
import {
  ApplicationCommandOptionType,
  ChannelType,
  type APIApplicationCommand,
  type APIApplicationCommandOption,
} from 'discord-api-types/v10';
import { configLoader } from '@activityrank/cfg';

const snowflakeSchema = z.string().regex(/^\d{17,20}$/);

export class CommandsCommand extends DiscordCommandManagementCommand {
  static override paths = [['commands']];
  static override usage = Command.Usage({
    category: 'Deploy',
    description: 'Get Slash Commands.',
    details: `
      Gets information about the bot's deployed Slash Commands.

      Either a guild ID or \`global\` may be provided as the guildId to load commands from.
      By default, the CLI will print a formatted list of 
      ${pc.underline("all the bot's commands")} in the specified guild.
    `,
  });

  raw = Option.Boolean('-r,--raw', {
    required: false,
    description: 'Return the raw Discord output in JSON format.',
  });

  filter = Option.String('-f,--filter', {
    required: false,
    description: 'Only show a single command - either provide its name or its ID.',
  });

  // TODO: implement this option
  // diff = Option.Boolean('-d,--diff', {
  //   required: false,
  //   description: 'Compare the currently deployed commands to the ones that would be deployed.',
  // });

  guildId = Option.String({
    validator: t.isOneOf([
      t.isLiteral('global'),
      t.cascade(t.isString(), t.matchesRegExp(/^\d{17,20}$/)),
    ]),
  });

  static override schema = [
    t.hasMutuallyExclusiveKeys(['raw', 'filter'], { missingIf: 'undefined' }),
    t.hasMutuallyExclusiveKeys(['raw', 'diff'], { missingIf: 'undefined' }),
  ];

  formatOption(parents: string[], option: APIApplicationCommandOption): string {
    const indent = ' '.repeat(4 * parents.length);

    if (option.type === ApplicationCommandOptionType.Subcommand) {
      const newParents = [...parents, option.name];
      return [
        `${indent}${pc.green('/')}${newParents.map((p) => pc.blue(p)).join(' ')}`,
        `${indent}    ${option.description}`,
        option.options?.map((opt) => this.formatOption(newParents, opt)).join(''),
      ]
        .flat()
        .filter((l) => l !== undefined)
        .join('\n');
    }

    // TODO: format subcommand groups
    if (option.type === ApplicationCommandOptionType.SubcommandGroup) {
      return `${indent}[SUBCOMMAND GROUP ${option.name}]`;
    }

    let numberRange: string | undefined = undefined;
    if (
      option.type === ApplicationCommandOptionType.Integer ||
      option.type === ApplicationCommandOptionType.Number
    ) {
      if (option.min_value !== undefined && option.max_value !== undefined) {
        numberRange = `${pc.magenta(option.min_value)}${pc.gray('..')}${pc.magenta(option.max_value)}`;
      } else if (option.min_value !== undefined) {
        numberRange = `${pc.magenta(option.min_value)}${pc.gray('..')}`;
      } else if (option.max_value !== undefined) {
        numberRange = `${pc.gray('..')}${pc.magenta(option.max_value)}`;
      }
    }

    if (
      option.type === ApplicationCommandOptionType.String &&
      (option.min_length !== undefined || option.max_length !== undefined)
    ) {
      if (option.min_length !== undefined && option.max_length !== undefined) {
        numberRange = `${pc.blue(option.min_length)}${pc.gray('..')}${pc.blue(option.max_length)}`;
      } else if (option.min_length !== undefined) {
        numberRange = `${pc.blue(option.min_length)}${pc.gray('..')}`;
      } else if (option.max_length !== undefined) {
        numberRange = `${pc.gray('..')}${pc.blue(option.max_length)}`;
      }
      numberRange += pc.blue(' chars');
    }

    const top = [
      indent,
      pc.gray('• '),
      pc.green(option.name),
      ' [',
      option.required ? pc.red('REQUIRED ') : undefined,
      'autocomplete' in option && option.autocomplete ? pc.blue('autocompleted ') : undefined,
      pc.gray(ApplicationCommandOptionType[option.type]),
      '] ',
      numberRange,
    ].join('');

    const submenus = [
      (option.type === ApplicationCommandOptionType.Integer ||
        option.type === ApplicationCommandOptionType.Number ||
        option.type === ApplicationCommandOptionType.String) &&
      option.choices
        ? `Choices: ${option.choices?.map((c) => pc.magenta(c.name)).join(pc.gray(', '))}`
        : undefined,
      option.type === ApplicationCommandOptionType.Channel
        ? option.channel_types
          ? `Types: ${option.channel_types.map((t) => pc.magenta(ChannelType[t])).join(pc.gray(', '))}`
          : pc.green('All Channel Types')
        : undefined,
    ]
      .filter((v) => v !== undefined)
      .map((v) => `${indent}    ${pc.gray('•')} ${v}`)
      .join('\n');

    return `${top}\n${submenus}`;
  }

  formatCommand(command: APIApplicationCommand): string {
    const indent = ' '.repeat(4);
    return [
      `${pc.green('/')}${pc.blue(command.name)} ${pc.gray(`(${command.id})`)}`,
      `${indent}${command.description}`,
      command.options?.map((o) => this.formatOption([command.name], o)),
    ]
      .flat()
      .filter((l) => l !== undefined)
      .join('\n');
  }

  override async execute() {
    // super.execute() is intentionally not called here to avoid printing before the `this.raw` path returns.
    // this.loadConfig() should function the same.
    const loader = configLoader(
      this.configPath ?? process.env.CONFIG_PATH ?? (await this.findWorkspaceConfig()),
    );
    await this.loadConfig(loader);
    const api = this.getApi();

    const global = Symbol('global');
    const guildId =
      this.guildId.toLowerCase() === 'global' ? global : snowflakeSchema.parse(this.guildId);

    let commands =
      guildId === global
        ? await api.applicationCommands.getGlobalCommands(this.keys.botId)
        : await api.applicationCommands.getGuildCommands(this.keys.botId, guildId);

    if (this.raw) {
      console.log(JSON.stringify(commands));
      return;
    }

    const botInfo = await api.applications.getCurrent();

    console.log(
      pc.bgCyan(
        `  ${pc.blueBright(`${botInfo.name}'s`)} ${pc.blackBright('Commands')} [${pc.red(commands.length)}]  \n`,
      ),
    );

    if (this.filter) {
      this.filter = this.filter.split(' ')[0].trim();
      commands = commands.filter(
        (command) => command.id === this.filter || command.name === this.filter,
      );
      if (commands.length < 1) {
        throw new UsageError(`Failed to find a command with ID or name "${this.filter}".`);
      }
    }

    console.log(commands.map((c) => this.formatCommand(c)).join('\n'));
  }
}
