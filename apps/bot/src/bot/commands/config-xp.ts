import { command, permissions } from 'bot/util/registry/command.js';
import { bonustime } from './config-xp/bonustime.js';
import { levelfactor } from './config-xp/levelfactor.js';
import { xpPer } from './config-xp/xp-per.js';
import { bonusXpPer } from './config-xp/bonus-xp-per.js';
import { xpPerRole } from './config-xp/xp-per-role.js';

export default command.parent({
  data: {
    name: 'config-xp',
    description: "Change your server's XP settings.",
    default_member_permissions: permissions(permissions.ManageGuild),
  },
  subcommands: [bonustime, levelfactor, xpPer, bonusXpPer, xpPerRole],
});
