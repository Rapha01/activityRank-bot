import { createInternalRoute } from '#util/routes.ts';
import { Error400, Error401, Error403 } from '#util/zod.ts';

export const runPatreonRoute = createInternalRoute({
  method: 'post',
  path: '/admin/run/patreon',
  summary: '/admin/run/patreon',
  description: 'Manually triggers a run of the Patreon Cronjob.',
  responses: {
    202: {
      description: 'Indicates the Cronjob has been triggered',
    },
    400: Error400,
    401: Error401,
    403: Error403,
  },
});
