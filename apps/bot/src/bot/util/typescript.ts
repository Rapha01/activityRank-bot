/**
 * Ensures an exhaustive if-ladder. This is useful if it relies on an enum or sum type that may have future attributes added to it.
 * If TypeScript cannot verify the invariant, use {@link assertUnreachableUnsafe}.
 * @example
 * type Item = 1 | 2;
 * function doSomething(item: Item): boolean {
 *  if (item === 1) return true;
 *  else if (item === 2) return true;
 *  // should not raise a typeError because TypeScript knows the program can never reach here.
 *  // However, if Item becaume `1 | 2 | 3`, it would begin to raise a compilation error.
 *  assertUnreachable(item)
 * }
 */
export function assertUnreachable(_: never): never {
  throw new TypeError(
    'Reached an assertUnreachable() statement. This should never happen at runtime because TypeScript should check it.',
  );
}

/**
 * Throws an error if reached. Unlike {@link assertUnreachable}, `assertUnreachableUnsafe` does not have any compile-time implications.
 * {@link assertUnreachable} is better if TypeScript can verify the invariant.
 * @example
 * type Item = 1 | 2;
 * function doSomething(item: Item): boolean {
 *  if (item === 1) return true;
 *  assertUnreachableUnsafe('`item` can never be set to `2`.');
 * }
 */
export function assertUnreachableUnsafe(details = ''): never {
  throw new TypeError(
    `Reached an assertUnreachableUnsafe() statement. \
    This should never happen at runtime because, even though permitted by TypeScript, \
    program invariants prohibit it from being reached.n\n\n${details}`,
  );
}

/**
 * Reverts readonly modifiers set on an object or array.
 *
 * @example
 * const x = ['a'] as const;
 * type A = typeof x;             // readonly ["a"]
 * type B = Writeable<typeof x>;  // ["a"]
 */
export type Writeable<T> = { -readonly [P in keyof T]: T[P] };

/**
 * Given a type T, makes key K no longer optional.
 */
export type PartiallyRequired<T, K extends keyof T> = { [k in K]-?: T[k] } & {
  [k in keyof T]: T[k];
};

// TODO: consider allowing `Iterable`s instead of only `Set`s as inputs

export function intersection<T>(a: Set<T>, b: Set<T>): Set<T> {
  return new Set([...a].filter((e) => b.has(e)));
}

export function difference<T>(a: Set<T>, b: Set<T>): Set<T> {
  return new Set([...a].filter((e) => !b.has(e)));
}

export function union<T>(a: Set<T>, b: Set<T>): Set<T> {
  return new Set([...a, ...b]);
}

// see https://tc39.es/ecma262/#sec-set.prototype.symmetricdifference
export function symmetricDifference<T>(a: Set<T>, b: Set<T>): Set<T> {
  const res = new Set(a);
  for (const next of b) {
    const alreadyIn = res.has(next);
    if (a.has(next) && alreadyIn) res.delete(next);
    else if (!alreadyIn) res.add(next);
  }
  return res;
}
