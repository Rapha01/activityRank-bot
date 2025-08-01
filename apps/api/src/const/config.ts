import { configLoader, schemas } from '@activityrank/cfg';

export const isProduction = process.env.NODE_ENV === 'production';
const loader = await configLoader();

export const config = await loader.loadConfig('config', { schema: schemas.api.config });
export const keys = await loader.loadSecret('keys', { schema: schemas.api.keys });
