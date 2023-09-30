import shardDb from '../../models/shardDb/shardDb.js';
import type { Guild } from 'discord.js';

export interface LastActivities {
  textMessage: null | number;
  voiceMinute: null | number;
  invite: null | number;
  vote: null | number;
  bonus: null | number;
}

async function getLastActivities(guild: Guild, userId: string): Promise<LastActivities> {
  const keys = ['textMessage', 'voiceMinute', 'invite', 'vote', 'bonus'];

  const results = await Promise.all(
    keys.map((key) =>
      shardDb.query<{ changeDate: number }[]>(
        guild.appData.dbHost,
        `SELECT changeDate FROM ${key} WHERE guildId = ${guild.id} AND userId = ${userId} ORDER BY changeDate LIMIT 1`,
      ),
    ),
  );

  return {
    textMessage: results[0].length > 0 ? results[0][0].changeDate : null,
    voiceMinute: results[1].length > 0 ? results[1][0].changeDate : null,
    invite: results[2].length > 0 ? results[2][0].changeDate : null,
    vote: results[3].length > 0 ? results[3][0].changeDate : null,
    bonus: results[4].length > 0 ? results[4][0].changeDate : null,
  };
}

export const storage = {
  getLastActivities,
};

export default { storage };
