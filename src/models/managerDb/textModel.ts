import type { Client } from 'discord.js';
import managerDb from './managerDb.js';
import type { TextsData } from 'models/types/external.js';

export const storage = {
  get: async function () {
    return await managerDb.fetch<TextsData>(null, '/api/texts', 'get');
  },
};

export const cache = {
  load: async function (client: Client) {
    client.appData.texts = await storage.get();
  },
};

export default {
  storage,
  cache,
};
