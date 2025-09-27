import { error, redirect } from '@sveltejs/kit';

const ROUTES = [
  {
    source: 'github',
    destination: 'https://github.com/rapha01/activityRank-bot',
    permanent: false,
  },
  {
    source: 'invite',
    destination:
      'https://discord.com/api/oauth2/authorize?client_id=534589798267224065&permissions=294172224721&scope=bot%20applications.commands%20applications.commands.permissions.update',
    permanent: false,
  },
  {
    source: 'premium',
    destination: 'https://www.patreon.com/join/rapha01',
    permanent: false,
  },
  {
    source: 'support',
    destination: 'https://discord.com/invite/DE3eQ8H',
    permanent: false,
  },
];

export async function load(opts) {
  const route = ROUTES.find((route) => route.source === opts.params.fallback.toLowerCase());
  if (route) {
    redirect(route.permanent ? 308 : 307, route.destination);
  }
  error(404, { message: 'Not Found' });
}
