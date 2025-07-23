import type { Context, Env, Input, MiddlewareHandler } from 'hono';
import { rateLimiter, type ConfigType, type GeneralConfigType } from 'hono-rate-limiter';

const keyGenerator = (c: Context<Env, '/'>) => {
  const header = c.req.header('Authorization');
  if (!header) {
    throw new Error('Ratelimiter applied on a function without an Authorization header.');
  }
  return header;
};

export function getRateLimiter<I extends Input = Input>(
  config?: Omit<GeneralConfigType<ConfigType<Env, '/', I>>, 'keyGenerator'>,
): MiddlewareHandler<Env, '/', I> {
  const defaults = { windowMs: 10_000, limit: 10 };
  return rateLimiter({ ...defaults, ...config, keyGenerator });
}
