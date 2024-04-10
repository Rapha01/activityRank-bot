import type { ShardDB } from 'models/types/kysely/shard.js';
import type { Kysely, Updateable, Selectable } from 'kysely';
import { getShardDb } from 'models/shardDb/shardDb.js';

export abstract class CachedModel<
  Object extends any,
  DBObject extends ShardDB[keyof ShardDB],
  CachedFieldKeys extends readonly (keyof Selectable<DBObject>)[],
  ArbitraryCachedStorage extends any,
  CachedDBFields extends Pick<Selectable<DBObject>, CachedFieldKeys[number]> = Pick<
    Selectable<DBObject>,
    CachedFieldKeys[number]
  >,
> {
  protected handle: Kysely<ShardDB>;
  protected _db: CachedDBFields;
  public cache: ArbitraryCachedStorage;

  constructor(
    protected object: Object,
    public readonly dbHost: string,
    cachedFields: CachedDBFields,
    defaultStorage: ArbitraryCachedStorage,
  ) {
    this.handle = getShardDb(dbHost);
    this.cache = defaultStorage;
    this._db = { ...cachedFields };
  }

  get db() {
    return this._db;
  }

  abstract fetch(): Promise<Selectable<DBObject>>;
  abstract upsert(expr: Updateable<DBObject>): void;
}
