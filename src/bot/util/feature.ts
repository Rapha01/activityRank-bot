export enum Feature {
  XPFlush,
}

const BETA_SERVERS = [534598374985302027n, 905898879785005106n];

const featureMap: {
  [K in Feature]: { percent: bigint; offset?: bigint; overrides?: Set<bigint> };
} = {
  [Feature.XPFlush]: {
    percent: 10n,
    overrides: new Set([...BETA_SERVERS]),
  },
};

export function hasFeature(
  obj: number | bigint | string | { id: number | bigint | string },
  feature: Feature,
): boolean {
  const id = typeof obj === 'object' ? BigInt(obj.id) : BigInt(obj);

  if (featureMap[feature].overrides?.has(id)) return true;

  // hash the timestamp of the snowflake, not the increment
  // the increment is less likely to be consistent - roughly
  // 80% of all Discord snowflakes % 100 are <= 10.
  const hash = (id >> 22n) % 100n;
  const offset = featureMap[feature].offset ?? 0n;

  if (offset + featureMap[feature].percent > 100n)
    throw new Error('Invalid feature configuration.');
  // offset < hash < offset + percent
  return hash > offset && hash < offset + featureMap[feature].percent;
}
