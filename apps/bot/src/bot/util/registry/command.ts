import type {
  AutocompleteInteraction,
  CacheType,
  ChatInputCommandInteraction,
  Client,
  ContextMenuCommandInteraction,
  User,
} from 'discord.js';
import { type InvalidPredicateCallback, Predicate } from './predicate';

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
  }) => Promise<void> | void;
  autocompletes?: Record<
    string,
    (args: {
      interaction: AutocompleteInteraction;
      client: Client;
      focusedValue: string;
    }) => Promise<void> | void
  >;
}

const DEFAULT_PREDICATE: CommandPredicateConfig = {
  validate: () => Predicate.Allow,
  invalidCallback: async () => {}, // will never be called
};

export class Command {
  name: string;
  #predicate: CommandPredicateConfig;
  #execute: (args: {
    interaction: CommandInteraction;
    client: Client;
    options?: Record<string, unknown>;
  }) => Promise<void> | void;
  #autocompletes: Record<
    string,
    (args: {
      interaction: AutocompleteInteraction;
      client: Client;
      focusedValue: string;
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

  getOptions(interaction: CommandInteraction): Record<string, unknown> {
    const returnedOptions: Record<string, unknown> = {};
    for (const option of interaction.options.data) {
      if (!Object.hasOwn(this.#optionMeta, option.name)) {
        throw new Error(
          `Command "${this.name}" option "${option.name}" does not have an optionMeta entry. Have you synced slash commands?`,
        );
      }

      for (const key of this.#optionMeta[option.name]) {
        if (option[key] !== undefined) {
          returnedOptions[option.name] = option[key];
          break;
        }
      }
      throw new Error(
        `Command "${this.name}" option "${option.name}" was not provided with any value in these fields: ${this.#optionMeta[option.name]}`,
      );
    }
    return returnedOptions;
  }

  async execute(interaction: CommandInteraction) {
    if (this.#predicate.validate(interaction.user) === Predicate.Deny) {
      await this.#predicate.invalidCallback(interaction);
      return;
    }

    await this.#execute({
      interaction,
      client: interaction.client,
      options: this.getOptions(interaction),
    });
  }

  async autocomplete(interaction: AutocompleteInteraction) {
    if (this.#predicate.validate(interaction.user) === Predicate.Deny) {
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
    });
  }
}
