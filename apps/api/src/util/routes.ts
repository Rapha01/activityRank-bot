import { createRoute, type RouteConfig } from '@hono/zod-openapi';
import { isProduction } from '#const/config.js';
import { InternalAPIAuth, PublicAPIAuth } from '#middleware/auth.js';
import { Error400, Error401, Error403 } from '#util/zod.js';
import { getRateLimiter, type RateLimiterOptions } from '#util/ratelimit.js';

interface ExtraOptions {
  ratelimit?: RateLimiterOptions;
}

export function createPublicAuthRoute<
  P extends string,
  R extends Omit<RouteConfig, 'path' | 'security' | 'middleware'> & { path: P },
>(opts: R, extra?: ExtraOptions) {
  return createRoute({
    ...opts,
    middleware: [PublicAPIAuth, getRateLimiter(extra?.ratelimit)] as const,
    security: [{ publicBearerAuth: [] }],
    responses: { 400: Error400, 401: Error401, 403: Error403, ...opts.responses },
    tags: ['v0.x', ...(opts.tags ?? [])],
  });
}

export function createInternalRoute<
  P extends string,
  R extends Omit<RouteConfig, 'path' | 'security' | 'middleware'> & { path: P },
>(opts: R) {
  return createRoute({
    ...opts,
    // by default, internal requests are not rate-limited
    middleware: [InternalAPIAuth] as const,
    hide: isProduction,
    security: [{ internalBearerAuth: [] }],
    responses: { 400: Error400, 401: Error401, 403: Error403, ...opts.responses },
    tags: ['Internal', ...getArray(opts.tags)],
  });
}

// convert `T[]`-like structures into `T[]`
function getArray<T>(some: T[] | T | undefined | null): T[] {
  if (!some) return [];
  if (Array.isArray(some)) return some;
  return [some];
}
