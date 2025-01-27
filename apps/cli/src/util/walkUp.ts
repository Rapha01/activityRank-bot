import { dirname, resolve } from 'node:path';

// https://github.com/isaacs/walk-up-path/blob/main/src/index.ts
export const walkUp = function* (initialPath: string) {
  let path = initialPath;
  while (true) {
    path = resolve(path);
    yield path;
    const pp = dirname(path);
    if (pp === path) {
      break;
    }
    path = pp;
  }
};
