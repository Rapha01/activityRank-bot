import { ApplicationCommandOptionType } from 'discord.js';
import { subcommandGroup } from '#bot/util/registry/command.js';
import { channel } from './deleted/channel.js';
import { channels } from './deleted/channels.js';
import { members } from './deleted/members.js';

export const deleted = subcommandGroup({
  data: {
    name: 'deleted',
    description: 'Reset statistics for deleted channels or members.',
    type: ApplicationCommandOptionType.SubcommandGroup,
  },
  subcommands: [channel, channels, members],
});
