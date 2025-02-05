import { command, permissions } from '#bot/commands.js';
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
