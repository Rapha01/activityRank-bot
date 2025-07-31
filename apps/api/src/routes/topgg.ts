import { createInternalRoute } from '#util/routes.js';
import { Error400, Error401, Error403 } from '#util/zod.js';

export const runTopggRoute = createInternalRoute({
  method: 'post',
  path: '/admin/run/topgg',
  summary: '/admin/run/topgg',
  description: 'Manually triggers a run of the Top.gg Cronjob.',
  responses: {
    202: {
      description: 'Indicates the Cronjob has been triggered',
    },
    400: Error400,
    401: Error401,
    403: Error403,
  },
});
