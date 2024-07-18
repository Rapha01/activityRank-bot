import { PermissionFlagsBits, ApplicationCommandType } from 'discord.js';
import type {
  APIApplicationCommandBasicOption,
  APIApplicationCommandSubcommandGroupOption,
  APIApplicationCommandSubcommandOption,
  AutocompleteInteraction,
  CacheType,
  ChatInputCommandInteraction,
  Client,
  ContextMenuCommandInteraction,
  PermissionFlags,
  RESTPostAPIApplicationCommandsJSONBody,
  RESTPostAPIChatInputApplicationCommandsJSONBody,
  RESTPostAPIContextMenuApplicationCommandsJSONBody,
  User,
} from 'discord.js';
import { type Serializable, SerializableMap } from './serializableMap.js';

/**
 * The response from a command predicate.
 *
 * A response of Deny will block the command from being run, while a response of Allow will permit its execution.
 */
export enum Predicate {
  Deny,
  Allow,
}

export class UnimplementedError extends TypeError {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
  }
}

export class CommandIndex implements Serializable {
  private key: string[];
  private isContext?: boolean;

  constructor(
    data: ChatInputCommandInteraction | ContextMenuCommandInteraction | (string | null)[],
  ) {
    let key: (string | null)[];

    if (Array.isArray(data)) {
      key = data;
    } else {
      if (data.isContextMenuCommand()) {
        this.isContext = true;
        key = [data.commandName];
      } else {
        key = [
          data.commandName,
          data.options.getSubcommandGroup(false),
          data.options.getSubcommand(false),
        ];
      }
    }

    // TODO: modern versions of TS should allow this typedef to be inferred inline safely
    const isStr = (x: string | null): x is string => x !== null;

    this.key = key.filter(isStr);
  }

  get serialized(): string {
    return this.key.join('.');
  }

  toString(): string {
    return this.isContext
      ? `[Context Command "${this.key.join(' ')}"]`
      : `[Slash Command /${this.key.join(' ')}]`;
  }
}
export class AutocompleteIndex implements Serializable {
  private commandKey: string[];
  private autocompleteName: string;

  constructor(interaction: AutocompleteInteraction);
  constructor(commandKey: (string | null)[], autocompleteName: string);
  constructor(data: AutocompleteInteraction | (string | null)[], autocompleteName?: string) {
    let key: (string | null)[];

    if (Array.isArray(data)) {
      if (!autocompleteName)
        throw new TypeError('autocompleteName is required when initialising AutocompleteIndex');
      key = data;
      this.autocompleteName = autocompleteName;
    } else {
      key = [
        data.commandName,
        data.options.getSubcommandGroup(false),
        data.options.getSubcommand(false),
      ];
      this.autocompleteName = data.options.getFocused();
    }

    // TODO: modern versions of TS should allow this typedef to be inferred inline safely
    const isStr = (x: string | null): x is string => x !== null;

    this.commandKey = key.filter(isStr);
  }

  get serialized(): string {
    return `${this.commandKey.join('.')}%${this.autocompleteName}`;
  }

  toString(): string {
    return `[Autocomplete Command /${this.commandKey.join(' ')} (${this.autocompleteName})]`;
  }
}

type CommandExecutableFunction = (args: {
  interaction: ChatInputCommandInteraction;
  client: Client;
}) => Promise<void> | void;

type ContextCommandExecutableFunction = (args: {
  interaction: ContextMenuCommandInteraction;
  client: Client;
}) => Promise<void> | void;

type AutocompleteFunction = (args: {
  interaction: AutocompleteInteraction;
  client: Client;
}) => Promise<void> | void;

type CommandMap<V> = SerializableMap<CommandIndex, V>;
type AutocompleteMap<V> = SerializableMap<AutocompleteIndex, V>;

/**
 * A callback to be run after a predicate check is denied.
 * This is intended for logging the attempt, if necessary, and for responding to the user running the command.
 */
type InvalidPredicateCallback = (
  interaction: ChatInputCommandInteraction | ContextMenuCommandInteraction,
) => Promise<void>;

/**
 * The result of a predicate check.
 * `status` indicates whether the predicate allows or denies the command's execution.
 * If `status` is `Deny`, `callback` should be called to send a reply to the user.
 */
type PredicateCheck =
  | { status: Predicate.Allow }
  | {
      status: Predicate.Deny;
      callback: InvalidPredicateCallback;
    };

export interface PredicateConfig {
  validate: (user: User) => Predicate;
  invalidCallback: InvalidPredicateCallback;
}

export abstract class Command {
  public abstract readonly data: RESTPostAPIApplicationCommandsJSONBody;
  public abstract readonly permitGlobalDeployment: boolean;
  public abstract execute(
    index: CommandIndex,
    interaction: ChatInputCommandInteraction | ContextMenuCommandInteraction,
  ): Promise<void>;

  public abstract checkPredicate(index: CommandIndex, user: User): PredicateCheck;

  protected evaluatePredicate(predicate: PredicateConfig | null, user: User): PredicateCheck {
    if (!predicate) return { status: Predicate.Allow };

    const status = predicate.validate(user);

    return status === Predicate.Allow
      ? { status }
      : { status, callback: predicate.invalidCallback };
  }
}

export abstract class SlashCommand extends Command {
  public abstract execute(
    index: CommandIndex,
    interaction: ChatInputCommandInteraction,
  ): Promise<void>;

  public abstract autocomplete(
    index: AutocompleteIndex,
    interaction: AutocompleteInteraction,
  ): Promise<void>;
}

type BasicSlashCommandData = Omit<RESTPostAPIChatInputApplicationCommandsJSONBody, 'options'> & {
  options?: APIApplicationCommandBasicOption[];
};

class BasicSlashCommand extends SlashCommand {
  public data: RESTPostAPIChatInputApplicationCommandsJSONBody;

  constructor(
    data: BasicSlashCommandData,
    private predicate: PredicateConfig | null,
    public readonly permitGlobalDeployment: boolean,
    private executables: {
      execute: CommandExecutableFunction;
      autocomplete: AutocompleteMap<AutocompleteFunction>;
    },
  ) {
    super();
    this.data = data;
  }

  public checkPredicate(_idx: CommandIndex, user: User) {
    return this.evaluatePredicate(this.predicate, user);
  }

  public async execute(
    _idx: CommandIndex,
    interaction: ChatInputCommandInteraction<CacheType>,
  ): Promise<void> {
    await this.executables.execute({ interaction, client: interaction.client });
  }

  public async autocomplete(
    idx: AutocompleteIndex,
    interaction: AutocompleteInteraction<CacheType>,
  ): Promise<void> {
    const autocomplete = this.executables.autocomplete.get(idx);
    if (!autocomplete) {
      throw new UnimplementedError(`Autocomplete not implemented: ${idx}`);
    }

    await autocomplete({ interaction, client: interaction.client });
  }
}

class ParentSlashCommand extends SlashCommand {
  public data: RESTPostAPIChatInputApplicationCommandsJSONBody;
  // `predicate` is Omitted here to avoid its accidental use later; predicateMap should be
  // used because it holds the combined predicates for all subcommands up the tree.
  // It is likely that at runtime the CommandMap will include SlashSubcommands in their entirety; this is acceptable.
  private subcommandMap: CommandMap<Omit<SlashSubcommand, 'predicate'>> = new SerializableMap();
  private autocompleteMap: AutocompleteMap<AutocompleteFunction> = new SerializableMap();
  private predicateMap: CommandMap<PredicateConfig | null> = new SerializableMap();

  constructor(
    baseData: Omit<RESTPostAPIChatInputApplicationCommandsJSONBody, 'options'>,
    commandPredicate: PredicateConfig | null,
    public readonly permitGlobalDeployment: boolean,
    options: { subcommands: SlashSubcommand[]; groups: SlashSubcommandGroup[] },
  ) {
    super();

    if (options.subcommands.length < 1 && options.groups.length < 1) {
      throw new Error('A parent slash command must have at least one child subcommand or group.');
    }

    this.data = baseData;
    this.data.options = [];

    for (const subcommand of options.subcommands) {
      const idx = new CommandIndex([this.data.name, subcommand.data.name]);
      this.subcommandMap.set(idx, subcommand);
      // the predicate with the greatest level of specificity is selected.
      this.predicateMap.set(idx, subcommand.predicate ?? commandPredicate ?? null);
      this.data.options.push(subcommand.data);
    }

    for (const group of options.groups) {
      const groupData = group.data;
      groupData.options = [];
      for (const subcommand of group.subcommands) {
        const idx = new CommandIndex([this.data.name, group.data.name, subcommand.data.name]);
        this.subcommandMap.set(idx, subcommand);

        // the predicate with the greatest level of specificity is selected.
        const predicate = subcommand.predicate ?? group.predicate ?? commandPredicate ?? null;
        this.predicateMap.set(idx, predicate);

        groupData.options.push(subcommand.data);
      }
      this.data.options.push(groupData);
    }
  }

  public checkPredicate(idx: CommandIndex, user: User) {
    const predicate = this.predicateMap.get(idx);
    if (predicate === undefined) {
      // This should never happen: `predicate` might be null but should never be undefined.
      throw new Error(`failed to find entry in predicate map for ${idx}`);
    }
    return this.evaluatePredicate(predicate, user);
  }

  public async execute(
    index: CommandIndex,
    interaction: ChatInputCommandInteraction<CacheType>,
  ): Promise<void> {
    const command = this.subcommandMap.get(index);
    if (!command) {
      throw new UnimplementedError(`Failed to find a subcommand for command ${index}`);
    }
    await command.execute({ interaction, client: interaction.client });
  }

  public async autocomplete(
    idx: AutocompleteIndex,
    interaction: AutocompleteInteraction<CacheType>,
  ): Promise<void> {
    const autocomplete = this.autocompleteMap.get(idx);
    if (!autocomplete) {
      throw new UnimplementedError(`Autocomplete not implemented: ${idx}`);
    }

    await autocomplete({ interaction, client: interaction.client });
  }
}

export class SlashSubcommand {
  public readonly execute: CommandExecutableFunction;
  public readonly autocomplete: AutocompleteFunction | null;

  constructor(
    public readonly data: APIApplicationCommandSubcommandOption,
    public readonly predicate: PredicateConfig | null,
    executables: { execute: CommandExecutableFunction; autocomplete?: AutocompleteFunction },
  ) {
    this.execute = executables.execute;
    this.autocomplete = executables.autocomplete ?? null;
  }
}

export class SlashSubcommandGroup {
  constructor(
    public readonly data: APIApplicationCommandSubcommandGroupOption,
    public readonly subcommands: SlashSubcommand[],
    public readonly predicate: PredicateConfig | null,
  ) {
    if (subcommands.length < 1) {
      throw new Error('A slash command subcommand group must have at least one child subcommand.');
    }
  }
}

export const command = {
  basic: function (args: {
    data: BasicSlashCommandData;
    predicate?: PredicateConfig;
    execute: CommandExecutableFunction;
    autocomplete?: AutocompleteMap<AutocompleteFunction>;
    developmentOnly?: boolean;
  }): SlashCommand {
    const predicate = args.predicate ?? null;

    return new BasicSlashCommand(args.data, predicate, !args.developmentOnly, {
      execute: args.execute,
      autocomplete: args.autocomplete ?? new SerializableMap(),
    });
  },
  parent: function (args: {
    data: Omit<RESTPostAPIChatInputApplicationCommandsJSONBody, 'options'>;
    predicate?: PredicateConfig;
    subcommands?: SlashSubcommand[];
    groups?: SlashSubcommandGroup[];
    developmentOnly?: boolean;
  }): SlashCommand {
    const predicate = args.predicate ?? null;
    const components = { subcommands: args.subcommands ?? [], groups: args.groups ?? [] };

    return new ParentSlashCommand(args.data, predicate, !args.developmentOnly, components);
  },
};

export function subcommand(args: {
  data: APIApplicationCommandSubcommandOption;
  predicate?: PredicateConfig;
  execute: CommandExecutableFunction;
  autocomplete?: AutocompleteFunction;
}): SlashSubcommand {
  const predicate = args.predicate ?? null;
  const executables = { execute: args.execute, autocomplete: args.autocomplete };

  return new SlashSubcommand(args.data, predicate, executables);
}

export function subcommandGroup(args: {
  data: APIApplicationCommandSubcommandGroupOption;
  predicate?: PredicateConfig;
  subcommands: SlashSubcommand[];
}): SlashSubcommandGroup {
  return new SlashSubcommandGroup(args.data, args.subcommands, args.predicate ?? null);
}

/**
 * A utility to build permissions fields.
 * @example
 * default_member_permissions = permissions(permissions.KickMember, permissions.BanMember)
 */
export const permissions: PermissionFlags & ((...permissions: bigint[]) => string) = Object.assign(
  (...permissions: bigint[]) => permissions.reduce((prev, current) => prev | current).toString(),
  PermissionFlagsBits,
);

export class ContextCommand extends Command {
  public data: RESTPostAPIContextMenuApplicationCommandsJSONBody;

  constructor(
    data: RESTPostAPIContextMenuApplicationCommandsJSONBody,
    private predicate: PredicateConfig | null,
    public readonly permitGlobalDeployment: boolean,
    private executeFn: ContextCommandExecutableFunction,
  ) {
    super();
    this.data = data;
  }

  public checkPredicate(_idx: CommandIndex, user: User) {
    return this.evaluatePredicate(this.predicate, user);
  }

  public async execute(
    _idx: CommandIndex,
    interaction: ContextMenuCommandInteraction<CacheType>,
  ): Promise<void> {
    await this.executeFn({ interaction, client: interaction.client });
  }
}

function contextConstructor(type: ApplicationCommandType.User | ApplicationCommandType.Message) {
  return function (args: {
    data: Omit<RESTPostAPIContextMenuApplicationCommandsJSONBody, 'type'>;
    execute: ContextCommandExecutableFunction;
    predicate?: PredicateConfig;
    developmentOnly?: boolean;
  }) {
    const predicate = args.predicate ?? null;
    return new ContextCommand(
      { ...args.data, type },
      predicate,
      !args.developmentOnly,
      args.execute,
    );
  };
}

export const context = {
  user: contextConstructor(ApplicationCommandType.User),
  message: contextConstructor(ApplicationCommandType.Message),
};
