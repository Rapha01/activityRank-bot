import shardDb from '../../models/shardDb/shardDb.js';
import type { Guild } from 'discord.js';
import { getGuildModel } from './guild/guildModel.js';

export interface LastActivities {
  textMessage: null | number;
  voiceMinute: null | number;
  invite: null | number;
  vote: null | number;
  bonus: null | number;
}

async function getLastActivities(guild: Guild, userId: string): Promise<LastActivities> {
  const { dbHost } = await getGuildModel(guild);
  const keys = ['textMessage', 'voiceMinute', 'invite', 'vote', 'bonus'];

  const results = await Promise.all(
    keys.map((key) =>
      shardDb.query<{ changeDate: string }[]>(
        dbHost,
        `SELECT changeDate FROM ${key} WHERE guildId = ${guild.id} AND userId = ${userId} ORDER BY changeDate LIMIT 1`,
      ),
    ),
  );

  const getResult = (res: { changeDate: string }[]) =>
    res.length > 0 ? parseInt(res[0].changeDate) : null;

  return {
    textMessage: getResult(results[0]),
    voiceMinute: getResult(results[1]),
    invite: getResult(results[2]),
    vote: getResult(results[3]),
    bonus: getResult(results[4]),
  };
}

export const storage = { getLastActivities };

export default { storage };
