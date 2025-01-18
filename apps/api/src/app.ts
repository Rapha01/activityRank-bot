import { OpenAPIHono } from '@hono/zod-openapi';
import { logger } from 'hono/logger';
import { serve } from '@hono/node-server';
import { apiReference } from '@scalar/hono-api-reference';

import { apiRouter } from '#api.js';

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

app.doc('/api/openapi.json', {
  openapi: '3.0.0',
  info: {
    title: 'ActivityRank API',
    version: '0.1.0',
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

const port = process.env.PORT ? Number.parseInt(process.env.PORT) : 3000;
serve({ fetch: app.fetch, port });
console.info(`API Server listening on port ${port}`);
