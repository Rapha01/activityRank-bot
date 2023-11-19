import type { Client } from 'discord.js';
import eventLoader from './eventLoader.js';
import { loadCommandFiles } from '../commandLoader.js';

export default async function load(client: Client) {
  // TODO: cleanup
  await loadCommandFiles();
  await eventLoader(client);
}
