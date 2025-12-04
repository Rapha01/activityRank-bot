import type { TextsData } from '#models/types/external.d.ts';
import { managerFetch } from './managerDb.ts';

let cachedTexts: TextsData | null = null;

export async function getTexts() {
  if (cachedTexts) return cachedTexts;
  return await updateTexts();
}

export async function updateTexts() {
  cachedTexts = await managerFetch<TextsData>('api/v0/texts', {});
  return cachedTexts;
}
