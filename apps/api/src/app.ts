import { OpenAPIHono } from '@hono/zod-openapi';
import { logger } from 'hono/logger';
import { createFactory } from 'hono/factory';
import { serve } from '@hono/node-server';
import { apiReference } from '@scalar/hono-api-reference';
import { InternalAPIAuth } from '#middleware/auth.js';
import { getShardStats } from '#models/botShardStatModel.js';

import commands from './const/commands.js';
import patchnotes from './const/patchnotes.js';
import faqs from './const/faq.js';

import { apiRouter } from '#api.js';
import { Cron } from 'croner';
import { config, isProduction } from '#const/config.js';
import { runPatreonTask } from '#services/tasks/patreon.js';
import { runTopggTask } from '#services/tasks/topgg.js';
import { runResetByTime } from '#services/reset.js';

const app = new OpenAPIHono();
app.use(logger());

app.openAPIRegistry.registerComponent('securitySchemes', 'publicBearerAuth', {
  type: 'http',
  scheme: 'bearer',
  description: 'You can generate a token in the Support Server by running `/api create-token`.',
  bearerFormat: 'Provided via ActivityRank: `Bearer ar-{ guildId }-{ token }`',
});

app.get('/api/healthcheck', (c) => {
  c.status(204);
  return c.body(null);
});

const version = (await import('../package.json', { with: { type: 'json' } })).default.version;

app.doc('/api/openapi.json', {
  openapi: '3.1.0',
  info: {
    title: 'ActivityRank API',
    version,
    description:
      'A public API for the ActivityRank Bot: https://activityrank.me \n\n\
**WARNING** All API endpoints are in `v0`. Until `v1` is released, \
endpoints may have breaking changes made without warning.',
    termsOfService: 'https://activityrank.me/terms',
    contact: {
      name: 'ActivityRank Support (via Discord)',
      url: 'https://activityrank.me/support',
    },
  },
  servers: [{ url: 'http://activityrank.me/' }],
});

app.get(
  '/api/docs',
  apiReference({
    theme: 'purple',
    spec: {
      url: '/api/openapi.json',
    },
  }),
);

app.route('/api/v0/', apiRouter);

//  ---- Deprecated (legacy) endpoints ----  //

const factory = createFactory();

const stats = factory.createHandlers(async (c) => c.json({ stats: await getShardStats() }));
const texts = factory.createHandlers((c) => c.json({ commands, patchnotes, faqs }));

/** @deprecated routes for compatibility; should be removed asap because of not being versioned. */
apiRouter.get('/api/stats', InternalAPIAuth, ...stats);
apiRouter.get('/api/texts', InternalAPIAuth, ...texts);

/** @deprecated routes for compatibility; should be removed asap because of inconsistent versioning. */
apiRouter.get('/api/v1/stats', InternalAPIAuth, ...stats);
apiRouter.get('/api/v1/texts', InternalAPIAuth, ...texts);

//  ----        =======+=======        ----  //

const port = process.env.PORT ? Number.parseInt(process.env.PORT) : 3000;
serve({ fetch: app.fetch, port });
console.info(`API Server listening on port ${port}`);
console.info(`[http://localhost:${port}/api/docs]`);

new Cron('0 0 * * *', () => runResetByTime('day'));
new Cron('30 0 * * SUN', () => runResetByTime('week'));
new Cron('0 1 1 * *', () => runResetByTime('month'));
new Cron('30 1 1 1 *', () => runResetByTime('year'));

if (isProduction && config.disablePatreon !== true) {
  new Cron('*/15 * * * *', runPatreonTask);
  new Cron('*/20 * * * *', runTopggTask);
} else {
  console.warn('[!] Ignoring top.gg and Patreon requests due to environment');
}
