import { EventHandler } from './event.js';
import { AutocompleteIndex, Command, CommandIndex, Predicate, SlashCommand } from './command.js';
import {
  AutocompleteInteraction,
  ChatInputCommandInteraction,
  ContextMenuCommandInteraction,
} from 'discord.js';
import fg from 'fast-glob';
import type { EventEmitter } from 'node:events';

const glob = async (paths: string | string[]) => await fg(paths, { absolute: true });

const EVENT_PATHS = ['dist/bot/events/*.js'];
const COMMAND_PATHS = [
  'dist/bot/commands/*.js',
  'dist/bot/commandsAdmin/*.js',
  'dist/bot/contextMenus/*.js',
];

export async function createRegistry() {
  const config = {
    eventFiles: await glob(EVENT_PATHS),
    commandFiles: await glob(COMMAND_PATHS),
  };
  return new Registry(config);
}

export async function createRegistryCLI() {
  const config = {
    eventFiles: await glob(EVENT_PATHS),
    commandFiles: await glob(COMMAND_PATHS),
  };
  return new Registry(config);
}

export class CommandNotFoundError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
  }
}

export class Registry {
  #events: Map<string | symbol, EventHandler[]> = new Map();
  #commands: Map<string, Command> = new Map();

  constructor(private config: { eventFiles: string[]; commandFiles: string[] }) {}

  public async loadEvents() {
    for (const eventFile of this.config.eventFiles) {
      const file = await import(eventFile);

      const handler = file.default;
      if (!(handler instanceof EventHandler)) {
        throw new Error(
          `The default export of the event file ${eventFile} must be an EventHandler (found ${handler}). It can be constructed with the event() function.`,
        );
      }

      // Append to the corresponding array, or create a new one if it doesn't exist.
      this.#events.set(
        handler.name,
        this.#events.has(handler.name) ? [...this.#events.get(handler.name)!, handler] : [handler],
      );
    }
  }

  public attachEvents(emitter: EventEmitter) {
    for (const [key, events] of this.#events) {
      for (const event of events) {
        if (event.once) {
          emitter.once(key, event.callback);
        } else {
          emitter.on(key, event.callback);
        }
      }
    }
  }

  public get events(): ReadonlyMap<string | symbol, EventHandler[]> {
    return this.#events;
  }

  public async loadCommands() {
    for (const commandFile of this.config.commandFiles) {
      const file = await import(commandFile);

      const handler = file.default;
      if (!(handler instanceof Command)) {
        throw new Error(
          `The default export of the command file ${commandFile} must be a Command (found ${handler}). It can be constructed with the command.basic(), command.parent(), context.user(), or context.message() functions.`,
        );
      }

      this.#commands.set(handler.data.name, handler);
    }
  }

  public get commands(): ReadonlyMap<string, Command> {
    return this.#commands;
  }

  private getCommand(commandName: string): Command {
    const command = this.#commands.get(commandName);
    if (!command) {
      throw new CommandNotFoundError(`Command "${commandName}" not found.`);
    }
    return command;
  }

  public async handleAutocomplete(interaction: AutocompleteInteraction<'cached'>): Promise<void> {
    const command = this.getCommand(interaction.commandName);
    const idx = new AutocompleteIndex(interaction);
    if (command instanceof SlashCommand) {
      await command.autocomplete(idx, interaction);
    } else {
      throw new Error(`Attempted to call autocomplete method of non-slash command ${idx}`);
    }
  }

  public async handleSlashCommand(
    interaction: ChatInputCommandInteraction<'cached'>,
  ): Promise<void> {
    const command = this.getCommand(interaction.commandName);
    const index = new CommandIndex(interaction);

    const predicate = command.checkPredicate(index, interaction.user);
    if (predicate.status !== Predicate.Allow) {
      await predicate.callback(interaction);
      return;
    }

    await command.execute(index, interaction);
  }

  public async handleContextCommand(
    interaction: ContextMenuCommandInteraction<'cached'>,
  ): Promise<void> {
    const command = this.getCommand(interaction.commandName);
    const index = new CommandIndex(interaction);

    const predicate = command.checkPredicate(index, interaction.user);
    if (predicate.status !== Predicate.Allow) {
      await predicate.callback(interaction);
      return;
    }

    await command.execute(index, interaction);
  }
}

export const registry = await createRegistry();
