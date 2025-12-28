import childProcess from 'node:child_process';
import fs from 'node:fs';
import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

const packageFile = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
process.env.PUBLIC_APP_VERSION = packageFile.version;

process.env.PUBLIC_COMMIT_HASH ??= childProcess
  .execSync('git log --pretty=format:"%h" -n1')
  .toString()
  .trim();

// if (!process.env.ORIGIN) {
//   throw new Error('ORIGIN is required')
// }

export default defineConfig({
  plugins: [tailwindcss(), sveltekit()],
  test: {
    expect: { requireAssertions: true },
    projects: [
      {
        extends: './vite.config.ts',
        test: {
          name: 'client',
          environment: 'browser',
          browser: {
            enabled: true,
            provider: 'playwright',
            instances: [{ browser: 'chromium' }],
          },
          include: ['src/**/*.svelte.{test,spec}.{js,ts}'],
          exclude: ['src/lib/server/**'],
          setupFiles: ['./vitest-setup-client.ts'],
        },
      },
      {
        extends: './vite.config.ts',
        test: {
          name: 'server',
          environment: 'node',
          include: ['src/**/*.{test,spec}.{js,ts}'],
          exclude: ['src/**/*.svelte.{test,spec}.{js,ts}'],
        },
      },
    ],
  },
});
