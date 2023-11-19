let stats = {
  commandsTotal: 0,
  textMessagesTotal: 0,
};

export function incrementShardStat<K extends keyof typeof stats>(field: K) {
  stats[field] += 1;
}
export function getShardStat() {
  const stat = { ...stats };
  Object.freeze(stat);
  return stat;
}
