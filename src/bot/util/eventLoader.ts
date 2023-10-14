import { Client, type ClientEvents, type GuildMember } from 'discord.js';
import logger from '../../util/logger.js';
import { glob } from 'glob';
import { eventsDir } from './paths.js';

type EventCallback<T extends keyof ClientEvents> = {
  callback: (...args: T extends keyof ClientEvents ? ClientEvents[T] : unknown[]) => unknown;
  priority?: number;
  once?: boolean;
};

export const eventMap = new Map<keyof ClientEvents, EventCallback<any>[]>();

export function registerEvent<T extends keyof ClientEvents>(
  event: T,
  callback: EventCallback<T>['callback'],
  options?: { once?: boolean; priority?: number },
) {
  const entry = { callback, priority: options?.priority, once: options?.once };
  if (eventMap.has(event)) eventMap.set(event, [...eventMap.get(event)!, entry]);
  else eventMap.set(event, [entry]);
  logger.debug(
    `Loaded an event for ${event}${options?.once ? ' (single-fire)' : ''}${
      options?.priority !== undefined ? ` (priority ${options.priority})` : ''
    }`,
  );
}

export async function loadEventFiles() {
  // all files nested anywhere in eventsdir
  const eventFiles = await glob(`${eventsDir}/**/*.js`);

  await Promise.all(eventFiles.map(async (file) => await import(file)));
}

export async function loadEvents(client: Client) {
  for (const [event, opts] of eventMap.entries()) {
    // descending order: higher numbers are loaded first
    for (const opt of opts.sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0))) {
      if (opt.once) {
        client.once(event, handle(event, opt.callback));
      } else {
        client.on(event, handle(event, opt.callback));
      }
    }
  }

  function handle(name: string, callback: (...args: unknown[]) => unknown) {
    return async (...args: any[]) => {
      try {
        await callback(...args);
      } catch (err) {
        client.logger.warn({ err, args, name }, 'Error in event listener');
      }
    };
  }
}
