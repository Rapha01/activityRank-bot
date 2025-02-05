import { ApplicationCommandOptionType } from 'discord.js';
import { subcommandGroup } from '#bot/commands.js';
import { settings } from './server/settings.js';
import { statistics } from './server/statistics.js';
import { all } from './server/all.js';
import { xp } from './server/xp.js';

export const server = subcommandGroup({
  data: {
    name: 'server',
    description: 'Reset some attributes of the entire server.',
    type: ApplicationCommandOptionType.SubcommandGroup,
  },
  subcommands: [settings, statistics, xp, all],
});
