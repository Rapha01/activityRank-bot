import type { Client } from 'discord.js';
// import cmdLoader from './cmdLoader.js';
import eventLoader from './eventLoader.js';
import { loadCommandFiles } from '../commandLoader.js';

export default async function load(client: Client) {
  // await cmdLoader(client);
  // TODO: cleanup
  await loadCommandFiles();
  await eventLoader(client);
}
