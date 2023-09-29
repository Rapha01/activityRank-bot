export type StatFlushCacheType = 'textMessage' | 'voiceMinute' | 'invite' | 'vote' | 'bonus';
export interface DBDelete {
  affectedRows: number;
}
export interface DBUpdate {
  affectedRows: number;
  changedRows: number;
}
