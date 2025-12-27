import { OpenAPIHono } from '@hono/zod-openapi';
import { getShardStats } from '#models/botShardStatModel.ts';
import { helloRoute } from '#routes/hello.ts';
import { memberRankRoute } from '#routes/memberRank.ts';
import { runPatreonRoute } from '#routes/patreon.ts';
import { shardStatsRoute } from '#routes/shard-stats.ts';
import { sharedGuildsRoute } from '#routes/shared-guilds.ts';
import { textsRoute } from '#routes/texts.ts';
import { runTopggRoute } from '#routes/topgg.ts';
import { topMembersRoute } from '#routes/topMembers.ts';
import { broadcastRequest } from '#services/broadcast.ts';
import {
  fetchGuildMemberScores,
  fetchGuildMemberStatistics,
  getGuildMemberRanks,
  getLevelfactor,
  getLevelProgression,
} from '#services/ranks.ts';
import { runPatreonTask } from '#services/tasks/patreon.ts';
import { runTopggTask } from '#services/tasks/topgg.ts';
import { JSONHTTPException } from '#util/errors.ts';
import commands from './const/commands.ts';
import faqs from './const/faq.ts';
import patchnotes from './const/patchnotes.ts';

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

apiRouter.openapi(shardStatsRoute, async (c) => {
  const stats = await getShardStats();
  return c.json(
    {
      stats: stats.map((shard) => ({
        ...shard,
        readyDate: new Date(shard.readyDate),
        changedHealthDate: new Date(shard.changedHealthDate),
      })),
    },
    200,
  );
});

type BotSharedGuildsResponse = {
  sharedGuilds: {
    id: string;
    name: string;
    isMember: true;
    permission: 'OWNER' | 'ADMINISTRATOR' | 'MODERATOR' | 'MEMBER';
    icon: string | null;
    banner: string | null;
  }[];
};

apiRouter.openapi(sharedGuildsRoute, async (c) => {
  const body = c.req.valid('json');
  const broadcastResults = await broadcastRequest<BotSharedGuildsResponse>('/shared-guilds', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const complete = broadcastResults.every((result) => result.ok);
  const guilds = broadcastResults
    .filter((result) => result.ok)
    .flatMap((result) => result.data.sharedGuilds);
  return c.json({ guilds, complete }, 200);
});

apiRouter.openapi(runPatreonRoute, async (c) => {
  await runPatreonTask();
  return c.body(null, 202);
});

apiRouter.openapi(runTopggRoute, async (c) => {
  await runTopggTask();
  return c.body(null, 202);
});

apiRouter.openapi(textsRoute, async (c) => {
  return c.json({ commands, patchnotes, faqs }, 200);
});
