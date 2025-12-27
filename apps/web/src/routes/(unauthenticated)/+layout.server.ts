import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async (evt) => {
  return { user: evt.locals.user };
};
