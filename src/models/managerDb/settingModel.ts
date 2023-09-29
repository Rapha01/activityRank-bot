import type { Client } from 'discord.js';
import managerDb from './managerDb.js';
import type { setting } from 'models/types/manager.js';

export const storage = {
  get: async function () {
    const res = await managerDb.query<setting[]>('SELECT * from setting');

    return Object.fromEntries(res.map((i) => [i.id, i.value]));
  },
};

export const cache = {
  load: async function (client: Client) {
    client.appData.settings = await storage.get();
  },
};

export default {
  storage,
  cache,
};
