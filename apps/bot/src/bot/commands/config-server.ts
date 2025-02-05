import { command, permissions } from '#bot/commands.js';
import { bonus } from './config-server/bonus.js';
import { vote } from './config-server/vote.js';
import { entriesPerPage } from './config-server/entries-per-page.js';
import { cooldown } from './config-server/cooldown.js';
import { set } from './config-server/set.js';

export default command.parent({
  data: {
    name: 'config-server',
    description: "Change your server's settings.",
    default_member_permissions: permissions(permissions.ManageGuild),
  },
  subcommands: [bonus, vote, entriesPerPage, cooldown, set],
});
