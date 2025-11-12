import { createManagerInstance } from '@activityrank/database';
import { env } from '$env/dynamic/private';

export const manager = createManagerInstance({
  host: env.DB_HOST,
  user: env.DB_USER,
  password: env.DB_PASS,
  database: env.DB_NAME,
  connectionLimit: 3,
});
