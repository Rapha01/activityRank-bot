import { $ } from 'execa';

export async function formatFile(path: string, { unsafe = true } = {}) {
  await $`pnpm exec biome check --write ${unsafe ? '--unsafe' : ''} ${path}`;
}
