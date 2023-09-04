import type { Client } from 'discord.js';
import managerDb from './managerDb.js';

export const storage = {
  get: async function () {
    const res = await managerDb.query('SELECT * from setting');

    const settings: Record<any, any> = {};

    for (const setting of res) settings[setting.id] = setting.value;

    return settings;
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
