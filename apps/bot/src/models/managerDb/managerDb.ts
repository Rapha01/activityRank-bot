import { createManagerInstance } from '@activityrank/database';
import { keys } from '#const/config.ts';

export const manager = createManagerInstance({
  host: keys.managerHost,
  database: keys.managerDb.dbName,
  user: keys.managerDb.dbUser,
  password: keys.managerDb.dbPassword,
});

type APIPaths = 'texts' | 'shards/stats';
type AutocompletePaths = `api/v0/${APIPaths}`;

// this type signature allows any string, but also provides autocomplete
export async function managerFetch<T>(route: AutocompletePaths, init: RequestInit): Promise<T>;
export async function managerFetch<T>(route: string, init: RequestInit): Promise<T>;
export async function managerFetch<T>(route: string, init: RequestInit): Promise<T> {
  try {
    const url = new URL(`http://${keys.managerApiHost}/${route}`);
    // number converts to string cleanly; null/unknown does not set the port
    url.port = keys.managerApiPort as unknown as string;

    const headers = new Headers(init.headers);
    headers.set('Content-Type', 'application/json');
    headers.set('Authorization', `Bearer ${keys.managerApiAuth}`);

    const res = await fetch(url, { ...init, headers });
    return (await res.json()) as T;
  } catch (cause) {
    throw new Error('Failed to fetch data from Manager API', { cause });
  }
}
