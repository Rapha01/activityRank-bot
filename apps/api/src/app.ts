import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { serve } from '@hono/node-server';

import { apiRouter } from '#api.js';

const app = new Hono();
app.use(logger());

app.get('/healthcheck', (c) => {
  c.status(204);
  return c.body(null);
});
app.route('/api/v1/', apiRouter);

const port = process.env.PORT ? Number.parseInt(process.env.PORT) : 3000;
serve({ fetch: app.fetch, port });
console.info(`Server listening on port ${port}`);
