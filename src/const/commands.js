exports.stats = {
  title: 'Statistics',
  desc: 'View server statistics.',
  subdesc: 'Get an ordered and filtered list of users and channels for your current server. Note that any command can be used in its shortcut form, using only the first letter. F.e. \'ar!s stats\'.',
  subcommands: [
    {title: 'Members toplist',command: '<prefix>server top members (OR <prefix>top)',desc:'Shows the alltime most active users (top is the short form alias for this command).',example: '<prefix>s top members'},
    {title: 'Members toplist [options]',command: '<prefix>server top members [ page ] [ alltime | year | month | week | day ] [ voice | text | <votetag> ]',desc:'Shows the n-th toplist page of most active users for the specified type and time.',example: '<prefix>s top members 2 week text'},
    {title: 'Member stats',command: '<prefix>member stats',desc:'Your own stats.',example: '<prefix>m stats'},
    {title: 'Member stats [options]',command: '<prefix>member [ @user | userName#tag | userId ] stats',desc:'Anothers stats',example: '<prefix>m 37065081423482880 stats'},
    {title: 'Member top channels [options]',command: '<prefix>member [ @user | userName#tag | userId ] top channels text|voice',desc:'The channels the user was most active in',example: '<prefix>m 37065081423482880 top channels voice'},
    {title: 'Channels toplist',command: '<prefix>server top channels { text | voice }',desc:'Shows the alltime most active voice or text channels.',example: '<prefix>s top channels voice'},
    {title: 'Channels toplist [options]',command: '<prefix>server top channels { text | voice } [ page ] [ alltime | year | month | week | day ]',desc:'Shows the n-th toplist page of most active voice or text channels for the specified time.',example: '<prefix>s top channels voice 2'},
    {title: 'Channel member toplist',command: '<prefix>channel top members',desc:'Shows the alltime most active users of the current channel.',example: '<prefix>channel top members'},
    {title: 'Channel member toplist [options]',command: '<prefix>channel [ #channel | channelName | channelId ] top members [ page ] [ alltime | year | month | week | day ]',desc:'Shows the n-th toplist page of most active members of the specified channel for the specified time.',example: '<prefix>c #support top members 2 month'}
  ]
};

exports.voting = {
  title: 'Voting and inviting',
  desc: 'Upvote or refer members.',
  subdesc: 'Upvote or invite another user for a bunch of XP. You can do this once every now and then (cooldown depends on the server settings).',
  subcommands: [
    {title: 'Inviter',command: '<prefix>member { @user | userName#tag | userId } set inviter',desc:'Set someone else as your inviter. He will receive invite XP and you will receive as much XP as bonus. You can set your inviter only once.' + '<prefix>m username#0001 set inviter'},
    {title: 'Upvote',command: '<prefix>member { @user | userName#tag | userId } up',desc:'Upvote someone (and grant some XP to the user)',example: '<prefix>member @user up. ' + '<prefix>m username#0001 up'},
  ]
};

exports.info = {
  title: 'Info',
  desc: 'Information about the bots configuration on this server.',
  subdesc: 'View the bots settings for XP, leveling, roles and channels.',
  subcommands: [
    {title: 'Server info',command: '<prefix>server info',desc:'See general information and how much points you get for each activity.',example: '<prefix>s info'},
    {title: 'Member info',command: '<prefix>member [ @user | userName#tag | userId ] info',desc:'Anothers stats',example: '<prefix>m @Linck01 info'},
    {title: 'Levels',command: '<prefix>info levels [ page ]',desc:'A list of levels and the XP you need for each.',example: '<prefix>s info levels'},
    {title: 'Roles',command: '<prefix>info roles [ page ]',desc:'A list of roles and the levels you need for each.',example: '<prefix>s info roles'},
    {title: 'No XP Channels',command: '<prefix>info noXpChannels [ page ]',desc:'A list of channels that don\'t give xp.',example: '<prefix>s info noXpChannels'},
    {title: 'No XP Roles',command: '<prefix>info noXpRoles [ page ]',desc:'A list of roles that don\'t give xp.',example: '<prefix>s info noXpRoles'},
    {title: 'Messages',command: '<prefix>info messages [ page ]',desc:'A list of your set messages.',example: '<prefix>s info messages'}
  ]
};

exports.token = {
  title: 'Get and redeem tokens',
  desc: 'Earn or buy tokens and redeem them for special boosts or to power your bot.',
  subdesc: 'After supporting the bot by buying or earning tokens, you can spend them on powering the bot or personal boosts like more voting power.',
  subcommands: [
    {title: 'Upvote the bot',command: '<prefix>token get externUpvote',desc:'Upvote or like the bot on extern platforms like discord bot index websites. Enter the command for links to the websites.',example: '<prefix>token get externUpvote'},
    {title: 'Buy tokens',command: '<prefix>token get buy',desc:'Buy Tokens to show your true support for the bot. Check our website or use the command for further info. ',example: '<prefix>token get buy'},
    {title: 'Activate Premium server',command: '<prefix>token redeem premiumServer <digit>',desc:'Be a true supporter of this server and the bot - get premium for it. Premium servers will not have more features, but a slightly better experience - f.e. by deactivating messages asking for premium. Depending on the amount of users of your server, a certain amount of tokens has to be fueled in the bot for it be powered. Every day the bot is being used, Tokens burn (equal to the 1.5th root of the amount of users, f.e. 1000 Users burn 74 Tokens a day).',example: '<prefix>token redeem premiumServer 2000'},
    {title: 'Gain votepower',command: '<prefix>token redeem votePower',desc:'Trade some Tokens for more personal upvotepower. Your upvotes will have 2x more impact, but it will cost 10 Tokens to activate for three days.',example: '<prefix>token redeem votePower'}
  ]
};

exports.mysettings = {
  title: 'My settings',
  desc: 'Set your personal settings.',
  subdesc: 'Adjust settings like notifications for your member account.',
  subcommands: [
    {title: 'Levelup messages',command: '<prefix>member set notifyLevelupDm ',desc:'Globaly turn on or off your own levelup messages from this bot for the current server.',example: '<prefix>m set notifyLevelupDm'},
    {title: 'Reaction voting',command: '<prefix>member set reactionVote ',desc:'Even if the admin has activated reactionVote for the server, you can still disable it only for you, if you want to keep tight control over who you are giving your votes to.',example: '<prefix>m set reactionVote'}
  ]
};

exports.other = {
  title: 'View FAQ and patchnotes',
  desc: 'Get an overview of latest patches, check the detailed changes of a specific patch or view the FAQ.',
  subdesc: 'Reset server, channel, or user statistics.',
  subcommands: [
    {title: 'FAQ',command: '<prefix>faq <digit>',desc:'Get a list of the frequently asked questions. Use the digit to page through.',example: '<prefix>patchnotes '},
    {title: 'Patchnotes',command: '<prefix>patchnotes <digit>',desc:'Get an overview of latest patches. Use the digit to page through.',example: '<prefix>patchnotes '},
    {title: 'Patchnote details',command: '<prefix>patchnote <version>',desc:'View the detailed changes of a specific patch.',example: '<prefix>patchnote 3.0'},
  ]
};

exports.serverSettings = {
  title: 'Server settings',
  desc: 'Set server settings (admin only).',
  subdesc: 'Adjust settings like prefix, emotes, and notifications.',
  subcommands: [
    {title: 'Prefix',command: '<prefix>server set prefix { text }',desc:'Changes the bots prefix for the server.',example: '<prefix>server set prefix /'},
    {title: 'Stats modules',command: '<prefix>server set textXp | voiceXp | inviteXp | voteXp ',desc:'En- or disable a specific type of stat to be shown or recorded in your server. After disabling a stat type, it is recommended to reset the already recorded stats for this type for all members, otherwise the total XP will still include this data.',example: '<prefix>server set inviteXp'},
    {title: 'Vote tag',command: '<prefix>server set voteTag { text }',desc:'Customize the displayed word for the votescore.',example: '<prefix>server set voteTag gold'},
    {title: 'Vote emote',command: '<prefix>server set voteEmote { emote }',desc:'Customize the displayed emote for the votescore.',example: '<prefix>server set voteEmote :moneybag:'},
    {title: 'Bonus tag',command: '<prefix>server set bonusTag { text }',desc:'Customize the displayed word for the bonusscore.',example: '<prefix>server set bonusTag stars'},
    {title: 'Bonus emote',command: '<prefix>server set bonusEmote { emote }',desc:'Customize the displayed emote for the bonuscore.',example: '<prefix>server set bonusEmote :star:'},
    {title: 'Entries per page',command: '<prefix>server set entriesPerPage { digit }',desc:'Changes the length of the list of users in the top commands.',example: '<prefix>server set entriesPerPage 10'},
    {title: 'Show nicknames',command: '<prefix>server set showNicknames ',desc:'Enabling this option will display the users nicknames (instead of the username) in the stats.',example: '<prefix>server set showNicknames '},
    {title: 'No-command channels',command: '<prefix>channel [ #channel | channelName | channelId ] set noCommand ',desc:'Define channels where the bot does not respond to commands (but still record xp).',example: '<prefix>channel discussion set noCommand. <prefix>channel 123456 set noCommand '},
    {title: 'Command-only channel',command: '<prefix>channel [ #channel | channelName | channelId ] set commandOnly ',desc:'Define one channel where commands are allowed, while all other channels get ignored (except for users with MANAGE_SERVER permission).',example: '<prefix>channel botspam set commandOnly'},
    {title: 'Dm notifications',command: '<prefix>server set notifyLevelupDm ',desc:'Choose if you want your users to get direct messaged every levelup (and newly assigned role). A user will get only one levelup message per levelup (priority: active channel > autopost channel > direct message).',example: '<prefix>server set notifyLevelupDm '},
    {title: 'Channel notifications',command: '<prefix>server set notifyLevelupCurrentChannel ',desc:'Choose if you want your users to get messaged levelups in their currently active text channel. A user will get only one levelup message per levelup (priority: active channel > autopost channel > direct message).',example: '<prefix>server set notifyLevelupCurrentChannel '},
    {title: 'Levelup with roleassignment message',command: '<prefix>server set notifyLevelupWithRole ',desc:'Optionally do or do not add the levelup message at levels, where a roleassignment message is sent anyways (for dm and channel messages).',example: '<prefix>server set notifyLevelupWithRole '},
    {title: 'Levelup message',command: '<prefix>server set levelupMessage [ text ]',desc:'Changes the message for levelups in current channel and direct message. Use <mention> as a placeholder for the users ping, <name> for only the name, <level> for the level digit and <servername> for the name of your server.',example: '<prefix>server set levelupMessage Congratulations <mention>! You reached level <level>. Nice!'},
  ]
};

exports.xpSettings = {
  title: 'XP settings',
  desc: 'Set XP and level settings (admin only).',
  subdesc: 'Adjust settings like points per minute, roles on levelup or activate levelup messages for this server.',
  subcommands: [
    {title: 'Levelfactor',command: '<prefix>server set levelFactor { digit }',desc:'Choose how much more XP is needed for each subsequent level (Base is 100 XP). Needs to be within 20 and 400. Check ' + '<prefix>info levels to verify your settings.',example: '<prefix>server set levelFactor 100'},
    {title: 'XP per activity',command: '<prefix>server set { xpPerTextMessage | xpPerVoiceMinute | xpPerVote } { digit }',desc:'Choose how much XP is given for each activity (Points per minute in voicechannel, textmessage or social upvote). Maximum of 100 for upvotes, 10 for textmessages and 5 for voiceminutes. Activating bonus xp can multiply XP for a set amount of time.',example: '<prefix>server set xpPerVoiceMinute 3'},
    {title: 'Vote cooldown',command: '<prefix>server set voteCooldown { seconds }',desc:'Every user on your server can submit a social upvotes, but only every now and then. Specify the seconds a user has to wait to make another vote. Can range from 180 (3 minutes) to 86400 seconds (24 hours).',example: '<prefix>server set voteCooldown 120'},
    {title: 'Text cooldown',command: '<prefix>server set textMessageCooldown { seconds }',desc:'Every user on your server can get xp for writing a textmessage, but only every now and then. Specify the seconds a user is locked for new textmessage XP after writing a textmessage. Can range from 0 to 120 seconds.',example: '<prefix>server set textMessageCooldown 10'},
    {title: 'Reaction Voting',command: '<prefix>server set reactionVote ',desc:'Activating this causes every reaction with your voteEmote to automatically trigger an upvote (and cooldown).',example: '<prefix>server set reactionVote '},
    {title: 'Muted Xp',command: '<prefix>server set allowMutedXp ',desc:'Allow users to gain XP while being muted in a voicechannel',example: '<prefix>server set allowMutedXp '},
    {title: 'Deafened Xp',command: '<prefix>server set allowDeafenedXp ',desc:'Allow users to gain XP while being deafened in a voicechannel',example: '<prefix>server set allowDeafenedXp '},
    {title: 'Solo Xp',command: '<prefix>server set allowSoloXp ',desc:'Allow users to gain XP in voicechannels if they are alone (bots don\'t count).',example: '<prefix>server set allowSoloXp '},
    {title: 'Invisible Xp',command: '<prefix>server set allowInvisibleXp ',desc:'Allow users to gain XP while being invisible (marked as offline).',example: '<prefix>server set allowInvisibleXp '},
    /*{title: '',command: '<prefix>server set allowSilentXp ',desc:'Allow users to gain xp in voicechannels if they are not speaking. If this option is set to off, it will only count xp if the users microphone has activated at least once in the last 5 minutes.',example: '<prefix>server set allowSilentXp '},*/
    {title: 'Bonus Xp',command: '<prefix>server set { bonusPerTextMessage | bonusPerVoiceMinute | bonusPerVote } { digit }',desc:'Set how much bonus is given for textmessages during bonus xp times. This feature won\'t be active until the bonusuntil command was used to set the duration of your bonus xp time. Maximum of 100 for upvotes, 20 for textmessages and 10 for voiceminutes.',example: '<prefix>server set bonusPerTextMessage 3'},
    {title: 'Bonus time',command: '<prefix>server set bonusUntil { minutes }',desc:'Activate the bonus XP times, like double XP weekends, by setting the duration of it. Mininum of 10 to maximum 4320 minutes (= 72 hours).',example: '<prefix>server set bonusUntil 1440'},
    {title: 'NoXp Channels',command: '<prefix>channel [ #channel | channelName | channelId ] set noXp ',desc:'Choose channels (text or voice) to not score points from.',example: '<prefix>channel afk set noXp. <prefix>channel 123456 set noXp '},
    {title: 'NoXp Roles',command: '<prefix>role { @role | roleName | roleId } set noXp ',desc:'Exclude roles from getting XP through speaking, writing or voting.',example: '<prefix>role guest set noXp '}
  ]
};

exports.bonusxp = {
  title: 'Bonus XP',
  desc: 'Give and take bonus xp to your members (admin only).',
  subdesc: 'The text, voice and vote scores are not adjustable by the admins. For this you can use the bonus score - grant your members XP for special events or boost up your most loyal members when switching to this bot.',
  subcommands: [
    {title: 'Give or take bonus XP',command: '<prefix>member [ @user | userName#tag | userId ] { give | take } { digit }',desc:'Give bonus XP to a user.',example: '<prefix>member @user give 200. ' + '<prefix>member username#0001 give 200'},
  ]
};

exports.roleAssignments = {
  title: 'Role Assignments',
  desc: 'Set role settings (admin only).',
  subdesc: 'Set up your role ladder and rewards. Roles are updated on levelup / leveldown.',
  subcommands: [
    {title: 'Assign roles on levelup',command: '<prefix>role { @role | roleName | roleId } set assignlevel { level } ',desc:'Automatically give a role to users upon reaching a certain level. Set the level to 0 to remove the assignment. Assignments to level 1 (start level) will be given on server join. Maximum of 3 assignments per level.',example: '<prefix>role master set assignLevel 20. ' + '<prefix>role 123456 set assignlevel 20'},
    {title: 'Deassign roles on levelup',command: '<prefix>role { @role | roleName | roleId } set deassignlevel { level }',desc:'Automatically take a role from users upon reaching a certain level. Set the level to 0 to remove the deassignment. Maximum of 3 deassignments per level.',example: '<prefix>role novice set deassignLevel 20. ' + '<prefix>role 123456 set deassignLevel 25'},
    {title: 'Customize single role assign message',command: '<prefix>role { @role | roleName | roleId } set assignmessage [ text ]',desc:'Change the text of the role assignment notification in the levelup message. Use <mention> as a placeholder for the users ping, <name> for only the name, <level> for the level digit, <servername> for the name of your server and <rolename> for the name of the role.',example: '<prefix>role master set assignMessage Congratulations <name>! From now on we shall call you a <rolename>.'},
    {title: 'Customize single role deassign message',command: '<prefix>role { @role | roleName | roleId } set deassignmessage [ text ]',desc:'Change the text of the role deassignment notification in the levelup message. Use <mention> as a placeholder for the users ping, <name> for only the name, <level> for the level digit, <servername> for the name of your server and <rolename> for the name of the role.',example: '<prefix>role master set deassignMessage Congratulations <name>! You will no longer be a simple <rolename>.'},
    {title: 'Set the default role assign message',command: '<prefix>server set roleAssignMessage [ text ]',desc:'Changes the default message for roleassignments. This will be replaced for roles, where a specific roleassign message was defined. Use <mention> as a placeholder for the users ping, <name> for only the name, <level> for the level digit, <servername> for the name of your server and <rolename> for the name of the role.',example: '<prefix>server set roleAssignMessage Your have been granted the role <rolename>.'},
    {title: 'Set the default role deassign message',command: '<prefix>server set roleDeassignMessage [ text ]',desc:'Changes the default message for roledeassignments. This will be replaced for roles, where a specific roledeassign message was defined. Use <mention> as a placeholder for the users ping, <name> for only the name, <level> for the level digit, <servername> for the name of your server and <rolename> for the name of the role.',example: '<prefix>server set roleDeassignMessage The role <rolename> has been taken away from you.'},
    {title: 'Activate taking away of assigned roles',command: '<prefix>server set takeAwayAssignedRolesOnLevelDown ',desc:'Automatically take away assigned roles, if the user falls below the assignment level.',example: '<prefix>server set takeAwayAssignedRolesOnLevelDown '},
  ]
};

exports.autopost = {
  title: 'Autopost',
  desc: 'Auto post into channels on certain events (admin only).',
  subdesc: 'Let the bot post on certain events like levelups or server joins into specified channels. You can direct all posts into a single channel or chose a different channel for each event. Specifying no channel will target the current channel. To deactivate it, specify the same channel again (or 0). Please make sure the bot has permissions to post in any channels you specify.',
  subcommands: [
    {title: 'Welcome channel',command: '<prefix>channel [ #channel | channelName | channelId ] autoPost serverJoin',desc:'Specify a channel to post your welcome messages in ',example: '<prefix>channel entrance-hall autoPost serverJoin. ' + '<prefix>channel 0 autoPost serverJoin'},
    {title: 'Welcome Message',command: '<prefix>server set serverJoinMessage { text }',desc:'Changes the welcome message for your post_joinserver channel. Use <mention> as a placeholder for the users ping, <name> for only the name and <servername> for the name of your server.',example: '<prefix>server set serverJoinMessage Our new member <mention> just joined. Welcome!'},
    {title: 'Levelup channel',command: '<prefix>channel [ #channel | channelName | channelId ] autoPost levelup',desc:'Specify a channel to post levelup messages in. A user will get only one levelup message per levelup (priority: post_ channel > direct message).',example: '<prefix>channel entrance-hall autoPost levelup. ' + '<prefix>channel 1071031757292034 autoPost levelup'},
    {title: 'Levelup Message',command: '<prefix>server set levelupMessage { text }',desc:'Changes the message for levelups in channels and direct message. Use <mention> as a placeholder for the users ping, <name> for only the name, <level> for the level digit and <servername> for the name of your server.',example: '<prefix>server set levelupMessage Congratulations <mention>! You reached level <level>. Nice!'},
  ]
};

exports.reset = {
  title: 'Reset',
  desc: 'Reset server statistics & settings (admin only).',
  subdesc: 'Reset server, channel, or user statistics. While a reset procedure is active, no commands will trigger the bot and no activity will be tracked.',
  subcommands: [
    {title: 'Reset server',command: '<prefix>server reset all',desc:'Reset everything, including settings and stats.',example: '<prefix>server reset all'},
    {title: 'Reset settings',command: '<prefix>server reset settings',desc:'Reset only settings (including no-xp channels, roleassignments, etc.), but no stats.',example: '<prefix>server reset settings'},
    {title: 'Reset stats',command: '<prefix>server reset { stats | textStats | voiceStats | invitestats | voteStats | bonusStats }',desc:'Reset all stats (voice, text, invite, vote and bonus xp) or only a single type of stats.',example: '<prefix>server reset stats'},
    {title: 'Reset stats of all deleted channels or members',command: '<prefix>server reset { deletedMembers | deletedChannels }',desc:'Reset all scores of deleted users or channels. Be careful, all scores that were made in those channels / from that users will also be reset.',example: '<prefix>server reset deletedMembers'},
    {title: 'Reset a channel\'s stats',command: '<prefix>channel { #channel | channelName | channelId } reset stats',desc:'Reset all scores associated with a specific channel.',example: '<prefix>channel screenshots reset stats. ' + '<prefix>channel 123456 reset stats'},
    {title: 'Reset a member\'s stats',command: '<prefix>member { @user | userName#tag | userId } reset stats',desc:'Reset all scores associated with a specific user.',example: '<prefix>member @username reset stats. ' + '<prefix>member 123456 reset stats'}
  ]
}; // GGGGGGGGGGGGGGG
