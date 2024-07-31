import { command, permissions } from 'bot/util/registry/command.js';
import { server } from './reset/server.js';
import { member } from './reset/member.js';
import { channel } from './reset/channel.js';

export default command.parent({
  data: {
    name: 'reset',
    description: 'Reset your server or members in your server.',
    default_member_permissions: permissions(permissions.Administrator),
  },
  subcommands: [server, member, channel],
});
