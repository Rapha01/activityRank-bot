import { command, permissions } from 'bot/util/registry/command.js';
import { role } from './bonus/role.js';
import { member } from './bonus/member.js';

export default command.parent({
  data: {
    name: 'bonus',
    description: 'Give or take bonus XP to a user or role.',
    default_member_permissions: permissions(permissions.ManageGuild),
  },
  subcommands: [role, member],
});
