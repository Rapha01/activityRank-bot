import { Hono } from 'hono';
import { bearerAuth } from 'hono/bearer-auth';
import { getShardStats } from '../models/botShardStatModel.js';
import commands from '../const/commands.js';
import patchnotes from '../const/patchnotes.js';
import faqs from '../const/faq.js';
import termsAndConditions from '../const/termsAndConditions.js';
import privacyPolicy from '../const/privacyPolicy.js';
import { keys } from '../const/keys.js';

export const apiRouter = new Hono();

apiRouter.use('*', bearerAuth({ token: keys.managerApiAuth }));

apiRouter.get('/stats', async (c) => c.json({ stats: await getShardStats() }));
apiRouter.get('/texts', (c) =>
  c.json({ commands, patchnotes, faqs, termsAndConditions, privacyPolicy })
);
