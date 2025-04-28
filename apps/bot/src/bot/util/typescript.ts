/**
 * Ensures an exhaustive if-ladder. This is useful if it relies on an enum or sum type that may have future attributes added to it.
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
 * Allows a single key K of T to become Optional
 */
export type PartiallyRequired<T, K extends keyof T> = { [k in K]-?: T[k] } & {
  [k in keyof T]: T[k];
};
