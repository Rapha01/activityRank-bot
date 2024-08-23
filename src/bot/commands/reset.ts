import { command, permissions } from 'bot/util/registry/command.js';
import { member } from './reset/member.js';
import { channel } from './reset/channel.js';
import { server } from './reset/server.js';
import { deleted } from './reset/deleted.js';

export default command.parent({
  data: {
    name: 'reset',
    description: 'Reset your server or members in your server.',
    default_member_permissions: permissions(permissions.Administrator),
  },
  subcommands: [member, channel],
  groups: [server, deleted],
});

/*
 * [x] /reset channel                    channel:#channel
 * [x] /reset member                     member:@member
 * [x] /reset server settings            * resets all server configurations.
 * [x] /reset server statistics          -> (multi)select menu of stat types
 * [ ] TODO: /reset server xp            * reset all members' XP (currently /reset server statistics)
 * [x] /reset server all                 * reset xp, server config, and stat types
 * [x] /reset deleted members
 * [~] /reset deleted member             id:
 * [x] /reset deleted channels
 * [x] /reset deleted channel            id:
 */
