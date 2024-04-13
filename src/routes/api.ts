import { createRouter, defineEventHandler } from 'h3';
import { getShardStats } from '../models/botShardStatModel.js';
import commands from '../const/commands.js';
import patchnotes from '../const/patchnotes.js';
import faqs from '../const/faq.js';
import termsAndConditions from '../const/termsAndConditions.js';
import privacyPolicy from '../const/privacyPolicy.js';

export const apiRouter = createRouter()
  .get(
    '/stats',
    defineEventHandler(async () => {
      return { stats: await getShardStats() };
    })
  )
  .get(
    '/texts',
    defineEventHandler(() => {
      return { commands, patchnotes, faqs, termsAndConditions, privacyPolicy };
    })
  );
