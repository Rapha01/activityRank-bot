export type StatType = 'textMessage' | 'voiceMinute' | 'invite' | 'vote' | 'bonus';
export const statTimeIntervals = ['Alltime', 'Year', 'Month', 'Week', 'Day'] as const;
export type StatTimeInterval = (typeof statTimeIntervals)[number];
// TODO: deprecate above types. Both are useful but lowercase is preferred for consistency with the database.
export const statTimeIntervals_v2 = ['alltime', 'year', 'month', 'week', 'day'] as const;
export type StatTimeInterval_V2 = (typeof statTimeIntervals_v2)[number];

export interface DBDelete {
  affectedRows: number;
}
export interface DBUpdate {
  affectedRows: number;
  changedRows: number;
}
