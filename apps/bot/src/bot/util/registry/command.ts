import type {
  AutocompleteInteraction,
  CacheType,
  ChatInputCommandInteraction,
  Client,
  CommandInteractionOption,
  ContextMenuCommandInteraction,
  User,
} from 'discord.js';
import type { TFunction } from 'i18next';
import i18next from 'i18next';
import { ensureI18nLoaded } from '../i18n.js';
import type { InvalidPredicateCallback, Predicate } from './predicate.js';

await ensureI18nLoaded();

type CommandInteraction<CT extends CacheType = CacheType> =
  | ChatInputCommandInteraction<CT>
  | ContextMenuCommandInteraction<CT>;

export interface CommandPredicateConfig {
  validate: (user: User) => Predicate;
  invalidCallback: InvalidPredicateCallback<CommandInteraction>;
}

export type OptionKey = 'value' | 'channel' | 'attachment' | 'role' | 'user' | 'member';

interface CommandOptions {
  name: string;
  predicate?: CommandPredicateConfig;
  options?: Record<string, OptionKey[]>;
  execute: (args: {
    interaction: CommandInteraction;
    client: Client;
    options?: Record<string, unknown>;
    t: TFunction<'command-content'>;
  }) => Promise<void> | void;
  autocompletes?: Record<
    string,
    (args: {
      interaction: AutocompleteInteraction;
      client: Client;
      focusedValue: string;
      t: TFunction<'command-content'>;
    }) => Promise<void> | void
  >;
}

const DEFAULT_PREDICATE: CommandPredicateConfig = {
  validate: () => 'ALLOW',
  invalidCallback: async () => {}, // will never be called
};

export class Command {
  name: string;
  #predicate: CommandPredicateConfig;
  #execute: (args: {
    interaction: CommandInteraction;
    client: Client;
    options?: Record<string, unknown>;
    t: TFunction<'command-content'>;
  }) => Promise<void> | void;
  #autocompletes: Record<
    string,
    (args: {
      interaction: AutocompleteInteraction;
      client: Client;
      focusedValue: string;
      t: TFunction<'command-content'>;
    }) => Promise<void> | void
  >;
  #optionMeta: Record<string, OptionKey[]>;

  constructor(options: CommandOptions) {
    this.name = options.name;
    this.#predicate = options.predicate ?? DEFAULT_PREDICATE;
    this.#execute = options.execute;
    this.#optionMeta = options.options ?? {};
    this.#autocompletes = options.autocompletes ?? {};
  }

  // Get a Record<string, option_type> of the options provided to the command.
  getOptions(interaction: CommandInteraction): Record<string, unknown> {
    if (interaction.isContextMenuCommand()) return {};
    const returnedOptions: Record<string, unknown> = {};

    let data = interaction.options.data;
    if (interaction.isChatInputCommand()) {
      const group = interaction.options.getSubcommandGroup(false);
      const sub = interaction.options.getSubcommand(false);

      if (group) {
        data = data.find((n) => n.name === group)?.options as CommandInteractionOption[];
      }
      if (sub) {
        data = data.find((n) => n.name === sub)?.options as CommandInteractionOption[];
      }

      if (!data) {
        throw new Error(`Command "${this.name}" has invalid options data`, {
          cause: interaction.options.data,
        });
      }
    }

    for (const option of data) {
      if (!Object.hasOwn(this.#optionMeta, option.name)) {
        throw new Error(
          `Command "${this.name}" option "${option.name}" does not have an optionMeta entry. 
Have you synced slash commands?`,
        );
      }

      const meta = this.#optionMeta[option.name];

      let set = false;
      for (const key of meta) {
        if (option[key] !== undefined) {
          returnedOptions[option.name] = option[key];
          set = true;
          break;
        }
      }

      if (!set) {
        throw new Error(
          `Command "${this.name}" option "${option.name}" was not provided with any value in \
these fields: ${this.#optionMeta[option.name]}`,
        );
      }
    }

    return returnedOptions;
  }

  async execute(interaction: CommandInteraction) {
    if (this.#predicate.validate(interaction.user) !== 'ALLOW') {
      await this.#predicate.invalidCallback(interaction);
      return;
    }

    await this.#execute({
      interaction,
      client: interaction.client,
      options: this.getOptions(interaction),
      t: i18next.getFixedT([interaction.locale, 'en-US'], 'command-content'),
    });
  }

  async autocomplete(interaction: AutocompleteInteraction) {
    if (this.#predicate.validate(interaction.user) === 'DENY') {
      return;
    }

    const name = interaction.options.getFocused(true).name;

    if (!Object.hasOwn(this.#autocompletes, name)) {
      throw new Error(
        `Command "${this.name}" does not have an autocomplete listing for option "${name}". Have you synced slash commands?`,
      );
    }

    await this.#autocompletes[name]({
      interaction,
      client: interaction.client,
      focusedValue: interaction.options.getFocused(),
      t: i18next.getFixedT([interaction.locale, 'en-US'], 'command-content'),
    });
  }

  hasAutocomplete(key: string): boolean {
    return Object.hasOwn(this.#autocompletes, key);
  }
}
