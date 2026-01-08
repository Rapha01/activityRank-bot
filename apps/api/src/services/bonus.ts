import { type Expression, sql } from 'kysely';
import { getGuildHost } from '#models/guildRouteModel.ts';
import { shards } from '#models/shard.ts';

// 100,000,000 (this amount of XP is > level 1500 so should be inconsequential)
const MIN_STAT_COLUMN_VALUE = -100_000_000;
const MAX_STAT_COLUMN_VALUE = 100_000_000;

// BASED ON apps/bot/src/models/shardDb/statFlush.ts
export async function addBonusXP(guildId: string, userId: string, delta: number) {
  const host = await getGuildHost(guildId);
  const { db } = shards.get(host);
  const now = Math.floor(Date.now() / 1000).toString();

  function values<T>(expr: Expression<T>) {
    return sql<T>`VALUES(${expr})`;
  }

  function clamp(expr: Expression<number>) {
    return sql<number>`LEAST(${sql.lit(MAX_STAT_COLUMN_VALUE)}, GREATEST(${sql.lit(MIN_STAT_COLUMN_VALUE)}, ${expr}))`;
  }

  await db.transaction().execute(async (trx) => {
    // NOTE: if another type of XP is being implemented xpPer must be fetched
    // const xpPer = await trx
    //   .selectFrom('guild')
    //   .select(['xpPerBonus'])
    //   .where('guildId', '=', guildId)
    //   .executeTakeFirst();

    await trx
      .insertInto('bonus')
      .values((eb) => ({
        guildId,
        userId,
        day: clamp(eb.val(delta)),
        week: clamp(eb.val(delta)),
        month: clamp(eb.val(delta)),
        year: clamp(eb.val(delta)),
        alltime: clamp(eb.val(delta)),
        addDate: now,
        changeDate: now,
      }))
      .onDuplicateKeyUpdate((eb) => ({
        day: clamp(eb(eb.ref('day'), '+', values(eb.ref('day')))),
        week: clamp(eb(eb.ref('week'), '+', values(eb.ref('week')))),
        month: clamp(eb(eb.ref('month'), '+', values(eb.ref('month')))),
        year: clamp(eb(eb.ref('year'), '+', values(eb.ref('year')))),
        alltime: clamp(eb(eb.ref('alltime'), '+', values(eb.ref('alltime')))),
        changeDate: now,
      }))
      .execute();

    await trx
      .insertInto('guildMember')
      .values((eb) => ({
        guildId,
        userId,
        day: clamp(eb.val(delta)),
        week: clamp(eb.val(delta)),
        month: clamp(eb.val(delta)),
        year: clamp(eb.val(delta)),
        alltime: clamp(eb.val(delta)),
      }))
      .onDuplicateKeyUpdate((eb) => ({
        day: clamp(eb(eb.ref('day'), '+', values(eb.ref('day')))),
        week: clamp(eb(eb.ref('week'), '+', values(eb.ref('week')))),
        month: clamp(eb(eb.ref('month'), '+', values(eb.ref('month')))),
        year: clamp(eb(eb.ref('year'), '+', values(eb.ref('year')))),
        alltime: clamp(eb(eb.ref('alltime'), '+', values(eb.ref('alltime')))),
      }))
      .execute();
  });
}
