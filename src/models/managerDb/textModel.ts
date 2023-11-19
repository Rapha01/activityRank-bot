import managerDb from './managerDb.js';
import type { TextsData } from 'models/types/external.js';

export async function getTexts() {
  return await managerDb.fetch<TextsData>(null, '/api/texts', 'get');
}
