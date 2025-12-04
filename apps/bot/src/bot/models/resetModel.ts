import type { ShardDB } from '@activityrank/database';
import { AsyncQueue } from '@sapphire/async-queue';
import type { ButtonInteraction, ChatInputCommandInteraction, Guild } from 'discord.js';
import { sql } from 'kysely';
import { nanoid } from 'nanoid';
import { outdent } from 'outdent';
import { logger } from '#bot/util/logger.ts';
import { isProduction } from '#const/config.ts';
import { sleep } from '#util/fct.ts';
import { shards } from '../../models/shardDb/shardDb.ts';
import { channelCache, getRankedChannelIds } from './guild/guildChannelModel.ts';
import { getRankedUserIds, memberCache } from './guild/guildMemberModel.ts';
import { getGuildModel, guildCache } from './guild/guildModel.ts';
import { clearRoleCache, roleCache } from './guild/guildRoleModel.ts';

export const RESET_JOBS: Set<ResetJob> = new Set();
export const RESET_GUILD_IDS: Set<string> = new Set();
export const RESET_QUEUE = new AsyncQueue();

/**
 * The status of a {@link ResetJob}
 */
export const ResetStatus = {
  /** Job is waiting to start */
  Waiting: 'WAITING' as const,
  /** Getting number of rows to reset */
  Planning: 'PLANNING' as const,
  /** Job is done planning and is ready to execute */
  Ready: 'READY' as const,
  /** Actively resetting */
  Executing: 'EXECUTING' as const,
  /** All done! */
  Complete: 'COMPLETE' as const,
  /** An error occurred. */
  Error: 'ERROR' as const,
};
export type ResetStatus = (typeof ResetStatus)[keyof typeof ResetStatus];

const BATCHSIZE = isProduction ? 10_000 : 10;

/**
 * @example
 * // log starting message
 * await interaction.respond('Starting reset of XYZ...');
 * const resetJob: AllMemberResetJob = new AllMemberResetJob(guild)
 * // Get estimate of modified rows
 * await resetJob.plan();
 * // Send empty status bar
 * await resetJob.logStatus(interaction);
 *
 * // ---
 * while (true) {
 *   // Run an iteration of the reset
 *   const done: Boolean = await resetJob.run();
 *   if (done) break;
 *   // Update status bar
 *   await resetJob.logStatus(interaction);
 * }
 * // -- OR --
 * await resetJob.runUntilComplete({onPause: async () => await resetJob.logStatus(interaction)})
 * // ---
 *
 * // Send the reset's completion
 * await resetJob.logStatus(interaction);
 */
abstract class ResetJob {
  public readonly guild: Guild;
  /** The number of database rows this job has already modified. */
  protected _totalRowsAffected = 0;
  /** The number of database rows this job has already modified on this iteration. Will be reset before each {@link runIter} call. */
  protected rowsAffectedIter = 0;
  /** The current status of this reset job. */
  protected _resetStatus: ResetStatus = ResetStatus.Waiting;
  /** A unique ID to this job. Used only for tracking in logs. */
  public readonly jobId: string = nanoid(10);

  constructor(guild: Guild) {
    this.guild = guild;
    logger.debug(`Created reset job in guild ${guild.id}: ${this.jobId}`);
    RESET_JOBS.add(this);
    RESET_GUILD_IDS.add(guild.id);
  }

  /**
   * An approximate estimation of the number of rows this job will need to modify to be completed.
   * This should be set in the {@link ResetStatus.Planning} phase and not be null afterwards.
   * It should not be relied upon to be accurate, and only used to provide estimates to the end user.
   */
  protected rowEstimation: number | null = null;

  protected incrementRows(rows: number | bigint): void {
    this._totalRowsAffected += Number(rows);
    this.rowsAffectedIter += Number(rows);
  }

  /** The total number of database rows this job has already modified. */
  public get totalRowsAffected(): number {
    return this._totalRowsAffected;
  }

  /** The current status of this reset job. */
  public get status(): ResetStatus {
    return this._resetStatus;
  }

  /** Skip the planning step, avoiding the cost of calling {@link plan}. Always returns a rowEstimation of 0. */
  public skipPlan() {
    if (this.status !== ResetStatus.Waiting) {
      throw new Error(
        `ResetJob.skipPlan() called during stage ${this.status} (expected ${ResetStatus.Waiting})`,
      );
    }

    logger.debug(`Skipping plan of reset job ${this.jobId}`);

    this.rowEstimation = 0;
    this._resetStatus = ResetStatus.Ready;

    return { rowEstimation: 0 };
  }

  /** Determine the number of rows that need to be modified, and set {@link this.rowEstimation}. This will not always be called; {@link skipPlan} may be called instead. */
  public async plan(): Promise<{ rowEstimation: number }> {
    if (this.status !== ResetStatus.Waiting) {
      throw new Error(
        `ResetJob.plan() called during stage ${this.status} (expected ${ResetStatus.Waiting})`,
      );
    }

    logger.debug(`Planning reset job ${this.jobId}`);

    this._resetStatus = ResetStatus.Planning;

    const { rowEstimation } = await this.getPlan();
    this.rowEstimation = rowEstimation;

    this._resetStatus = ResetStatus.Ready;
    return { rowEstimation };
  }
  /** Warning: This will not always be called; {@link skipPlan} may be called instead. */
  protected abstract getPlan(): Promise<{ rowEstimation: number }>;

  protected abstract getStatusContent(): string;
  /**
   * Updates the interaction message with the current status of the job, generated by {@link getStatusContent} by default.
   * @param interaction The interaction to update
   */
  public async logStatus(
    interaction: ChatInputCommandInteraction<'cached'> | ButtonInteraction<'cached'>,
  ): Promise<void> {
    await interaction.editReply({
      content: this.getStatusContent(),
    });
  }

  /**
   * Executes the reset job. This method should only be invoked when the job's status is {@link ResetStatus.Ready} or {@link ResetStatus.Executing}.
   *
   * It waits for an available slot in the `RESET_QUEUE`, then calls {@link runIter} to perform a portion of the reset process.
   * After the iteration, it may introduce a delay based on the provided `bufferTime` to keep the queue unlocked for that duration.
   *
   * If the job completes successfully, the status is updated to {@link ResetStatus.Complete} and `true` is returned.
   * If the job is not yet complete, `false` is returned, and the method should be called again to continue the reset process.
   *
   * @param [options] - Optional configuration for the execution of the job.
   * @param [options.bufferTime] - Optional buffer time in milliseconds to keep the queue unlocked after the iteration completes. This helps in controlling the timing between successive job executions.
   *
   * @returns A promise that resolves to `true` if the reset job is fully completed, and `false` if it needs to be executed again.
   *
   * @throws Throws an error if the job's status is not {@link ResetStatus.Ready} or {@link ResetStatus.Executing} when the method is called.
   *
   * @example
   * const completed = await resetJob.run({ bufferTime: 500 });
   * if (completed) {
   *   console.log('The reset job has been completed.');
   * } else {
   *   console.log('The reset job needs to be run again.');
   * }
   */
  public async run(options?: { bufferTime?: number }): Promise<boolean> {
    if (this.status !== ResetStatus.Ready && this.status !== ResetStatus.Executing) {
      throw new Error(
        `run() should only be called when the job is [Ready: ${ResetStatus.Ready}] or [Executing: ${ResetStatus.Executing}] (found ${this.status})`,
      );
    }

    logger.debug(`Executing reset job ${this.jobId}`);

    this._resetStatus = ResetStatus.Executing;
    await RESET_QUEUE.wait();

    let result: boolean;

    try {
      logger.debug(`Executing iteration of reset job ${this.jobId}`);

      this.rowsAffectedIter = 0;
      result = await this.runIter();
      // keeps the queue locked and unusable for bufferTime ms after runIter has completed
      if (options?.bufferTime) await sleep(options.bufferTime);
    } catch (err) {
      this._resetStatus = ResetStatus.Error;
      logger.warn(`Reset job ${this.jobId} failed.`, { error: err });
      // return `completed: true` to indicate that run() should not be called again
      result = true;
    } finally {
      // unlock queue. `finally` block prevents deadlocking.
      RESET_QUEUE.shift();
    }

    if (result) {
      this._resetStatus = ResetStatus.Complete;
      // on completion, override rowEstimation to be equal to totalRowsAffected.
      // This is so that if rowEstimation was overestimated, the final completion percentage is still 100%.
      // This is one of the reasons why rowEstimation should not be relied upon.
      this.rowEstimation = this.totalRowsAffected;
      RESET_JOBS.delete(this);
      RESET_GUILD_IDS.delete(this.guild.id);
      logger.debug(`Completed reset job ${this.jobId}`);
    }
    return result;
  }

  /**
   * Run an iteration of the reset job.
   * Called by {@link run()} to execute part of the reset.
   *
   * If the reset is completed, it should return `true`.
   * Otherwise, it should return `false`, and will be called again in the future.
   *
   * @returns `true` if the reset is entirely completed.
   */
  protected abstract runIter(): Promise<boolean>;

  /**
   * Runs the reset job until it is complete. This function repeatedly calls {@link run} until the job is finished.
   * It should only be called when the job's status is {@link ResetStatus.Ready} or {@link ResetStatus.Executing}.
   *
   * @param [options] - Optional configuration for the execution of the job.
   * @param [options.onPause] - A callback function that is awaited after each call to {@link run}. This can be used to perform operations such as updating status or logging.
   * @param [options.globalBufferTime] - A global buffer time (in milliseconds) to pass to the {@link run} function, affecting its execution behavior.
   * @param [options.jobBufferTime] - A job-specific buffer time (in milliseconds) to pause the execution between job iterations. This allows other operations to proceed while waiting.
   *
   * @throws Throws an error if the job's status is not {@link ResetStatus.Ready} when this function is called.
   *
   * @returns A promise that resolves when the job has completed. The promise is resolved once the job is finished and no further iterations are required.
   *
   * @example
   * await resetJob.runUntilComplete({
   *   onPause: async () => {
   *     // Perform status update or logging
   *     await updateStatus(interaction);
   *   },
   *   globalBufferTime: 500, // Pass a buffer time to the run function
   *   jobBufferTime: 2000, // Pause between iterations
   * });
   */
  public async runUntilComplete(options?: {
    onPause?: () => Promise<void> | void;
    globalBufferTime?: number;
    jobBufferTime?: number;
  }): Promise<void> {
    if (this.status !== ResetStatus.Ready) {
      throw new Error(
        `runUntilComplete should only be called when the job is [Ready: ${ResetStatus.Ready}] (found ${this.status})`,
      );
    }

    while (true) {
      // Run an iteration of the reset
      const done = await this.run({ bufferTime: options?.globalBufferTime });
      if (done) return;

      if (options?.onPause) await options.onPause();
      // sleep *only this job* for jobBufferTime, keeping the queue unlocked.
      if (options?.jobBufferTime) await sleep(options.jobBufferTime);
    }
  }

  protected get canContinue(): boolean {
    return this.rowsAffectedIter < BATCHSIZE;
  }
}

const ESC = '\u001b';
export function renderProgressBar(maybeFraction: number): string {
  const LENGTH = 27;
  // isNaN would likely be true because of a divide by 0, indicating that 0 rows needed to be reset.
  // A fraction greater than 1 indicates more than 100% completion.
  const fraction = Number.isNaN(maybeFraction) ? 1 : Math.min(1, maybeFraction);

  const filled = Math.ceil(fraction * LENGTH);
  const empty = Math.floor((1 - fraction) * LENGTH);

  const percent = Math.ceil(fraction * 100);

  // the filled bar is green if it's done, otherwise yellow
  const firstColor = percent > 99 ? '32' : '33';

  return outdent`
    \`\`\`ansi
    ${ESC}[1;${firstColor}m${'='.repeat(filled)}${ESC}[30m${'-'.repeat(empty)}${ESC}[0m | ${ESC}[1;36m${percent}%
    \`\`\`
  `;
}

export class ResetGuildSettings extends ResetJob {
  protected getStatusContent(): string {
    const estimate = this.rowEstimation as number;
    if (this.totalRowsAffected >= estimate) {
      return `### Reset complete!\n${renderProgressBar(this.totalRowsAffected / estimate)}`;
    }
    return `### Resetting Server Settings...\n${renderProgressBar(this.totalRowsAffected / estimate)}`;
  }

  protected async getPlan(): Promise<{ rowEstimation: number }> {
    const cachedGuild = await getGuildModel(this.guild);
    const { db } = shards.get(cachedGuild.dbHost);

    // Estimated number of rows: number of channels + number of roles
    const { rowEstimation } = await db
      .selectFrom([
        db
          .selectFrom('guildChannel')
          .select((s) => s.fn.countAll<string>().as('count'))
          .where('guildId', '=', this.guild.id)
          .as('channel'),
        db
          .selectFrom('guildRole')
          .select((s) => s.fn.countAll<string>().as('count'))
          .where('guildId', '=', this.guild.id)
          .as('role'),
      ])
      .select((eb) => eb('channel.count', '+', eb.ref('role.count')).as('rowEstimation'))
      .executeTakeFirstOrThrow();

    return { rowEstimation: Number(rowEstimation) };
  }

  protected async runIter(): Promise<boolean> {
    const cachedGuild = await getGuildModel(this.guild);
    const { db } = shards.get(cachedGuild.dbHost);

    // delete all entries in guildRole and guildChannel;
    // these tables don't store any XP data
    const tables = ['guildRole', 'guildChannel'] as const;

    clearRoleCache();

    for (const table of tables) {
      if (!this.canContinue) return false;
      const res = await db
        .deleteFrom(table)
        .where('guildId', '=', this.guild.id)
        .limit(BATCHSIZE - this.rowsAffectedIter)
        .executeTakeFirstOrThrow();

      this.incrementRows(res.numDeletedRows);
    }

    if (!this.canContinue) return false;

    // get all keys in the `guild` table - and revert to default not in PERMANENT_GUILD_FIELDS.
    const dbGuild: Record<keyof ShardDB.Guild, unknown> = await db
      .selectFrom('guild')
      .selectAll()
      .where('guildId', '=', this.guild.id)
      .executeTakeFirstOrThrow();
    const guildKeys: (keyof ShardDB.Guild)[] = Object.keys(dbGuild) as (keyof ShardDB.Guild)[];

    const defaultEntries = Object.fromEntries(
      guildKeys.filter((k) => !PERMANENT_GUILD_FIELDS.has(k)).map((k) => [k, sql`DEFAULT`]),
    );

    await db
      .updateTable('guild')
      .set(defaultEntries)
      .where('guildId', '=', this.guild.id)
      .executeTakeFirstOrThrow();

    // regenerate caches
    resetGuildCache(this.guild).allRoles();
    resetGuildCache(this.guild).allChannels();
    resetGuildCache(this.guild).allMembers();
    resetGuildCache(this.guild).guild();

    return true;
  }
}

export async function resetGuildChannelsSettings(guild: Guild, channelIds: string[]) {
  const cachedGuild = await getGuildModel(guild);
  const { db } = shards.get(cachedGuild.dbHost);

  await db
    .deleteFrom('guildChannel')
    .where('guildId', '=', guild.id)
    .where('channelId', 'in', channelIds)
    .executeTakeFirstOrThrow();

  resetGuildCache(guild).allMembers();
  resetGuildCache(guild).channels(channelIds);
}

export class ResetGuildChannelsStatistics extends ResetJob {
  private channelIds: string[];

  constructor(guild: Guild, channelIds: string[]) {
    super(guild);
    this.channelIds = channelIds;
  }

  protected getStatusContent(): string {
    const estimate = this.rowEstimation as number;
    if (this.totalRowsAffected >= estimate) {
      return `### Reset complete!\n${renderProgressBar(this.totalRowsAffected / estimate)}`;
    }
    return `### Resetting Channel Statistics...\n${renderProgressBar(this.totalRowsAffected / estimate)}`;
  }

  protected async getPlan(): Promise<{ rowEstimation: number }> {
    const cachedGuild = await getGuildModel(this.guild);
    const { db } = shards.get(cachedGuild.dbHost);

    // Estimated number of rows: number of textmessages + voiceminute entries in relevant channels
    const { rowEstimation } = await db
      .selectFrom([
        db
          .selectFrom('textMessage')
          .select((s) => s.fn.countAll<string>().as('count'))
          .where('guildId', '=', this.guild.id)
          .where('channelId', 'in', this.channelIds)
          .as('message'),
        db
          .selectFrom('voiceMinute')
          .select((s) => s.fn.countAll<string>().as('count'))
          .where('guildId', '=', this.guild.id)
          .where('channelId', 'in', this.channelIds)
          .as('voice'),
      ])
      .select((eb) => eb('message.count', '+', eb.ref('voice.count')).as('rowEstimation'))
      .executeTakeFirstOrThrow();

    return { rowEstimation: Number(rowEstimation) };
  }

  protected async runIter(): Promise<boolean> {
    const cachedGuild = await getGuildModel(this.guild);
    const { db } = shards.get(cachedGuild.dbHost);

    // delete all relevant entries in textMessage and voiceMinute
    const tables = ['textMessage', 'voiceMinute'] as const;

    for (const table of tables) {
      if (!this.canContinue) return false;
      const res = await db
        .deleteFrom(table)
        .where('guildId', '=', this.guild.id)
        .where('channelId', 'in', this.channelIds)
        .limit(BATCHSIZE - this.rowsAffectedIter)
        .executeTakeFirstOrThrow();

      this.incrementRows(res.numDeletedRows);
    }

    if (!this.canContinue) return false;

    // regenerate caches
    resetGuildCache(this.guild).allMembers();
    resetGuildCache(this.guild).channels(this.channelIds);

    return true;
  }
}

// This will simultaneously reset a set of members' statistics and XP.
// The combination of the two jobs is intentional; separating them could
// leave the system vulnerable to manipulation by server admins,
// by resetting only statistics or only XP for a single user.
export class ResetGuildMembersStatisticsAndXp extends ResetJob {
  private memberIds: string[];

  constructor(guild: Guild, memberIds: string[]) {
    super(guild);
    this.memberIds = memberIds;
  }

  protected getStatusContent(): string {
    const estimate = this.rowEstimation as number;
    if (this.totalRowsAffected >= estimate) {
      return `### Reset complete!\n${renderProgressBar(this.totalRowsAffected / estimate)}`;
    }
    return `### Resetting Member Statistics...\n${renderProgressBar(this.totalRowsAffected / estimate)}`;
  }

  protected async getPlan(): Promise<{ rowEstimation: number }> {
    const cachedGuild = await getGuildModel(this.guild);
    const { db } = shards.get(cachedGuild.dbHost);

    const tables = ['textMessage', 'voiceMinute', 'vote', 'invite', 'bonus'] as const;

    // Estimated number of rows: number of statistic entries of relevant members
    const { rowEstimation } = await db
      .selectFrom(
        tables.map((table) =>
          db
            .selectFrom(table)
            .select((s) => s.fn.countAll<string>().as('count'))
            .where('guildId', '=', this.guild.id)
            .where('userId', 'in', this.memberIds)
            .as(table),
        ),
      )
      .select((eb) =>
        tables
          .slice(1)
          .reduce((prev, curr) => eb(`${curr}.count`, '+', prev), eb.ref(`${tables[0]}.count`))
          .as('rowEstimation'),
      )
      .executeTakeFirstOrThrow();

    return { rowEstimation: Number(rowEstimation) };
  }

  protected async runIter(): Promise<boolean> {
    const cachedGuild = await getGuildModel(this.guild);
    const { db } = shards.get(cachedGuild.dbHost);

    // delete all relevant entries in stats tables
    const tables = ['textMessage', 'voiceMinute', 'vote', 'invite', 'bonus'] as const;

    for (const table of tables) {
      if (!this.canContinue) return false;
      const res = await db
        .deleteFrom(table)
        .where('guildId', '=', this.guild.id)
        .where('userId', 'in', this.memberIds)
        .limit(BATCHSIZE - this.rowsAffectedIter)
        .executeTakeFirstOrThrow();

      this.incrementRows(res.numDeletedRows);
    }

    if (!this.canContinue) return false;

    const resetKeys: (keyof ShardDB.GuildMemberUpdate)[] = [
      'inviter',
      'day',
      'week',
      'month',
      'year',
      'alltime',
    ];

    const defaultEntries = Object.fromEntries(resetKeys.map((k) => [k, sql`DEFAULT`]));

    await db
      .updateTable('guildMember')
      .set(defaultEntries)
      .where('guildId', '=', this.guild.id)
      .where('userId', 'in', this.memberIds)
      .limit(BATCHSIZE - this.rowsAffectedIter)
      .executeTakeFirstOrThrow();

    // this check is required: otherwise the previous update could be
    // partial but return `true`, signalling no further processing.
    if (!this.canContinue) return false;

    // regenerate cache
    resetGuildCache(this.guild).members(this.memberIds);

    return true;
  }
}

/**
 *  We (me - @piemot, @rapha01, and @geheimerwolf) have agreed on the following conventions for resets:
 * 1. Resets of text, voice, invite, and votes reset *the statistics, but not the associated XP.*
 * Resets of invite stats should allow new inviters to be set.
 * 2. *Resets of the bonus stat* affect the XP values of members (members with positive bonus XP lose XP, those with negative XP gain it)
 * Because of this, *one bonus statistic must correspond exactly to one XP.*
 * This convention has been held for years so I don't predict it being problematic in future.
 * 3. TODO: With a Patreon subscription, admins can adjust text, voice, invite, and upvote statistics as long as they enable a server flag.
 * This server flag is displayed publicly on /serverinfo, /rank, and/or /top.
 * Once enabled, the flag cannot be turned off unless the entire server's XP is reset.
 */
export class ResetGuildStatistics extends ResetJob {
  static readonly ALL_TABLES = ['textMessage', 'voiceMinute', 'vote', 'invite', 'bonus'] as const;

  private ranBonusReduction = false;
  private tables: readonly ('textMessage' | 'voiceMinute' | 'vote' | 'invite' | 'bonus')[];

  constructor(
    guild: Guild,
    tables: readonly ('textMessage' | 'voiceMinute' | 'vote' | 'invite' | 'bonus')[],
  ) {
    if (tables.length < 1) {
      throw new Error('A statistic reset must reset at least one table.');
    }
    if (new Set(tables).size !== tables.length) {
      throw new Error('A statistic reset may not provide duplicate tables.');
    }
    super(guild);
    this.tables = tables;
  }

  protected getStatusContent(): string {
    const estimate = this.rowEstimation as number;
    if (this.totalRowsAffected >= estimate) {
      return `### Reset complete!\n${renderProgressBar(this.totalRowsAffected / estimate)}`;
    }
    return `### Resetting Server Statistics...\n${renderProgressBar(this.totalRowsAffected / estimate)}`;
  }

  protected async getPlan(): Promise<{ rowEstimation: number }> {
    const cachedGuild = await getGuildModel(this.guild);
    const { db } = shards.get(cachedGuild.dbHost);

    // Estimated number of rows: number of statistic entries of relevant guilds
    const { rowEstimation } = await db
      .selectFrom([
        // select count from every statistic entry
        ...this.tables.map((table) =>
          db
            .selectFrom(table)
            .select((s) => s.fn.countAll<string>().as('count'))
            .where('guildId', '=', this.guild.id)
            .as(table),
        ),
      ])
      .select((eb) =>
        // sum all counts
        this.tables
          .slice(1)
          .reduce((prev, curr) => eb(`${curr}.count`, '+', prev), eb.ref(`${this.tables[0]}.count`))
          .as('rowEstimation'),
      )
      .executeTakeFirstOrThrow();

    // accomodate for the large query run when bonus is reset
    return {
      rowEstimation: this.tables.includes('bonus')
        ? Math.floor(1.3 * Number(rowEstimation))
        : Number(rowEstimation),
    };
  }

  protected async runIter(): Promise<boolean> {
    const cachedGuild = await getGuildModel(this.guild);
    const { db } = shards.get(cachedGuild.dbHost);

    // Subtract member's previous `bonus` xp from their total XP if `bonus` is selected for reset
    if (this.tables.includes('bonus') && !this.ranBonusReduction) {
      // this has to be a raw statement because Kysely inverts the order of clauses: https://github.com/kysely-org/kysely/issues/192
      // the `bonus.alltime` fields in the SET statement are intentional: *all* bonus XP is removed instantaneously,
      // just as it would be if it were added via /bonus member.
      // the LIMIT clause is intentionally omitted here because we only want this to run once.
      await sql`
UPDATE \`guildMember\`
  INNER JOIN (
  SELECT
    \`userId\`,
    \`bonus\`.\`alltime\`
  FROM
    \`bonus\`
  WHERE
    \`guildId\` = ${this.guild.id}
  ) AS \`bonus\` ON \`guildMember\`.\`userId\` = \`bonus\`.\`userId\`
SET
  \`guildMember\`.\`alltime\` = \`guildMember\`.\`alltime\` - \`bonus\`.\`alltime\`,
  \`year\` = \`guildMember\`.\`year\` - \`bonus\`.\`alltime\`,
  \`month\` = \`guildMember\`.\`month\` - \`bonus\`.\`alltime\`,
  \`week\` = \`guildMember\`.\`week\` - \`bonus\`.\`alltime\`,
  \`day\` = \`guildMember\`.\`day\` - \`bonus\`.\`alltime\`
WHERE
  \`guildId\` = ${this.guild.id}
`.execute(db);

      // just an estimate - 5% is an arbitrary increment
      this.incrementRows(Math.floor((this.rowEstimation as number) / 20));

      this.ranBonusReduction = true;
      // because the limit clause is excluded above, we forcibly skip a cycle to try to accomodate the load
      return false;
    }

    // delete all relevant entries in specified stats tables
    for (const table of this.tables) {
      if (!this.canContinue) return false;
      const res = await db
        .deleteFrom(table)
        .where('guildId', '=', this.guild.id)
        .limit(BATCHSIZE - this.rowsAffectedIter)
        .executeTakeFirstOrThrow();

      this.incrementRows(res.numDeletedRows);
    }

    if (!this.canContinue) return false;

    // reset inviters if invites are being reset.
    if (this.tables.includes('invite')) {
      await db
        .updateTable('guildMember')
        .set({ inviter: sql`DEFAULT` })
        .where('guildId', '=', this.guild.id)
        .limit(BATCHSIZE - this.rowsAffectedIter)
        .executeTakeFirstOrThrow();
    }

    // this check is required: otherwise the previous update could be
    // partial but return `true`, signalling no further processing.
    if (!this.canContinue) return false;

    // regenerate cache
    resetGuildCache(this.guild).allMembers();

    return true;
  }
}

export class ResetGuildXP extends ResetJob {
  protected getStatusContent(): string {
    const estimate = this.rowEstimation as number;
    if (this.totalRowsAffected >= estimate) {
      return `### Reset complete!\n${renderProgressBar(this.totalRowsAffected / estimate)}`;
    }
    return `### Resetting Server XP...\n${renderProgressBar(this.totalRowsAffected / estimate)}`;
  }

  protected async getPlan(): Promise<{ rowEstimation: number }> {
    const cachedGuild = await getGuildModel(this.guild);
    const { db } = shards.get(cachedGuild.dbHost);

    // Estimated number of rows: number of members in guild
    const { count } = await db
      .selectFrom('guildMember')
      .select((s) => s.fn.countAll<string>().as('count'))
      .where('guildId', '=', this.guild.id)
      .executeTakeFirstOrThrow();

    return { rowEstimation: Number(count) };
  }

  protected async runIter(): Promise<boolean> {
    const cachedGuild = await getGuildModel(this.guild);
    const { db } = shards.get(cachedGuild.dbHost);

    const resetKeys: (keyof ShardDB.GuildMemberUpdate)[] = [
      'day',
      'week',
      'month',
      'year',
      'alltime',
    ];

    const defaultEntries = Object.fromEntries(resetKeys.map((k) => [k, sql`DEFAULT`]));

    // reset the guildMember table to 0
    await db
      .updateTable('guildMember')
      .set(defaultEntries)
      .where('guildId', '=', this.guild.id)
      .limit(BATCHSIZE - this.rowsAffectedIter)
      .executeTakeFirstOrThrow();

    if (!this.canContinue) return false;

    // regenerate cache
    resetGuildCache(this.guild).allMembers();

    return true;
  }
}

export class ResetGuildStatisticsAndXp extends ResetJob {
  private resetStatistics: ResetJob;
  private resetXp: ResetJob;

  constructor(guild: Guild) {
    super(guild);
    this.resetStatistics = new ResetGuildStatistics(guild, ResetGuildStatistics.ALL_TABLES);
    this.resetXp = new ResetGuildXP(guild);
  }

  protected getStatusContent(): string {
    const estimate = this.rowEstimation as number;
    if (this.totalRowsAffected >= estimate) {
      return `### Reset complete!\n${renderProgressBar(this.totalRowsAffected / estimate)}`;
    }
    return `### Resetting Server...\n${renderProgressBar(this.totalRowsAffected / estimate)}`;
  }

  protected async getPlan(): Promise<{ rowEstimation: number }> {
    const { rowEstimation: statisticEstimation } = await this.resetStatistics.plan();
    const { rowEstimation: xpEstimation } = await this.resetXp.plan();

    return { rowEstimation: statisticEstimation + xpEstimation };
  }

  // identical to parent method, but without queueing because sub-jobs will queue themselves.
  override async run(): Promise<boolean> {
    if (this.status !== ResetStatus.Ready && this.status !== ResetStatus.Executing) {
      throw new Error(
        `run() should only be called when the job is [Ready: ${ResetStatus.Ready}] or [Executing: ${ResetStatus.Executing}] (found ${this.status})`,
      );
    }

    this._resetStatus = ResetStatus.Executing;

    this.rowsAffectedIter = 0;

    const resetIsCompleted = await this.runIter();

    if (resetIsCompleted) {
      this._resetStatus = ResetStatus.Complete;
      this.rowEstimation = this.totalRowsAffected;
      RESET_JOBS.delete(this);
      RESET_GUILD_IDS.delete(this.guild.id);
    }

    return resetIsCompleted;
  }

  protected async runIter(): Promise<boolean> {
    for (const job of [this.resetStatistics, this.resetXp]) {
      if (job.status !== ResetStatus.Complete) {
        await job.run();

        this._totalRowsAffected =
          this.resetStatistics.totalRowsAffected + this.resetXp.totalRowsAffected;

        return false;
      }
    }
    return true;
  }
}

export class ResetGuildAll extends ResetJob {
  private resetSettings: ResetJob;
  private resetStatistics: ResetJob;
  private resetXp: ResetJob;

  constructor(guild: Guild) {
    super(guild);
    this.resetSettings = new ResetGuildSettings(guild);
    this.resetStatistics = new ResetGuildStatistics(guild, ResetGuildStatistics.ALL_TABLES);
    this.resetXp = new ResetGuildXP(guild);
  }

  protected getStatusContent(): string {
    const estimate = this.rowEstimation as number;
    if (this.totalRowsAffected >= estimate) {
      return `### Reset complete!\n${renderProgressBar(this.totalRowsAffected / estimate)}`;
    }
    return `### Resetting Server...\n${renderProgressBar(this.totalRowsAffected / estimate)}`;
  }

  protected async getPlan(): Promise<{ rowEstimation: number }> {
    const { rowEstimation: settingEstimation } = await this.resetSettings.plan();
    const { rowEstimation: statisticEstimation } = await this.resetStatistics.plan();
    const { rowEstimation: xpEstimation } = await this.resetXp.plan();

    return { rowEstimation: settingEstimation + statisticEstimation + xpEstimation };
  }

  // identical to parent method, but without queueing because sub-jobs will queue themselves.
  override async run(): Promise<boolean> {
    if (this.status !== ResetStatus.Ready && this.status !== ResetStatus.Executing) {
      throw new Error(
        `run() should only be called when the job is [Ready: ${ResetStatus.Ready}] or [Executing: ${ResetStatus.Executing}] (found ${this.status})`,
      );
    }

    this._resetStatus = ResetStatus.Executing;

    this.rowsAffectedIter = 0;

    const resetIsCompleted = await this.runIter();

    if (resetIsCompleted) {
      this._resetStatus = ResetStatus.Complete;
      this.rowEstimation = this.totalRowsAffected;
      RESET_JOBS.delete(this);
      RESET_GUILD_IDS.delete(this.guild.id);
    }

    return resetIsCompleted;
  }

  protected async runIter(): Promise<boolean> {
    for (const job of [this.resetSettings, this.resetStatistics, this.resetXp]) {
      if (job.status !== ResetStatus.Complete) {
        await job.run();

        this._totalRowsAffected =
          this.resetSettings.totalRowsAffected +
          this.resetStatistics.totalRowsAffected +
          this.resetXp.totalRowsAffected;

        return false;
      }
    }
    return true;
  }
}

/**
 * Fetch an array of users' IDs who are ranked in the database, but are no longer in the guild.
 *
 * @param guild the guild to get ids from
 * @returns A list of the IDs of users that are registered in the database but not in the server.
 */
export async function fetchDeletedUserIds(guild: Guild): Promise<string[]> {
  const userIds = await getRankedUserIds(guild);
  const users = await guild.members.fetch({ withPresences: false });

  const deletedUserIds = [];

  for (const userId of userIds) {
    if (users.get(userId)) continue;

    deletedUserIds.push(userId);
  }

  return deletedUserIds;
}

/**
 * Fetch an array of channels' IDs which are ranked in the database, but have been deleted from the guild.
 *
 * @param guild the guild to get ids from
 * @returns A list of the IDs of channels that are registered in the database but not in the server.
 */
export async function fetchDeletedChannelIds(guild: Guild): Promise<string[]> {
  const channelIds = await getRankedChannelIds(guild);

  const deletedChannelIds = [];
  for (const channelId of channelIds) {
    if (guild.channels.cache.get(channelId)) continue;

    deletedChannelIds.push(channelId);
  }

  return deletedChannelIds;
}

/**
 * Fields in this list won't be reset to DEFAULT when a guild reset is run.
 */
const PERMANENT_GUILD_FIELDS = new Set<keyof ShardDB.GuildUpdate>([
  'guildId',
  'lastCommandDate',
  'joinedAtDate',
  'leftAtDate',
  'addDate',
]);

/**
 * Creates an object with methods to reset various caches related to a given guild.
 * This is useful for clearing cache entries when changes occur in the guild.
 *
 * @param guild - The guild object for which caches need to be reset.
 *
 * @returns An object with methods to reset specific caches:
 *
 * - `guild`: Clears the cache entry for the given guild.
 * - `allMembers`: Clears the cache entries for all members in the guild.
 * - `allChannels`: Clears the cache entries for all channels in the guild.
 * - `allRoles`: Clears the cache entries for all roles in the guild.
 * - `members(userIds: string[])`: Clears the cache entries for specified members by their user IDs.
 * - `channels(channelIds: string[])`: Clears the cache entries for specified channels by their channel IDs.
 *
 * @example
 * const cacheManager = resetGuildCache(guild);
 * cacheManager.guild(); // Clears cache for the guild
 * cacheManager.allMembers(); // Clears cache for all members
 * cacheManager.members(['userId1', 'userId2']); // Clears cache for specific members
 * cacheManager.channels(['channelId1', 'channelId2']); // Clears cache for specific channels
 */
export const resetGuildCache = (guild: Guild) => ({
  guild() {
    guildCache.delete(guild);
  },
  allMembers() {
    for (const member of guild.members.cache.values()) memberCache.delete(member);
  },
  allChannels() {
    for (const channel of guild.channels.cache.values()) channelCache.delete(channel);
  },
  allRoles() {
    for (const role of guild.roles.cache.values()) roleCache.delete(role);
  },
  members(userIds: string[]) {
    for (const userId of userIds) {
      const member = guild.members.cache.get(userId);
      if (member) memberCache.delete(member);
    }
  },
  channels(channelIds: string[]) {
    for (const channelId of channelIds) {
      const channel = guild.channels.cache.get(channelId);
      if (channel) channelCache.delete(channel);
    }
  },
});
