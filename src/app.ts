import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { readFileSync } from 'node:fs';
import { Cron } from 'croner';
import { config, isProduction } from './const/keys.js';
import { resetScoreByTime } from './models/resetModel.js';
import { runPatreonTask } from './tasks/patreon.js';
import { runTopggTask } from './tasks/topgg.js';
import { apiRouter } from './routes/api.js';

const app = new Hono();

const content = readFileSync(new URL('./assets/main.html', import.meta.url));

app.get('/', (c) => c.html(content.toString()));
app.get('/healthcheck', (c) => {
  c.status(204);
  return c.body(null);
});
app.route('/api/v1', apiRouter);

const port = process.env.PORT ? Number.parseInt(process.env.PORT) : 3000;
serve({ fetch: app.fetch, port });
console.info(`Server listening on port ${port}`);

new Cron('5 * * * *', () => resetScoreByTime('day'));
new Cron('20 23 * * *', () => resetScoreByTime('week'));
new Cron('30 23 1-7 * *', () => resetScoreByTime('month'));
new Cron('30 23 1 1 *', () => resetScoreByTime('year'));

if (isProduction && config.disablePatreon !== true) {
  new Cron('*/3 * * * *', runPatreonTask);
  new Cron('*/20 * * * *', runTopggTask);
} else {
  console.warn('[!] Ignoring top.gg and Patreon requests due to environment');
}
