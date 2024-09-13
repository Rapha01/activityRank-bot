import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [tsconfigPaths()],
});

process.env.LOAD_LOCAL_CONFIG = '1'; // ensure that config isn't loaded from Docker paths
process.env.SUPPRESS_LOGGING = 'true'; // suppress logs during tests. May be useful to disable during local development.
