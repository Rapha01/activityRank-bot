import { Hono } from 'hono';
import { bearerAuth } from 'hono/bearer-auth';
import { createFactory } from 'hono/factory';
import { getShardIps, getShardStats } from '../models/botShardStatModel.js';
import commands from '../const/commands.js';
import patchnotes from '../const/patchnotes.js';
import faqs from '../const/faq.js';
import termsAndConditions from '../const/termsAndConditions.js';
import privacyPolicy from '../const/privacyPolicy.js';
import { keys } from '../const/keys.js';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { ofetch } from 'ofetch';

export const apiRouter = new Hono();

apiRouter.use('*', bearerAuth({ token: keys.managerApiAuth }));

const factory = createFactory();

const stats = factory.createHandlers(async (c) =>
  c.json({ stats: await getShardStats() })
);
const texts = factory.createHandlers((c) =>
  c.json({ commands, patchnotes, faqs, termsAndConditions, privacyPolicy })
);

/** @deprecated DEPRECATED routes for compatibility; should be removed asap because of not being versioned. */
apiRouter.get('/stats', ...stats);
apiRouter.get('/texts', ...texts);

apiRouter.get('/v1/stats', ...stats);
apiRouter.get('/v1/texts', ...texts);

apiRouter.post(
  '/v1/broadcast/guild-ids/matching',
  zValidator('json', z.array(z.string().regex(/\d{17,20}/))),
  async (c) => {
    const body = c.req.valid('json');
    const IPs = await getShardIps();

    const matches = new Set<string>();

    for (const shardIP of IPs) {
      const res = await ofetch<string[]>(
        `http://${shardIP}:3000/api/v1/guild-ids/matching`,
        {
          body,
          headers: [['Authorization', `Bearer ${keys.managerApiAuth}`]],
          method: 'POST',
        }
      );
      for (const result of res) {
        matches.add(result);
      }
    }
    return c.json(Array.from(matches));
  }
);
