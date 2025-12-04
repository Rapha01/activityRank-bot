import type { ShardDB } from '@activityrank/database';
import type { Kysely, Selectable, Updateable } from 'kysely';
import { shards } from '#models/shardDb/shardDb.ts';

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
  protected _object: Object;
  public readonly dbHost: string;

  constructor(
    _object: Object,
    dbHost: string,
    cachedFields: CachedDBFields,
    defaultStorage: ArbitraryCachedStorage,
  ) {
    this._object = _object;
    this.dbHost = dbHost;
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
