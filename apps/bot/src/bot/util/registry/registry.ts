import type { EventEmitter } from 'node:events';
import TTLCache from '@isaacs/ttlcache';
import { Time } from '@sapphire/duration';
import type {
  AutocompleteInteraction,
  ChatInputCommandInteraction,
  ContextMenuCommandInteraction,
  MessageComponentInteraction,
  ModalSubmitInteraction,
} from 'discord.js';
import fg from 'fast-glob';
import { Command } from './command.js';
import {
  Component,
  type ComponentInstance,
  type ComponentInteraction,
  ComponentKey,
} from './component.js';
import { EventHandler } from './event.js';
import { Predicate } from './predicate.js';

const glob = async (paths: string | string[]) => await fg(paths, { absolute: true });

const EVENT_PATHS = [`${import.meta.dirname}/../../events/*.js`];
const COMMAND_PATHS = [
  `${import.meta.dirname}/../../commands/**/*.js`,
  `${import.meta.dirname}/../../commandsAdmin/**/*.js`,
  `${import.meta.dirname}/../../contextMenus/**/*.js`,
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

export class CommandNotFoundError extends Error {}

export class Registry {
  #events: Map<string | symbol, EventHandler[]> = new Map();
  #commands: Map<string, Command> = new Map();
  #components: Map<string, Component<ComponentInteraction, unknown>> = new Map();
  #activeComponents: TTLCache<string, ComponentInstance<ComponentInteraction, unknown>> =
    new TTLCache({
      max: 10_000,
      ttl: 1000 * 60 * 30,
    });
  private config: { eventFiles: string[]; commandFiles: string[] };

  constructor(config: { eventFiles: string[]; commandFiles: string[] }) {
    this.config = config;
  }

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
        this.#events.has(handler.name)
          ? [...(this.#events.get(handler.name) as EventHandler[]), handler]
          : [handler],
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
      if (!(handler instanceof Command) && !Array.isArray(handler)) {
        throw new Error(
          `The default export of the command file ${commandFile} must be a Command or an array of Commands (found ${handler}). It can be constructed with the command() function.`,
        );
      }

      if (Array.isArray(handler)) {
        for (const h of handler) {
          if (!(h instanceof Command)) {
            throw new Error(
              `The default export of the command file ${commandFile} must be a Command or an array of Commands (found Array<${handler}>). It can be constructed with the command() function.`,
            );
          }
          this.#commands.set(h.name, h);
        }
      } else {
        this.#commands.set(handler.name, handler);
      }
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

  private getName(
    interaction:
      | AutocompleteInteraction
      | ChatInputCommandInteraction
      | ContextMenuCommandInteraction,
  ): string {
    const acc: (string | null)[] = [];
    acc.push(interaction.commandName);
    if (interaction.isChatInputCommand() || interaction.isAutocomplete()) {
      acc.push(interaction.options.getSubcommandGroup(false));
      acc.push(interaction.options.getSubcommand(false));
    }
    return acc.filter((d) => d !== null).join(' ');
  }

  public async handleAutocomplete(interaction: AutocompleteInteraction<'cached'>): Promise<void> {
    const command = this.getCommand(this.getName(interaction));
    const focusedName = interaction.options.getFocused(true).name;
    if (!command.hasAutocomplete(focusedName)) {
      throw new Error(
        `Command "${command.name}" does not have autocomplete method "${focusedName}"`,
      );
    }

    await command.autocomplete(interaction);
  }

  public async handleCommand(
    interaction: ChatInputCommandInteraction<'cached'> | ContextMenuCommandInteraction<'cached'>,
  ): Promise<void> {
    const command = this.getCommand(this.getName(interaction));

    await command.execute(interaction);
  }

  public get components(): ReadonlyMap<string, Component<ComponentInteraction, unknown>> {
    return this.#components;
  }

  public registerComponent(component: Component<any, unknown>) {
    if (this.#components.has(component.identifier)) {
      throw new Error(`Duplicate component ID "${component.identifier}" registered`);
    }
    this.#components.set(component.identifier, component);
  }

  public registerComponentInstance(instance: ComponentInstance<any, unknown>) {
    if (this.#components.has(instance.identifier)) {
      throw new Error(`Duplicate component instance ID "${instance.identifier}" registered`);
    }

    this.#activeComponents.set(instance.identifier, instance);
  }

  public dropComponentInstance(instance: ComponentInstance<any, unknown>) {
    this.#activeComponents.delete(instance.identifier);
  }

  public dropComponentId(id: string) {
    this.#activeComponents.delete(id);
  }

  public managesComponent(
    interaction: MessageComponentInteraction<'cached'> | ModalSubmitInteraction<'cached'>,
  ): boolean {
    const split = Component.splitCustomId(interaction.customId);

    return (
      split.status === 'SPECIAL_KEY' ||
      (split.status === 'SUCCESS' && this.#components.has(split.component))
    );
  }

  public async handleComponent(
    interaction: MessageComponentInteraction<'cached'> | ModalSubmitInteraction<'cached'>,
  ): Promise<void> {
    const split = Component.splitCustomId(interaction.customId);
    if (split.status === 'INVALID_VERSION') {
      if (split.version === '2.0') {
        // Components of Version 2 should be handled in the component code itself.
        return;
      }
      if (interaction.isRepliable()) {
        await interaction.reply({
          content:
            "Oops! It's been a while since this component was made. Try running the command again.",
          ephemeral: true,
        });
      }
      // this is only a warnable issue if the message the component was attached to was created recently
      if (interaction.message && Date.now() - interaction.message.createdAt.getTime() < Time.Hour) {
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
      }
      if (split.key === ComponentKey.Throw) {
        throw new Error('Component interaction with customId of ComponentKey.Throw recieved');
      }
      if (split.key === ComponentKey.Warn) {
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
