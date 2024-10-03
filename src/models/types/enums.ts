export type StatType = 'textMessage' | 'voiceMinute' | 'invite' | 'vote' | 'bonus';
export const statTimeIntervals = ['alltime', 'year', 'month', 'week', 'day'] as const;
export type StatTimeInterval = (typeof statTimeIntervals)[number];

export interface DBDelete {
  affectedRows: number;
}
export interface DBUpdate {
  affectedRows: number;
  changedRows: number;
}
