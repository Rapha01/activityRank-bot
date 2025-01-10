import { createManagerInstance } from '@activityrank/database';
import { keys } from '#const/config.js';

export const manager = createManagerInstance({
  host: keys.managerHost,
  database: keys.managerDb.dbName,
  user: keys.managerDb.dbUser,
  password: keys.managerDb.dbPassword,
});

type APIPaths = 'texts' | 'stats';
type AutocompletePaths = `api/${APIPaths}`;

// this type signature allows any string, but also provides autocomplete
export async function managerFetch<T>(route: AutocompletePaths, init: RequestInit): Promise<T>;
export async function managerFetch<T>(route: string, init: RequestInit): Promise<T>;
export async function managerFetch<T>(route: string, init: RequestInit): Promise<T> {
  try {
    const url = new URL(`http://${keys.managerHost}/${route}`);
    // number converts to string cleanly; null does not add a port
    url.port = keys.managerPort as unknown as string;

    const headers = new Headers(init.headers);
    headers.set('Content-Type', 'application/json');
    headers.set('Authorization', `Bearer ${keys.managerApiAuth}`);

    const res = await fetch(url, { ...init, headers });
    return (await res.json()) as T;
  } catch (cause) {
    throw new Error('Failed to fetch data from Manager API', { cause });
  }
}
