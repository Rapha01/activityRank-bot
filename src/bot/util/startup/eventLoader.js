import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const botDir = fileURLToPath(new URL('../..', import.meta.url));
const eventDir = path.join(botDir, 'events');

const files = fs.readdirSync(eventDir).filter((file) => file.endsWith('.js'));

export default async (client) => {
  for (const file of files) {
    const event = await import(path.join(eventDir, file));

    if (event.once) {
      client.once(event.name, genHandler(event.name, event.execute));
    } else {
      client.on(event.name, genHandler(event.name, event.execute));
    }
  }

  function genHandler(name, execute) {
    return async (...args) => {
      try {
        await execute(...args);
      } catch (err) {
        client.logger.warn({ err, args, name }, 'Error in listener');
      }
    };
  }
};
