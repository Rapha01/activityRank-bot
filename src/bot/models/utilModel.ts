import shardDb from '../../models/shardDb/shardDb.js';
import type { Guild } from 'discord.js';

export interface TimestampedLastActivities {
  textMessage: null | number;
  voiceMinute: null | number;
  invite: null | number;
  vote: null | number;
  bonus: null | number;
}
export interface StringLastActivities {
  textMessage: string;
  voiceMinute: string;
  invite: string;
  vote: string;
  bonus: string;
}

export const storage = {
  getLastActivities: async function <T extends boolean = false>(
    guild: Guild,
    userId: string,
    timestamp: T,
  ) {
    const keys = ['textMessage', 'voiceMinute', 'invite', 'vote', 'bonus'];

    const results = await Promise.all(
      keys.map(
        (key) =>
          shardDb.query(
            guild.appData.dbHost,
            `SELECT changeDate FROM ${key} WHERE guildId = ${guild.id} AND userId = ${userId} ORDER BY changeDate LIMIT 1`,
          ) as Promise<{ changeDate: number }[]>,
      ),
    );

    const lastActivities: TimestampedLastActivities = {
      textMessage: results[0].length > 0 ? results[0][0].changeDate : null,
      voiceMinute: results[1].length > 0 ? results[1][0].changeDate : null,
      invite: results[2].length > 0 ? results[2][0].changeDate : null,
      vote: results[3].length > 0 ? results[3][0].changeDate : null,
      bonus: results[4].length > 0 ? results[4][0].changeDate : null,
    };

    if (timestamp) return lastActivities;
    else
      return Object.fromEntries(
        Object.entries(lastActivities).map(([k, v]) => [
          k,
          v ? new Date(v * 1000).toString().slice(0, 16) : 'n/a',
        ]),
      );
  },
};

export default { storage };
