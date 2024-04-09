import {
  createApp,
  createRouter,
  defineEventHandler,
  useBase,
  sendNoContent,
} from 'h3';
import { readFile } from 'node:fs/promises';
import { Cron } from 'croner';
import { isProduction } from './const/keys.js';
import { apiRouter } from './routes/api.js';
import { resetScoreByTime } from './models/resetModel.js';
import { runPatreonTask } from './tasks/patreon.js';
import { runTopggTask } from './tasks/topgg.js';

export const app = createApp();
const router = createRouter();
router
  .get(
    '/',
    defineEventHandler(async () => {
      return await readFile(new URL('./assets/main.html', import.meta.url));
    })
  )
  .get('/healthcheck', defineEventHandler(sendNoContent));

router.use('/api/**', useBase('/api', apiRouter.handler));

new Cron('5 * * * *', () => resetScoreByTime('day'));
new Cron('20 23 * * *', () => resetScoreByTime('week'));
new Cron('30 23 1-7 * *', () => resetScoreByTime('month'));
new Cron('30 23 1 1 *', () => resetScoreByTime('year'));
if (isProduction) {
  new Cron('*/2 * * * *', runPatreonTask);
  new Cron('*/20 * * * *', () => runTopggTask);
} else {
  console.warn('Ignoring top.gg and Patreon requests due to environment');
}

app.use(router);
