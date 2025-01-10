import type { ShardDB } from '#models/types/kysely/shard.js';
import type { Kysely, Updateable, Selectable } from 'kysely';
import { shards } from '#models/shardDb/shardDb.js';

export abstract class CachedModel<
  Object,
  DBObject extends ShardDB[keyof ShardDB],
  CachedFieldKeys extends readonly (keyof Selectable<DBObject>)[],
  ArbitraryCachedStorage,
  CachedDBFields extends Pick<Selectable<DBObject>, CachedFieldKeys[number]> = Pick<
    Selectable<DBObject>,
    CachedFieldKeys[number]
  >,
> {
  protected handle: Kysely<ShardDB>;
  protected _db: CachedDBFields;
  public cache: ArbitraryCachedStorage;

  constructor(
    protected _object: Object,
    public readonly dbHost: string,
    cachedFields: CachedDBFields,
    defaultStorage: ArbitraryCachedStorage,
  ) {
    this.handle = shards.get(dbHost).db;
    this.cache = defaultStorage;
    this._db = { ...cachedFields };
  }

  get object(): Object {
    return this._object;
  }

  get db() {
    return this._db;
  }

  abstract fetch(): Promise<Selectable<DBObject>>;
  abstract upsert(expr: Updateable<DBObject>): void;
}
