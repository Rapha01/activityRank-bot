export interface CommandsCategory {
  title: string;
  desc: string;
  subdesc: string;
  subcommands: {
    title: string;
    command: string;
    desc: string;
    example: string;
  }[];
}

export default {
  stats: {
    title: 'Statistics',
    desc: 'View server statistics.',
    subdesc:
      'Get an ordered and filtered list of users and channels for your current server.',
    subcommands: [
      {
        title: 'Member stats',
        command: '/rank [member] [period]',
        desc: "A member's stats.",
        example: '/rank member:01110000#6585 period:Alltime',
      },
      {
        title: 'Top members',
        command: '/top members server [period] [page] [type]',
        desc: 'Shows the most active users.',
        example: '/top members server period:Alltime page:2 type:Text',
      },
      {
        title: 'Top channels',
        command: '/top channels server <type> [period] [page]',
        desc: 'Shows the top channels in the server',
        example: '/top channels server type:Text period:Week page:3',
      },
      {
        title: 'Top channels by a member',
        command: '/top channels member <member> <type> [period] [page]',
        desc: 'Shows the top channels used by a member',
        example:
          '/top channels member member:01110000#6585 type:Text period:Week page:3',
      },
      {
        title: 'Top members in a channel',
        command: '/top members channel <channel> [period] [page]',
        desc: 'Shows the top members in a specific channel',
        example: '/top members channel channel:#general period:Month page:2',
      },
    ],
  },

  voting: {
    title: 'Voting and inviting',
    desc: 'Upvote or refer members.',
    subdesc:
      'Upvote or invite another user for a bunch of XP. You can do this once every now and then (cooldown depends on the server settings).',
    subcommands: [
      {
        title: 'Inviter',
        command: '/inviter <member>',
        desc: 'Set someone else as your inviter. Both of you will receive one invite. You can set your inviter only once.',
        example: '/inviter member:01110000#6585',
      },
      {
        title: 'Upvote',
        command: '/upvote <member> (or use the Apps menu by right-clicking)',
        desc: 'Upvote someone (and grant some XP to them)',
        example: '/upvote member:01110000#6585',
      },
    ],
  },

  info: {
    title: 'Info',
    desc: 'Information about the bots configuration on this server.',
    subdesc: "View the bot's settings for XP, leveling, roles and channels.",
    subcommands: [
      {
        title: 'Server info',
        command: '/serverinfo',
        desc: "Opens a menu to display the server's configuration.",
        example: '/serverinfo',
      },
      {
        title: 'Member info',
        command: '/memberinfo [member]',
        desc: "Your or another member's info profile.",
        example: '/memberinfo member:01110000#6585',
      },
    ],
  },

  mysettings: {
    title: 'My settings',
    desc: 'Set your personal settings.',
    subdesc: 'Adjust settings like notifications for your member account.',
    subcommands: [
      {
        title: 'Personal settings',
        command: '/config-member',
        desc: 'Allows you to configure being sent levelup messages and whether or not to use reactionVotes.',
        example: '/config-member',
      },
    ],
  },

  other: {
    title: 'View FAQ and patchnotes',
    desc: 'Get an overview of latest patches, check the detailed changes of a specific patch or view the FAQ.',
    subdesc: 'Find patchnotes and FAQs.',
    subcommands: [
      {
        title: 'FAQ',
        command: '/faq [number]',
        desc: 'Get a frequently asked question. Omit the number parameter to get a list of all the FAQs.',
        example: '/faq number:10',
      },
      {
        title: 'Patchnotes',
        command: '/patchnote [version]',
        desc: 'Get a patchnote. Select "latest" to get the most recent patchnote, or omit the "version" parameter to get a list of patchnotes.',
        example: '/patchnote version:4.3',
      },
    ],
  },

  serverSettings: {
    title: 'Server settings',
    desc: 'Set server settings (admin only).',
    subdesc:
      'Adjust settings like autopost messages, emotes, and notifications.',
    subcommands: [
      {
        title: 'Autopost messages',
        command: '/config-messages',
        desc: 'Changes the message for levelups, role assignments, and server joins.',
        example: '/config-messages',
      },
      {
        title: 'Channel settings',
        command: '/config-channel <channel | id>',
        desc: 'Set this channel as the server join channel, levelup channel, or set it as a noXP channel.',
        example: '/config-channel channel:#general',
      },
      {
        title: 'Bonus tag & emote',
        command: '/config-server bonus [tag] [emote]',
        desc: 'Customixe the displayed emotes and words',
        example: '/config-server bonus tag:stars emote:✨',
      },
      {
        title: 'Vote tag & emote',
        command: '/config-server vote [tag] [emote]',
        desc: 'Customixe the displayed emotes and words',
        example: '/config-server vote tag:thanks emote:💜',
      },
      {
        title: 'Entries per page',
        command: '/config-server entries-per-page <value>',
        desc: 'Change the number of items shown in a list command',
        example: '/config-server entries-per-page value:10',
      },
      {
        title: 'Statistic modules',
        command: '/config-server set',
        desc: 'Select one of the emojis at the bottom to toggle that category on and off.',
        example: '/config server set; ✍️',
      },
      {
        title: 'Show nicknames',
        command: '/config-server set',
        desc: 'Select "Use Nicknames" to toggle. Enabling this option will use a member\'s nickname instead of their username.',
        example: '/config-server set',
      },
      {
        title: 'Levelup message location',
        command: '/config-server set',
        desc: 'Choose between Direct Messages, last active channel messages, and a set channel.',
        example: '/config-server set',
      },
      {
        title: 'Levelup with roleassigment message',
        command: '/config-server set',
        desc: 'Toggle replacing the levelup message with the roleassignment message',
        example: '/config-server set',
      },
    ],
  },

  xpSettings: {
    title: 'XP settings',
    desc: 'Set XP and level settings (admin only).',
    subdesc:
      'Adjust settings like XP per minute, roles on levelup or activate levelup messages for this server.',
    subcommands: [
      {
        title: 'Levelfactor',
        command: '/config-xp levelfactor <levelfactor>',
        desc: 'Choose how much more XP is needed for each subsequent level (Default is 100 XP). Needs to be within 20 and 400. Check /serverinfo to verify your settings.',
        example: '/config-xp levelfactor levelfactor:120',
      },
      {
        title: 'XP per activity',
        command: '/config-xp xp-per [message] [voiceminute] [vote] [invite]',
        desc: 'Choose how much XP is given for each activity (Points per minute in voicechannel, textmessage, upvote, or invite). Maximum of 100 for upvotes, 10 for textmessages and 5 for voiceminutes. Activating bonus xp can multiply XP for a set amount of time.',
        example: '/config-xp xp-per message:7 vote:30',
      },
      {
        title: 'Text and vote cooldowns',
        command: '/config-server cooldown [message] [vote]',
        desc: 'Specify the seconds a user has to wait to make another vote or gain XP for a text message.',
        example: '/config-server cooldown message:10 vote:21600',
      },
      {
        title: 'Reaction voting and muted/deafened/solo XP',
        command: '/config-server set',
        desc: "Reaction voting causes reactions with your voteEmote to automatically trigger an upvote. Muted/Deafened/solo XP toggles users' ability to gain XP when muted, deafened, or alone in a VC.",
        example: '/config-server set',
      },
      {
        title: 'Bonus XP per activity',
        command:
          '/config-xp bonus-xp-per [message] [voiceminute] [vote] [invite]',
        desc: 'Choose how much XP is given for each activity.',
        example: '/config-xp xp-per message:10 invite:50',
      },
      {
        title: 'Bonus time',
        command: '/config-xp bonustime <time>',
        desc: 'The time in minutes for bonustime to last for.',
        example: '/config-xp bonustime time:120',
      },
      {
        title: 'NoXP Role',
        command: '/config-role menu <role | id>',
        desc: 'Exclude roles from getting XP through speaking, writing or voting.',
        example: '/config-role menu role:@noXP Role',
      },
    ],
  },

  bonusxp: {
    title: 'Bonus XP',
    desc: 'Give and take bonus XP to and from your members (admin only).',
    subdesc:
      'The text, voice and vote scores are not adjustable by the admins. For this you can use the bonus score - grant your members XP for special events or boost up your most loyal members when switching to this bot.',
    subcommands: [
      {
        title: 'Give/take from a member',
        command: '/bonus member <member> <give|take>',
        desc: 'Give or take bonus XP from a user',
        example: '/bonus member member:@01110000#6585 give:100',
      },
      {
        title: 'Give/take from a role',
        command: '/bonus role <role> <give|take>',
        desc: 'Give or take bonus XP from a role',
        example: '/bonus role role:@nice people give:300',
      },
    ],
  },

  roleAssignments: {
    title: 'Role Assignments',
    desc: 'Set role settings (admin only).',
    subdesc:
      'Set up your role ladder and rewards. Roles are updated on levelup / leveldown.',
    subcommands: [
      {
        title: 'Assign/deassign role on levelup',
        command: '/config-role levels <role> [assignLevel] [deassignLevel]',
        desc: 'Automatically give or take a role to users upon reaching a certain level. Set the level to 0 to remove the assignment. Assignments to level 1 (start level) will be given on server join.',
        example:
          '/config-role levels role:@level 5 assignLevel:5 deassignLevel:10',
      },
      {
        title: 'Customize single role assign/deassignMessage',
        command: '/config-role menu <role>',
        desc: 'Change the text of the role assignment/deassignment notification in the levelup message. Use <mention> as a placeholder for the users ping, <name> for only the name, <level> for the level digit, <servername> for the name of your server and <rolename> for the name of the role.',
        example: '/config-role menu role:@level 6',
      },
      {
        title: 'Take away assigned roles',
        command: '/config-server set',
        desc: 'If the "TAAROLD" function is enabled, the bot will automatically take away assigned roles, if the user falls below the assignment level.',
        example: '/config-server set',
      },
    ],
  },

  reset: {
    title: 'Reset',
    desc: 'Reset server statistics & settings (admin only).',
    subdesc:
      'Reset server, channel, or user statistics. While a reset procedure is active, no commands will trigger the bot and no activity will be tracked.',
    subcommands: [
      {
        title: 'Reset server, settings, stats, or deleted channels/members',
        command: '/reset server <type>',
        desc: 'Resets the selected type of items',
        example: '/reset server type:Invite XP',
      },
      {
        title: "Reset a channel's stats",
        command: '/reset channel <channel|id>',
        desc: 'Reset all statistics associated with a channel',
        example: '/reset channel channel:#general',
      },
      {
        title: "Reset a member's stats",
        command: '/reset member <member|id>',
        desc: "Reset a member's statistics",
        example: '/reset member member:@01110000#6585',
      },
    ],
  },
} satisfies Record<string, CommandsCategory>;
