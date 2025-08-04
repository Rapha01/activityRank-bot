import type { Context, Env, Input, MiddlewareHandler } from 'hono';
import { createMiddleware } from 'hono/factory';
import { type ConfigType, type GeneralConfigType, rateLimiter } from 'hono-rate-limiter';

const keyGenerator = (c: Context<Env, '/'>) => {
  const header = c.req.header('Authorization');
  if (!header) {
    throw new Error(
      'This ratelimiter cannot be applied on a function without an Authorization header.',
    );
  }
  return header.trim();
};

const passthrough = createMiddleware(async (_, next) => {
  await next();
});

export type RateLimiterOptions<I extends Input = Input> = Omit<
  GeneralConfigType<ConfigType<Env, '/', I>>,
  'keyGenerator'
> & { enabled?: boolean };

export function getRateLimiter<I extends Input = Input>(
  config?: RateLimiterOptions<I>,
): MiddlewareHandler<Env, '/', I> {
  if (config?.enabled === false) {
    return passthrough;
  }

  // 10 requests per 10 seconds, across all requests by a single Authorization header (i.e. a single token)
  const defaults = { windowMs: 10_000, limit: 10 };
  return rateLimiter({ ...defaults, ...config, keyGenerator });
}
