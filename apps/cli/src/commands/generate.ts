import { join as joinPath } from 'node:path';
import { createWriteStream } from 'node:fs';
import type { Writable } from 'node:stream';
import type { z } from 'zod';
import * as p from '@clack/prompts';
import pc from 'picocolors';
import { Command, Option, UsageError } from 'clipanion';
import { ConfigurableCommand } from '../util/classes.ts';
import {
  ApplicationCommandOptionType,
  ApplicationCommandType,
  ApplicationIntegrationType,
  InteractionContextType,
} from 'discord-api-types/v10';
import { configLoader, schemas } from '@activityrank/cfg';
import {
  commandsSchema,
  type chatInputCommandSchema,
  type subcommandOptionSchema,
} from '../util/commandSchema.ts';

class ObjectTypeBuilder {
  #internal = new Map<string, { value: string; optional: boolean }>();
  #used = false;

  addKey(key: string, value: string | ObjectTypeBuilder, optional = false): void {
    if (value instanceof ObjectTypeBuilder) {
      if (value.used) {
        throw new Error('value has already been consumed');
      }

      // indent each line by 2 spaces
      const val = value
        .consume()
        .split('\n')
        .map((l) => `  ${l}`)
        .join('\n');

      this.#internal.set(key, { value: val, optional });
    } else {
      this.#internal.set(key, { value, optional });
    }
  }

  consume(indent = 0): string {
    this.#used = true;
    const entries = [...this.#internal.entries()];
    // this is not 100% accurate, but good enough.
    // An example of something this would permit unquoted would be "1a".
    const quote = (key: string) => (/^\w+$/.test(key) ? key : `'${key}'`);

    const i = ' '.repeat(indent);

    return [
      `${i}{`,
      entries.map(([k, v]) => `${i}  ${quote(k)}${v.optional ? '?:' : ':'} ${v.value};`).join('\n'),
      `${i}}`,
    ].join('\n');
  }

  get used() {
    return this.#used;
  }

  static fromArray(
    arr: { key: string; value: string | ObjectTypeBuilder; optional?: boolean }[],
  ): ObjectTypeBuilder {
    const builder = new ObjectTypeBuilder();
    for (const i of arr) {
      builder.addKey(i.key, i.value, i.optional);
    }
    return builder;
  }
}

export class GenerateCommand extends ConfigurableCommand {
  static override paths = [['generate'], ['gen']];
  static override usage = Command.Usage({
    category: 'Develop',
    description: 'Generate command autocompletions.',
    details: `
      Updates the generated file specified by ${pc.magenta('--output')} to the types 
      specified in ${pc.green('config/commands.json')}.
    `,
  });

  outputFile = Option.String('-o,--output', {
    required: false,
    description:
      'The file to output to. Use `-` to output to stdout. Defaults to `apps/bot/src/bot/commands.generated.ts`.',
  });

  /**
   * Given a command declaration, returns whether the command's interaction is likely to be uncached by Discord.JS.
   * This is useful when declaring the generic type provided to `ChatInputCommandInteraction`;
   * if maybeUncached is true the generic should not be defined, while if it's false it should be safe to
   * use the more useful `ChatInputCommandInteraction<"cached">` type.
   */
  maybeUncachedCommand(command: z.infer<typeof commandsSchema>[number]): boolean {
    // commands in guilds should always be cached; DMs are unlikely to be
    // therefore, if the command has a DM context or can be user-installed
    // it is labelled as potentially uncached
    if (command.integration_types?.includes(ApplicationIntegrationType.UserInstall)) {
      return true;
    }
    if (!command.contexts) {
      // defaults to guild-only
      return false;
    }
    return (
      command.contexts.includes(InteractionContextType.BotDM) ||
      command.contexts.includes(InteractionContextType.PrivateChannel)
    );
  }

  /**
   * Generate typings from a command-like object (either a context menu command, a chat input command, or a subcommand).
   *
   * `id` should be the name of the subcommand; for the subcommand "like" of the "add" command
   * (written in Discord as "/add like"), the `id` argument should be "add like".
   */
  generateCommandLikeTypings(
    id: string,
    maybeUncached: boolean,
    commandLike:
      | { type: 'command'; value: z.infer<typeof chatInputCommandSchema> }
      | { type: 'subcommand'; value: z.infer<typeof subcommandOptionSchema> },
  ): string {
    const cachedGeneric = maybeUncached ? '' : "<'cached'>";
    const wrapInputType = (inputType: string) =>
      `export function command(options: ${inputType}): Command`;

    if (!commandLike.value.options || commandLike.value.options.length < 1) {
      // very simple command; no options at all
      return wrapInputType(`{
        name: '${id}';
        predicate?: PredicateConfig;
        execute: (args: { interaction: ChatInputCommandInteraction${cachedGeneric}; client: Client }) => CommandReturn;
      }`);
    }

    const autocompletableOptions = commandLike.value.options.filter(
      (o) => 'autocomplete' in o && o.autocomplete,
    );

    function getOptionResult(optionType: ApplicationCommandOptionType): string {
      switch (optionType) {
        case ApplicationCommandOptionType.Boolean:
          return 'boolean';
        case ApplicationCommandOptionType.Integer:
        case ApplicationCommandOptionType.Number:
          return 'number';
        case ApplicationCommandOptionType.String:
          return 'string';
        case ApplicationCommandOptionType.Channel:
        case ApplicationCommandOptionType.Mentionable:
        case ApplicationCommandOptionType.Attachment:
        case ApplicationCommandOptionType.Role:
        case ApplicationCommandOptionType.User:
          return 'TODO';
        case ApplicationCommandOptionType.Subcommand:
        case ApplicationCommandOptionType.SubcommandGroup:
          throw new Error('Impossible invariant');
      }
    }

    const res = new ObjectTypeBuilder();
    res.addKey('name', `'${id}'`);
    res.addKey('predicate', 'PredicateConfig', true);

    const executeArgs = new ObjectTypeBuilder();
    executeArgs.addKey('interaction', `ChatInputCommandInteraction${cachedGeneric}`);
    executeArgs.addKey('client', 'Client');
    executeArgs.addKey(
      'options',
      ObjectTypeBuilder.fromArray(
        commandLike.value.options.map((o) => ({
          key: o.name,
          required: o.required,
          value: 'choices' in o && o.choices ? o.choices.join('|') : getOptionResult(o.type),
        })),
      ),
    );

    res.addKey('execute', `(args: ${executeArgs.consume(2)}) => CommandReturn`);

    if (autocompletableOptions.length > 0) {
      const autocompletes = new ObjectTypeBuilder();
      for (const option of autocompletableOptions) {
        const isNumber =
          option.type === ApplicationCommandOptionType.Integer ||
          option.type === ApplicationCommandOptionType.Number;
        autocompletes.addKey(
          option.name,
          `(args: { interaction: ChatInputCommandInteraction${cachedGeneric}; client: Client; focusedValue: ${isNumber ? 'number' : 'string'} }) => CommandReturn`,
        );
      }

      res.addKey('autocompletes', autocompletes);
    }

    return wrapInputType(res.consume());
  }

  generateCommandTypings(command: z.infer<typeof commandsSchema>[number]): string {
    const isChatInput = command.type === ApplicationCommandType.ChatInput;

    const maybeUncached = this.maybeUncachedCommand(command);
    const cachedGeneric = maybeUncached ? '' : "<'cached'>";

    const wrapInputType = (inputType: string) =>
      `export function command(options: ${inputType}): Command`;

    if (!isChatInput) {
      const interaction =
        command.type === ApplicationCommandType.Message
          ? 'MessageContextMenuCommandInteraction'
          : 'UserContextMenuCommandInteraction';

      return wrapInputType(`{
        name: '${command.name}';
        predicate?: PredicateConfig;
        execute: (args: { interaction: ${interaction}${cachedGeneric}; client: Client }) => CommandReturn;
      }`);
    }

    if (!command.options || command.options.length < 1) {
      // VERY simple command; no options at all
      return wrapInputType(`{
        name: '${command.name}';
        predicate?: PredicateConfig;
        execute: (args: { interaction: ChatInputCommandInteraction${cachedGeneric}; client: Client }) => CommandReturn;
      }`);
    }

    const isSubcommandOrGroup = (type: ApplicationCommandOptionType) =>
      type === ApplicationCommandOptionType.Subcommand ||
      type === ApplicationCommandOptionType.SubcommandGroup;

    const commandBases = command.options
      .filter((opt) => isSubcommandOrGroup(opt.type))
      .flatMap((opt) => {
        if (opt.type === ApplicationCommandOptionType.Subcommand) {
          return { id: `${command.name} ${opt.name}`, data: opt };
        }
        if (opt.type === ApplicationCommandOptionType.SubcommandGroup) {
          return opt.options.map((opt2) => ({
            id: `${command.name} ${opt.name} ${opt2.name}`,
            data: opt2,
          }));
        }
        throw new Error('invariant');
      });

    if (commandBases.length > 0) {
      return commandBases
        .map((base) =>
          this.generateCommandLikeTypings(base.id, maybeUncached, {
            type: 'subcommand',
            value: base.data,
          }),
        )
        .join('\n');
    }

    return this.generateCommandLikeTypings(command.name, maybeUncached, {
      type: 'command',
      value: command,
    });
  }

  override async execute() {
    const spin = p.spinner();
    spin.start('Loading config...');

    const loader = configLoader(
      this.configPath ?? process.env.CONFIG_PATH ?? (await this.findWorkspaceConfig()),
    );

    this.config = await loader.load({
      name: 'config',
      schema: schemas.bot.config,
      secret: false,
    });
    this.keys = await loader.load({ name: 'keys', schema: schemas.bot.keys, secret: true });
    const commands = await loader.load({ name: 'commands', schema: commandsSchema, secret: false });

    spin.stop('Loaded config');

    const output = [
      `/* 🛠️ This file was generated with \`activityrank generate\` on ${new Date().toDateString()}. */\n\n`,
      // TODO: import type PredicateConfig
      'type CommandReturn = Promise<void> | void\n\n',
    ];

    let outputStream: Writable;

    if (this.outputFile) {
      if (this.outputFile.trim() === '-') {
        outputStream = process.stdout;
      } else {
        outputStream = createWriteStream(this.outputFile);
      }
    } else {
      const wsRoot = await this.findWorkspaceRoot();
      if (!wsRoot) {
        throw new UsageError(
          'Could not find workspace root. Either provide an `--output` option or use an ActivityRank workspace.',
        );
      }
      const outputFile = joinPath(wsRoot, 'apps/bot/src/bot/commands.generated.ts');
      outputStream = createWriteStream(outputFile);
    }

    for (const command of commands) {
      output.push(this.generateCommandTypings(command));
    }
    outputStream.write(output.join('\n'));
  }
}
