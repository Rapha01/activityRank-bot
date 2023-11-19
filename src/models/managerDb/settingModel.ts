import managerDb from './managerDb.js';
import type { SettingSchema } from 'models/types/manager.js';

export async function getSettings() {
  const res = await managerDb.query<SettingSchema[]>('SELECT * from setting');
  return Object.fromEntries(res.map((i) => [i.id, i.value]));
}
