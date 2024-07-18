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

export async function createRegistry() {
  const config = {
    eventFiles: await glob('dist/bot/events/*.js'),
    commandFiles: await glob('dist/bot/commands/**/*.js'),
  };
  return new Registry(config);
}

export async function createRegistryCLI() {
  const config = {
    eventFiles: await glob('dist/bot/events/*.js'),
    commandFiles: await glob('dist/bot/commands/**/*.js'),
  };
  return new Registry(config);
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
      if (!(handler instanceof SlashCommand)) {
        throw new Error(
          `The default export of the command file ${commandFile} must be a SlashCommand (found ${handler}). It can be constructed with the command() function.`,
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
      throw new Error(`Command "${commandName}" not found.`);
    }
    return command;
  }

  public async handleAutocomplete(interaction: AutocompleteInteraction): Promise<void> {
    const command = this.getCommand(interaction.commandName);
    const idx = new AutocompleteIndex(interaction);
    if (command instanceof SlashCommand) {
      await command.autocomplete(idx, interaction);
    } else {
      throw new Error(`Attempted to call autocomplete method of non-slash command ${idx}`);
    }
  }

  public async handleSlashCommand(interaction: ChatInputCommandInteraction): Promise<void> {
    const command = this.getCommand(interaction.commandName);
    const index = new CommandIndex(interaction);

    const predicate = command.checkPredicate(index, interaction.user);
    if (predicate.status !== Predicate.Allow) {
      await predicate.callback(interaction);
      return;
    }

    await command.execute(index, interaction);
  }

  public async handleContextCommand(interaction: ContextMenuCommandInteraction): Promise<void> {
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
