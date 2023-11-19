import managerDb from './managerDb.js';
import type { SettingSchema } from 'models/types/manager.js';

let cachedSettings: Record<string, string> | null = null;

export async function getSettings() {
  if (cachedSettings) return cachedSettings;
  return await updateSettings();
}

export async function updateSettings() {
  const res = await managerDb.query<SettingSchema[]>('SELECT * from setting');
  cachedSettings = Object.fromEntries(res.map((i) => [i.id, i.value]));
  return cachedSettings;
}
