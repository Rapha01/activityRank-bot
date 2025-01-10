export type StatType = 'textMessage' | 'voiceMinute' | 'invite' | 'vote' | 'bonus';
export const statTimeIntervals = ['alltime', 'year', 'month', 'week', 'day'] as const;
export type StatTimeInterval = (typeof statTimeIntervals)[number];
