import { OpenAPIHono } from '@hono/zod-openapi';
import {
  fetchGuildMemberScores,
  fetchGuildMemberStatistics,
  getGuildMemberRanks,
  getLevelfactor,
  getLevelProgression,
} from '#services/ranks.js';
import { JSONHTTPException } from '#util/errors.js';

import { helloRoute } from '#routes/hello.js';
import { topMembersRoute } from '#routes/topMembers.js';
import { memberRankRoute } from '#routes/memberRank.js';
import { botStatsRoute } from '#routes/botstats.js';

export const apiRouter = new OpenAPIHono();

apiRouter.openapi(helloRoute, ({ text, get }) => {
  const guildId = get('authorisedGuildId');
  return text(`Hi!\n\nYour authentication for guild "${guildId}" is valid.`, 200);
});

apiRouter.openapi(topMembersRoute, async (c) => {
  const { guildId } = c.req.valid('param');
  const { 'top-rank': topRank, size, time, 'stat-type': statType } = c.req.valid('query');

  if (guildId !== c.get('authorisedGuildId')) {
    throw new JSONHTTPException(403, 'Inconsistent Guild IDs');
  }

  return c.json(await getGuildMemberRanks(guildId, time, statType, topRank, topRank + size), 200);
});

apiRouter.openapi(memberRankRoute, async (c) => {
  const { guildId, userId } = c.req.valid('param');

  if (guildId !== c.get('authorisedGuildId')) {
    throw new JSONHTTPException(403, 'Inconsistent Guild IDs');
  }

  const [scores, stats, levelfactor] = await Promise.all([
    fetchGuildMemberScores(guildId, userId),
    fetchGuildMemberStatistics(guildId, userId),
    getLevelfactor(guildId),
  ]);

  const levelProgression = getLevelProgression(scores.alltime, levelfactor);

  return c.json(
    {
      ...scores,
      ...stats,
      levelProgression,
      level: Math.floor(levelProgression),
    },
    200,
  );
});

apiRouter.openapi(botStatsRoute, async (c) => {
  return c.json('hi here are some stats :)', 200);
});
