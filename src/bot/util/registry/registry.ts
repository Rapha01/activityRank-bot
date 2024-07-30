import { EventHandler } from './event.js';
import { AutocompleteIndex, Command, CommandIndex, SlashCommand } from './command.js';
import {
  AutocompleteInteraction,
  ChatInputCommandInteraction,
  ContextMenuCommandInteraction,
  MessageComponentInteraction,
} from 'discord.js';
import fg from 'fast-glob';
import type { EventEmitter } from 'node:events';
import { type ComponentInstance, Component, ComponentKey } from './component.js';
import { Predicate } from './predicate.js';
import TTLCache from '@isaacs/ttlcache';

const glob = async (paths: string | string[]) => await fg(paths, { absolute: true });

const EVENT_PATHS = ['dist/bot/events/*.js'];
const COMMAND_PATHS = [
  'dist/bot/commands/*.js',
  'dist/bot/commandsAdmin/*.js',
  'dist/bot/contextMenus/*.js',
  'dist/bot/commandsSlash/ping.js',
  'dist/bot/commandsSlash/inviter.js',
  'dist/bot/commandsSlash/help.js',
  'dist/bot/commandsSlash/rank.js',
  'dist/bot/commandsSlash/faq.js',
  'dist/bot/commandsSlash/patchnote.js',
  'dist/bot/commandsSlash/serverinfo.js',
  'dist/bot/commandsSlash/config-channel.js',
  'dist/bot/commandsSlash/bonus.js',
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
  #components: Map<string, Component<unknown>> = new Map();
  #activeComponents: TTLCache<string, ComponentInstance<unknown>> = new TTLCache({
    max: 10_000,
    ttl: 1000 * 60 * 30,
  });

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

  public get components(): ReadonlyMap<string, Component<unknown>> {
    return this.#components;
  }

  public registerComponent(component: Component<unknown>) {
    if (this.#components.has(component.identifier)) {
      throw new Error(`Duplicate component ID "${component.identifier}" registered`);
    }
    this.#components.set(component.identifier, component);
  }

  public registerComponentInstance(instance: ComponentInstance<unknown>) {
    if (this.#components.has(instance.identifier)) {
      throw new Error(`Duplicate component instance ID "${instance.identifier}" registered`);
    }

    this.#activeComponents.set(instance.identifier, instance);
  }

  public dropComponentInstance(instance: ComponentInstance<unknown>) {
    this.#activeComponents.delete(instance.identifier);
  }

  public managesComponent(interaction: MessageComponentInteraction<'cached'>): boolean {
    const split = Component.splitCustomId(interaction.customId);

    return (
      split.status === 'SPECIAL_KEY' ||
      (split.status === 'SUCCESS' && this.#components.has(split.component))
    );
  }

  public async handleComponent(interaction: MessageComponentInteraction<'cached'>): Promise<void> {
    const split = Component.splitCustomId(interaction.customId);
    if (split.status === 'INVALID_VERSION') {
      if (interaction.isRepliable()) {
        await interaction.reply({
          content:
            "Oops! It's been a while since this component was made. Try running the command again.",
          ephemeral: true,
        });
      }
      // this is only a warnable issue if the message the component was attached to was created recently
      if (Date.now() - interaction.message.createdAt.getTime() < 1000 * 60 * 60) {
        interaction.client.logger.warn(
          { interaction, issue: split.errorText },
          'Old component (created recently) used',
        );
      }
      return;
    }

    if (split.status === 'SPECIAL_KEY') {
      if (split.key === ComponentKey.Ignore) {
        return;
      } else if (split.key === ComponentKey.Throw) {
        throw new Error('Component interaction with customId of ComponentKey.Throw recieved');
      } else if (split.key === ComponentKey.Warn) {
        interaction.client.logger.warn(
          { interaction },
          'Component interaction with customId of ComponentKey.Warn recieved',
        );
      }
      return;
    }

    const component = this.#activeComponents.get(split.instance);
    if (!component) {
      // the component is too old and has timed out of the cache
      await interaction.reply({
        content: 'Oops! This component has timed out. Try running the command again.',
        ephemeral: true,
      });
      return;
    }

    const predicate = component.checkPredicate(interaction);
    if (predicate.status !== Predicate.Allow) {
      await predicate.callback(interaction);
      return;
    }

    await component.execute(interaction);
  }
}

export const registry = await createRegistry();
