import type { QueryError } from 'mysql2';
import { manager } from '#models/manager.js';
import { shards } from '#models/shard.js';

type ResetPeriod = 'day' | 'week' | 'month' | 'year';

const statsTables = ['textMessage', 'voiceMinute', 'vote', 'invite', 'bonus'] as const;
type StatsTable = (typeof statsTables)[number] | 'guildMember';

export async function runResetByTime(time: ResetPeriod) {
  console.log(`[reset] Resetting score (${time})`);

  const dbShards = await manager.db
    .selectFrom('dbShard')
    .select(['id', 'host'])
    .orderBy('id asc')
    .execute();
  const errors: ResetError[] = [];

  console.log(`[reset] Resetting stats (${time})`);
  for (const shard of dbShards) {
    const host = shard.host;
    const hrstart = process.hrtime();

    for (const table of statsTables) {
      await resetFullTable({ host, table, time });
    }

    const sec = Math.ceil(process.hrtime(hrstart)[0]);
    console.log(
      `[reset] Reset stats by ${time} finished for DB ${shard.id} ${shard.host} after ${sec}s with ${errors.length} errors.`,
    );
    console.log(errors);
  }

  console.log(`[reset] Resetting member scores (${time})`);

  for (const shard of dbShards) {
    const host = shard.host;
    const hrstart = process.hrtime();

    await resetFullTable({ host, table: 'guildMember', time });

    const sec = Math.ceil(process.hrtime(hrstart)[0]);
    console.log(
      `[reset] Reset scores by ${time} finished for DB ${shard.id} ${shard.host} after ${sec}s with ${errors.length} errors.`,
    );
    console.log(errors);
  }

  const hrstart = process.hrtime();

  console.log(`[reset] Attempting to resolve ${errors.length} errors.`);
  for (const error of errors) {
    if (error.isRecoverable) {
      // non-recoverable error :(
      continue;
    }

    if (error instanceof TableResetDeadlockError) {
      // Will be retried up to 3 times.
      while (true) {
        const result = await resetTableRange(error);
        if (result.ok) {
          error.resolved = true;
          break;
        }

        error.retryCount++;
        if (error.retryCount > 3) {
          break;
        }
      }
    }

    if (error instanceof FindNextIDError) {
      while (true) {
        const result = await resetFullTable({ ...error, startingId: error.lastId });
        // Add any deadlock errors to the stack to be handled
        errors.push(...result.errors);

        if (result.ok) {
          error.resolved = true;
          break;
        }

        if (result.error.lastId !== error.lastId) {
          // We're making *some* progress; retry without incrementing retryCount
          continue;
        }

        // oops, complete failure. Retry up to 3 times.
        error.retryCount++;
        if (error.retryCount > 3) {
          break;
        }
      }
    }
  }

  const unresolvedErrors = errors.filter((err) => !err.resolved);

  const sec = Math.ceil(process.hrtime(hrstart)[0]);

  // This number might be bigger than the one reported at the start, because `errors` can grow during the reset.
  console.log(
    `[reset] Resolved ${errors.length - unresolvedErrors.length} errors after ${sec} seconds.`,
  );
  console.log(`[reset] ${unresolvedErrors.length} unresolved errors:`);
  console.log(unresolvedErrors);
}

interface ResetFullTableOpts {
  time: ResetPeriod;
  table: StatsTable;
  host: string;
  startingId?: string;
}

async function resetFullTable(
  opts: ResetFullTableOpts,
): Promise<
  | { ok: true; errors: TableResetError[] }
  | { ok: false; error: FindNextIDError; errors: TableResetError[] }
> {
  const errors: TableResetError[] = [];

  // we paginate via cursor here to reduce the risk of page drift,
  // and to avoid the performance implications of OFFSET
  let highestGuildId = opts.startingId ?? '0';
  while (true) {
    // Find the guild ID 1000 guilds above the last guild.
    // Returns NULL (`null` in JS) if highestGuildId is the highest guild ID in the table.
    let nextId: string | null;
    try {
      const next = await shards
        .get(opts.host)
        .db.selectFrom((qb) =>
          qb
            .selectFrom('guild')
            .select('guildId')
            .where('guildId', '>', highestGuildId)
            .orderBy('guildId asc')
            .limit(1000)
            .as('guilds'),
        )
        .select((eb) => eb.fn.max('guilds.guildId').as('nextId'))
        .executeTakeFirst();

      if (next) {
        nextId = next.nextId;
      } else {
        nextId = null;
      }
    } catch (error) {
      // If finding nextId fails, we don't know where we should continue resetting from -
      // if we pick [nextId + 1] we could be iterating for a long time before we get out of the
      // deadlocked space, and if we pick a higher offset we risk skipping guilds.

      // The reset can be retried from the last saved point (`highestGuildId`), and should be
      // continued unitl the end of the table.
      return { ok: false, errors, error: new FindNextIDError({ ...opts, lastId: highestGuildId }) };
    }

    if (!nextId) {
      // Finished iterating through all guilds
      return { ok: true, errors };
    }

    const reset = await resetTableRange({ guildIdRange: [highestGuildId, nextId], ...opts });
    if (!reset.ok) {
      errors.push(reset.error);
    }
    highestGuildId = nextId;
  }
}

interface ResetTableRangeOpts {
  time: ResetPeriod;
  table: StatsTable;
  guildIdRange: [string, string];
  host: string;
}

async function resetTableRange(
  opts: ResetTableRangeOpts,
): Promise<{ ok: true } | { ok: false; error: TableResetError }> {
  try {
    await shards
      .get(opts.host)
      .db.updateTable(opts.table)
      .set({ [opts.time]: 0 })
      .where(opts.time, '!=', 0)
      .where((eb) => eb.between('guildId', opts.guildIdRange[0], opts.guildIdRange[1]))
      .executeTakeFirstOrThrow();
  } catch (source) {
    let error: ResetError;

    if ((source as QueryError)?.code === 'ER_LOCK_DEADLOCK') {
      error = new TableResetDeadlockError(opts);
    } else {
      error = new TableResetFailedError({ ...opts, source });
    }

    return { ok: false, error };
  }

  return { ok: true };
}

interface ResetErrorOpts {
  host: string;
  table: StatsTable;
  time: ResetPeriod;
}

/** All reset errors should include this basic information. */
class BaseResetError {
  resolved: boolean;
  host: string;
  table: StatsTable;
  time: ResetPeriod;
  isRecoverable = false;

  constructor(opts: ResetErrorOpts) {
    this.resolved = false;
    this.host = opts.host;
    this.table = opts.table;
    this.time = opts.time;
  }
}

class RecoverableResetError extends BaseResetError {
  retryCount: number;
  override isRecoverable = true;

  constructor(opts: ResetErrorOpts) {
    super(opts);
    this.retryCount = 0;
  }
}

/** Returned when a call to paginate through guild IDs fails. */
class FindNextIDError extends RecoverableResetError {
  lastId: string;

  constructor(opts: ResetErrorOpts & { lastId: string }) {
    super(opts);
    this.lastId = opts.lastId;
  }
}

/** Returned when a table reset call fails due to a deadlock. Recoverable and should be retried. */
class TableResetDeadlockError extends RecoverableResetError {
  guildIdRange: [string, string];

  constructor(opts: ResetErrorOpts & { guildIdRange: [string, string] }) {
    super(opts);
    this.guildIdRange = opts.guildIdRange;
  }
}

/** Returned when a table reset call fails for unknown reasons. Not recoverable. */
class TableResetFailedError extends BaseResetError {
  source: unknown;

  constructor(opts: ResetErrorOpts & { source: unknown }) {
    super(opts);
    this.source = opts.source;
  }
}

/** A union of possible `BaseResetError`s returned from resetTableRange */
type TableResetError = TableResetDeadlockError | TableResetFailedError;

/** A union of possible `BaseResetError`s */
type ResetError = FindNextIDError | TableResetFailedError | TableResetDeadlockError;
