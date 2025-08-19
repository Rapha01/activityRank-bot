import { createWriteStream } from 'node:fs';
import { join as joinPath } from 'node:path';
import type { Writable } from 'node:stream';
import { promisify } from 'node:util';
import * as p from '@clack/prompts';
import { Command, Option, UsageError } from 'clipanion';
import {
  ApplicationCommandOptionType,
  ApplicationCommandType,
  ApplicationIntegrationType,
  ChannelType,
  InteractionContextType,
} from 'discord-api-types/v10';
import pc from 'picocolors';
import type { z } from 'zod/v4';
import { ConfigurableCommand2 } from '../util/classes.ts';
import {
  type anyOptionSchema,
  type chatInputCommandSchema,
  commandsSchema,
  type subcommandOptionSchema,
} from '../util/commandSchema.ts';
import { formatFile } from '../util/format.ts';
import { findWorkspaceRoot } from '../util/loaders.ts';

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

export class GenerateCommand extends ConfigurableCommand2 {
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
      'The file to output to. Use `-` to output to stdout. Defaults to `apps/bot/src/bot/util/registry/commands.generated.ts`.',
  });

  postGen = Option.String('--post-gen', {
    required: false,
    hidden: true,
    tolerateBoolean: true,
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
  ): {
    inputDeclaration: string;
    metaOptions: { optionGetters: Record<string, string[]> };
    key: string;
  } {
    const cachedGeneric = maybeUncached ? '' : "<'cached'>";

    if (!commandLike.value.options || commandLike.value.options.length < 1) {
      // very simple command; no options at all
      return {
        inputDeclaration: `{
        name: '${id}';
        predicate?: CommandPredicateConfig;
        execute: (args: { interaction: ChatInputCommandInteraction${cachedGeneric}; client: Client; t: TFunction<'command-content'> }) => CommandReturn;
      }`,
        metaOptions: { optionGetters: {} },
        key: id,
      };
    }

    const autocompletableOptions = commandLike.value.options.filter(
      (o) => 'autocomplete' in o && o.autocomplete,
    );

    function getOptionResult(
      optionType: ApplicationCommandOptionType,
      channelTypes: ChannelType[] = [],
    ): string {
      switch (optionType) {
        case ApplicationCommandOptionType.Boolean:
          return 'boolean';
        case ApplicationCommandOptionType.Integer:
        case ApplicationCommandOptionType.Number:
          return 'number';
        case ApplicationCommandOptionType.String:
          return 'string';
        case ApplicationCommandOptionType.Attachment:
          return 'Attachment';
        case ApplicationCommandOptionType.Role:
          return maybeUncached ? 'Role | APIRole' : 'Role';
        case ApplicationCommandOptionType.User:
          return maybeUncached ? 'User | APIUser' : 'User';
        case ApplicationCommandOptionType.Mentionable:
          return maybeUncached ? 'User | APIUser | Role | APIRole' : 'User | Role';
        case ApplicationCommandOptionType.Channel:
          return `Extract<GuildChannel | ThreadChannel ${maybeUncached ? '| APIChannel' : ''}, { type: ${channelTypes.length > 0 ? 'ChannelType' : channelTypes.map((t) => `ChannelType.${ChannelType[t]}`).join(' | ')}; }>`;
        case ApplicationCommandOptionType.Subcommand:
        case ApplicationCommandOptionType.SubcommandGroup:
          throw new Error('Impossible invariant');
      }
    }

    const res = new ObjectTypeBuilder();
    res.addKey('name', `'${id}'`);
    res.addKey('predicate', 'CommandPredicateConfig', true);

    const executeArgs = new ObjectTypeBuilder();
    executeArgs.addKey('interaction', `ChatInputCommandInteraction${cachedGeneric}`);
    executeArgs.addKey('client', 'Client');
    executeArgs.addKey('t', "TFunction<'command-content'>");
    executeArgs.addKey(
      'options',
      ObjectTypeBuilder.fromArray(
        commandLike.value.options.map((o) => ({
          key: o.name,
          optional: !o.required,
          value:
            'choices' in o && o.choices
              ? o.choices.join('|')
              : getOptionResult(o.type, 'channel_types' in o ? o.channel_types : []),
        })),
      ),
    );

    res.addKey('execute', `(args: ${executeArgs.consume(2)}) => CommandReturn`);

    if (autocompletableOptions.length > 0) {
      const autocompletes = new ObjectTypeBuilder();
      for (const option of autocompletableOptions) {
        autocompletes.addKey(
          option.name,
          `(args: { interaction: AutocompleteInteraction${cachedGeneric}; client: Client; focusedValue: string; t: TFunction<'command-content'> }) => CommandReturn`,
        );
      }

      res.addKey('autocompletes', autocompletes);
    }

    return {
      inputDeclaration: res.consume(),
      metaOptions: {
        optionGetters: Object.fromEntries(
          commandLike.value.options.map((o) => [o.name, this.getOptionTypes(o)]),
        ),
      },
      key: id,
    };
  }

  getOptionTypes(option: z.infer<typeof anyOptionSchema>): string[] {
    switch (option.type) {
      case ApplicationCommandOptionType.Boolean:
      case ApplicationCommandOptionType.Number:
      case ApplicationCommandOptionType.Integer:
      case ApplicationCommandOptionType.String:
        return ['value'];
      case ApplicationCommandOptionType.Channel:
        return ['channel'];
      case ApplicationCommandOptionType.Attachment:
        return ['attachment'];
      case ApplicationCommandOptionType.Role:
        return ['role'];
      case ApplicationCommandOptionType.User:
        return ['user'];
      case ApplicationCommandOptionType.Mentionable:
        return ['member', 'user', 'channel'];
      default:
        throw new Error();
    }
  }

  generateCommandTypings(command: z.infer<typeof commandsSchema>[number]): {
    inputDeclaration: string;
    metaOptions: {
      optionGetters: Record<string, string[]>;
      type: 'base-command' | 'subcommand' | 'message-command' | 'user-command';
    };
    key: string;
  }[] {
    const isChatInput = command.type === ApplicationCommandType.ChatInput;

    const maybeUncached = this.maybeUncachedCommand(command);
    const cachedGeneric = maybeUncached ? '' : "<'cached'>";

    if (!isChatInput) {
      const interaction =
        command.type === ApplicationCommandType.Message
          ? 'MessageContextMenuCommandInteraction'
          : 'UserContextMenuCommandInteraction';

      const type =
        command.type === ApplicationCommandType.Message ? 'message-command' : 'user-command';

      return [
        {
          inputDeclaration: `{
        name: '${command.name}';
        predicate?: CommandPredicateConfig;
        execute: (args: { interaction: ${interaction}${cachedGeneric}; client: Client; t: TFunction<'command-content'> }) => CommandReturn;
      }`,
          metaOptions: { optionGetters: {}, type },
          key: command.name,
        },
      ];
    }

    if (!command.options || command.options.length < 1) {
      // VERY simple command; no options at all
      return [
        {
          inputDeclaration: `{
        name: '${command.name}';
        predicate?: CommandPredicateConfig;
        execute: (args: { interaction: ChatInputCommandInteraction${cachedGeneric}; client: Client; t: TFunction<'command-content'> }) => CommandReturn;
      }`,
          metaOptions: { optionGetters: {}, type: 'base-command' },
          key: command.name,
        },
      ];
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
      return commandBases.map((base) => {
        const generatedTypings = this.generateCommandLikeTypings(base.id, maybeUncached, {
          type: 'subcommand',
          value: base.data,
        });
        return {
          ...generatedTypings,
          metaOptions: { ...generatedTypings.metaOptions, type: 'subcommand' },
        };
      });
    }

    const generatedTypings = this.generateCommandLikeTypings(command.name, maybeUncached, {
      type: 'command',
      value: command,
    });

    return [
      {
        ...generatedTypings,
        metaOptions: { ...generatedTypings.metaOptions, type: 'base-command' },
      },
    ];
  }

  override async execute() {
    p.intro('Generating command typings');

    const loader = await this.getConfigLoader();
    const commands = await loader.loadConfig('commands', { schema: commandsSchema });

    const output = [
      `/* 🛠️ This file was generated with \`activityrank generate\` on ${new Date().toDateString()}. */\n\n`,
      "import { Command, type OptionKey, type CommandPredicateConfig } from './command.js';",
      `import type {
  Attachment,
  AutocompleteInteraction,
  ChatInputCommandInteraction,
  Client,
  ChannelType,
  GuildChannel,
  ThreadChannel,
  MessageContextMenuCommandInteraction,
  Role,
  User,
  UserContextMenuCommandInteraction,
} from 'discord.js';`,
      "import type { TFunction } from 'i18next';",
      'type CommandReturn = Promise<void> | void\n\n',
    ];

    let outputStream: Writable;
    let outputDisplay: string;

    if (this.outputFile) {
      if (this.outputFile.trim() === '-') {
        outputStream = process.stdout;
        outputDisplay = 'stdout';
      } else {
        outputStream = createWriteStream(this.outputFile);
        outputDisplay = this.outputFile;
      }
    } else {
      const wsRoot = await findWorkspaceRoot();
      if (!wsRoot) {
        throw new UsageError(
          'Could not find workspace root. Either provide an `--output` option or use an ActivityRank workspace.',
        );
      }
      const outputFile = joinPath(wsRoot, 'apps/bot/src/bot/util/registry/commands.generated.ts');
      outputStream = createWriteStream(outputFile);
      outputDisplay = outputFile;
    }

    const wrapInputType = (inputType: string) =>
      `export function command(options: ${inputType}): Command`;

    const typings = commands.map((c) => this.generateCommandTypings(c));

    for (const command of typings) {
      output.push(command.map((t) => wrapInputType(t.inputDeclaration)).join('\n'));
    }

    output.push(`export function command(options: any): Command {
  return new Command({
    name: options.name,
    predicate: options.predicate,
    execute: options.execute,
    autocompletes: options.autocompletes,
    options: COMMAND_META[options.name].optionGetters,
  });
}`);

    output.push(
      'export const COMMAND_META: { [k: string]: { optionGetters: Record<string, OptionKey[]>; type: string } } = {',
    );
    for (const command of typings) {
      output.push(command.map((t) => `'${t.key}': ${JSON.stringify(t.metaOptions)},`).join('\n'));
    }
    output.push('};');

    outputStream.write(output.join('\n'));

    await promisify(outputStream.end.bind(outputStream))();

    if (outputDisplay !== 'stdout' && this.postGen !== false) {
      await formatFile(outputDisplay);
    }

    p.outro(`Command typings written to ${pc.gray(outputDisplay)}`);
  }
}
