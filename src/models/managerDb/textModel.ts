import managerDb from './managerDb.js';
import type { TextsData } from 'models/types/external.js';

let cachedTexts: TextsData | null = null;

export async function getTexts() {
  if (cachedTexts) return cachedTexts;
  return await updateTexts();
}

export async function updateTexts() {
  cachedTexts = await managerDb.fetch<TextsData>(null, '/api/texts', 'get');
  return cachedTexts;
}
