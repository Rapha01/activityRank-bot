import type { Client } from 'discord.js';
import cmdLoader from './cmdLoader.js';
import eventLoader from './eventLoader.js';

export default async function load(client: Client) {
  await cmdLoader(client);
  await eventLoader(client);
}
