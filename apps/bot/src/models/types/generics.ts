// returns subset of O with only properties that are type T
// based off of SO answer https://stackoverflow.com/questions/57384765/typescript-conditional-exclude-type-exclude-from-interface
export type PropertiesOfType<O, T> = Pick<
  O,
  { [K in keyof O]-?: O[K] extends T ? K : never }[keyof O]
>;
