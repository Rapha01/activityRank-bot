import type { ClientEvents } from 'discord.js';

/**
 * The key of an event, which can be a key of `ClientEvents` from discord.js,
 * or a string or symbol for custom events.
 */
type EventKey = keyof ClientEvents | string | symbol;

/**
 * Determines the type of parameters expected for an event based on its key.
 * For Discord.JS `ClientEvents`, the parameters are properly typed according to the event;
 * for custom events, it is assumed that no parameters will be passed.
 */
type EventParameters<E extends EventKey = EventKey> = E extends keyof ClientEvents
  ? ClientEvents[E]
  : [];

/**
 * Builds an event handler with optional one-time execution.
 * @param name The name of the event.
 * @param callback The callback function to be executed when the event is triggered.
 * @param opts Optional configuration for the event handler.
 * @returns An instance of EventHandler.
 */
export function event<E extends EventKey = EventKey>(
  name: E,
  callback: (...parameters: EventParameters<E>) => Promise<void> | void,
  opts?: { once?: boolean },
): EventHandler {
  return new EventHandler(name, callback, opts?.once ?? false);
}

/**
 * Represents an event handler that associates a callback with an event, either from discord.js or manually triggered.
 */
export class EventHandler {
  readonly name: EventKey;
  // intentional use of `any`: type-checking args is only useful when *defining*
  // the event, which is handled by `event()` and works as intended.
  readonly callback: (...params: any[]) => Promise<void> | void;
  readonly once: boolean;

  /**
   * Creates an instance of EventHandler.
   * @param name The name of the event.
   * @param callback The callback function to be executed when the event occurs.
   * @param once Whether the event handler should execute only once.
   */
  constructor(
    name: EventKey,
    // intentional use of `any`: type-checking args is only useful when *defining*
    // the event, which is handled by `event()` and works as intended.
    callback: (...params: any[]) => Promise<void> | void,
    once: boolean,
  ) {
    this.name = name;
    this.callback = callback;
    this.once = once;
  }
}
