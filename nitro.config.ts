//https://nitro.unjs.io/config
export default defineNitroConfig({
  srcDir: 'src',
  experimental: {
    tasks: true,
  },
  scheduledTasks: {
    '5 * * * *': ['reset:day'],
    '20 23 * * *': ['reset:week'],
    '30 23 1-7 * *': ['reset:month'],
    '45 23 1 1 *': ['reset:year'],
    '*/23 * * * *': ['external:topgg'],
    '*/6 * * * *': ['external:patreon'],
  },
});
