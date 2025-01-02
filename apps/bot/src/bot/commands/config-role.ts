import { command, permissions } from '#bot/util/registry/command.js';
import { levels } from './config-role/levels.js';
import { menu } from './config-role/menu.js';

export default command.parent({
  data: {
    name: 'config-role',
    description: "Change a role's settings.",
    default_member_permissions: permissions(permissions.ManageGuild),
  },
  subcommands: [levels, menu],
});
