import { ApplicationCommandOptionType } from 'discord.js';
import { subcommandGroup } from '#bot/util/registry/command.js';
import { settings } from './server/settings.js';
import { statistics } from './server/statistics.js';
import { all } from './server/all.js';
import { xp } from './server/xp.js';
import { members } from './server/members.js';

export const server = subcommandGroup({
  data: {
    name: 'server',
    description: 'Reset some attributes of the entire server.',
    type: ApplicationCommandOptionType.SubcommandGroup,
  },
  subcommands: [settings, statistics, xp, all, members],
});
