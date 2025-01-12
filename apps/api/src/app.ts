import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { serve } from '@hono/node-server';
import { openAPISpecs } from 'hono-openapi';
import { apiReference } from '@scalar/hono-api-reference';

import 'zod-openapi/extend';

import { apiRouter } from '#api.js';

const app = new Hono();
app.use(logger());

app.get('/api/healthcheck', (c) => {
  c.status(204);
  return c.body(null);
});
app.get(
  '/api/openapi.json',
  openAPISpecs(app, {
    documentation: {
      info: {
        title: 'ActivityRank API',
        version: '0.1.0',
        description: 'A public API for the ActivityRank Bot: https://activityrank.me',
        termsOfService: 'https://activityrank.me/terms',
        contact: {
          name: 'ActivityRank Support (via Discord)',
          url: 'https://activityrank.me/support',
        },
      },
      servers: [{ url: 'http://activityrank.me/' }],
      components: {
        securitySchemes: {
          publicBearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: '',
          },
        },
        responses: {
          InvalidAuthError: {
            description: 'Access token is present but invalid.',
          },
          UnauthorizedError: {
            description: 'Access token is missing.',
          },
        },
      },
    },
  }),
);
app.get(
  '/api/docs',
  apiReference({
    theme: 'saturn',
    spec: {
      url: '/api/openapi.json',
    },
  }),
);

app.route('/api/v0/', apiRouter);

const port = process.env.PORT ? Number.parseInt(process.env.PORT) : 3000;
serve({ fetch: app.fetch, port });
console.info(`API Server listening on port ${port}`);
