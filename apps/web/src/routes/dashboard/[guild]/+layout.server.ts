import { error } from '@sveltejs/kit';
import { getSharedGuilds } from '$lib/api/shared-guilds';
import { hasAccess } from '../hasAccess';

export async function load(event) {
  const guildId = event.params.guild;
  if (!/^\d{17,20}$/.test(guildId)) error(404);

  const { user } = event.locals.auth();

  const access = await hasAccess(user.id);
  if (!access) error(403);

  const { sharedGuilds } = await getSharedGuilds(event);
  const guild = sharedGuilds.find((guild) => guild.id === guildId);

  if (!guild) error(404);

  return { user, guild, sharedGuilds };
}
