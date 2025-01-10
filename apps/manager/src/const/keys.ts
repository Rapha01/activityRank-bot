import { configLoader, schemas } from '@activityrank/cfg';

export const isProduction = process.env.NODE_ENV === 'production';
const loader = () =>
  isProduction
    ? configLoader()
    : configLoader(process.env.CONFIG_PATH ?? `${process.cwd()}/config`);

export const config = await loader().load({
  name: 'config',
  schema: schemas.manager.config,
  secret: false,
});
export const keys = await loader().load({
  name: 'keys',
  schema: schemas.manager.keys,
  secret: true,
});
