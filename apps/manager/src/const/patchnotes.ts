export interface PatchnotesEntry {
  version: string;
  date: string;
  time: string;
  title: string;
  desc: string;
  features: { title: string; desc: string }[];
  fixes: { title: string; desc: string }[];
}

export default [
  {
    version: '4.6',
    date: '2022-12-16',
    time: '00:00:00',
    title: 'Bugfixes',
    desc: 'Small adjustments and bugfixes',
    features: [
      {
        title: 'Blacklists',
        desc: 'The developers can now blacklist servers or users from the bot entirely.',
      },
    ],
    fixes: [
      {
        title: '/rank member',
        desc: 'Using the ID of a member that has left the server will no longer redirect to your own stats.',
      },
      {
        title: 'Logging',
        desc: 'Added systems to try to track down the reset bug.',
      },
      {
        title: 'Bot crashes',
        desc: 'Added a potential fix to permanent shard outages.',
      },
      { title: 'Typos', desc: 'Fixed a few typos.' },
    ],
  },
  {
    version: '4.5',
    date: '2022-11-11',
    time: '00:00:00',
    title: 'Better /top and /rank',
    desc: 'Improved /top and /rank, added a beta flag for /bonus role, and fixed noXp voice channels',
    features: [
      {
        title: '/top improvements',
        desc: '/top now uses buttons and slash commands for a more interactive experience.',
      },
      {
        title: '/rank improvements',
        desc: '/rank now supports buttons, and /top channels member has been moved to a submenu of /rank.',
      },
      {
        title: '/bonus role beta',
        desc: '/bonus role now has a beta flag. When enabled, levelup messages will not be sent, but the command will be significantly faster and more stable.',
      },
    ],
    fixes: [
      {
        title: 'Voice channels and noXp',
        desc: 'Voice channels will now obey noXp settings.',
      },
      {
        title: 'Removed /role give|take',
        desc: '/role give and /role take are outdated commands; /bonus role should be used instead.',
      },
    ],
  },
  {
    version: '4.4',
    date: '2022-11-11',
    time: '00:00:00',
    title: 'Small Fixes & Forums',
    desc: 'Improvements to slash commands, noXp categories, and bugfixes.',
    features: [
      {
        title: 'Discord.js v14',
        desc: 'Discord.js is now updated to version 14.x',
      },
      {
        title: 'Thread improvements',
        desc: 'Handling of threads and forums are now more stable',
      },
      {
        title: 'Description changes',
        desc: 'Small changes to instructions and feature names',
      },
      {
        title: 'NoXP Categories',
        desc: 'Categories can be set to NoXp and this will apply to all of their child channels',
      },
      {
        title: 'Removed prefix commands',
        desc: 'All uses and mentions of prefixed commands have been removed.',
      },
      {
        title: 'Removed transition utilities',
        desc: '/clearprefix and warnings to use slash commands have been removed. /migrate will remain for a few more versions.',
      },
    ],
    fixes: [
      {
        title: 'Custom Roleassignment messages can be removed',
        desc: 'Previously, there was no way to remove custom Roleassignment messages',
      },
      {
        title: 'Token End Date',
        desc: '/serverinfo now shows the correct (predicted) end date for tokens',
      },
      {
        title: 'Serverinfo Server Thumbnail',
        desc: "/serverinfo now shows the server's icon as the embed thumbnail",
      },
      {
        title: 'Scheduled Resets',
        desc: 'Scheduled resets are now working.',
      },
    ],
  },
  {
    version: '4.3',
    date: '2022-04-02',
    time: '00:00:00',
    title: 'Backend Upgrades and Slash Commands',
    desc: 'Slash commands are now a feature, and are now fully supported. There are also lots of small adjustments and bugfixes; nearly every bug in #known-bugs was fixed. Also, added a new developer!',
    features: [
      {
        title: 'Node.js 16 / Discord.js v13',
        desc: 'Upgraded our versions of Node.js and Discord.js to allow for more new features.',
      },
      {
        title: 'Thread Support',
        desc: 'Public threads now give XP to their parent channels. Private threads will still not give xp.',
      },
      {
        title: 'Permission Warnings',
        desc: "From time to time, if you are lacking permissions a warning embed will display to remind you to update your bot's permissions.",
      },
      {
        title: 'Slash Commands',
        desc: "Discord's Slash Command feature has been implemented.",
      },
      {
        title: 'Command Rewrite (yes, again)',
        desc: 'Yet again, we changed the structure of commands to make them fit with slash commands.',
      },
    ],
    fixes: [
      {
        title: 'Current Channel',
        desc: 'Fixed issues with notifying about new levelups in the current channel',
      },
      {
        title: 'iOS Profile Bug',
        desc: 'The medal emoji will now be shown on iOS as well',
      },
      {
        title: 'Solo XP Fixes',
        desc: 'Previously, if a member was in a channel with a bot, the bot would count as a member allowing bypass of the soloXp setting. This has been patched.',
      },
      {
        title: 'DM Message Disabling',
        desc: 'Fixed the footer message of DMs to deactivate those messages',
      },
      {
        title: 'Animated Welcome Message',
        desc: 'Fixed profile gifs not playing in a welcome message',
      },
    ],
  },
  {
    version: '4.2',
    date: '2020-12-15',
    time: '00:00:00',
    title:
      'Reaction voting, invite Xp, hide stats types and list of set messages.',
    desc: 'Finally you can upvote other people via a reaction with the voteEmote. Use invite XP by setting your invite to grant both of you some XP. It is now also possible to hide certain types of stats.',
    features: [
      {
        title: 'Reaction Voting',
        desc: 'Use the voteEmote on any text post to trigger an upvote. This shares a cooldown with the command, but can be disabled globally by the admin. A member can also disable it personally.',
      },
      {
        title: 'Invite Xp',
        desc: 'Use the member set inviter command to set your inviter. This will grant your inviter one invite and you some bonus XP. This setting is final and can only be set once.',
      },
      {
        title: 'Reset stat types',
        desc: 'Reset commands for only resetting a certain type of stat f.e. textmessages.',
      },
      {
        title: 'Hide and deactivate stat types',
        desc: 'Choose what types of stats should be shown and recorded by the bot in all stat commands.',
      },
      {
        title: 'Smaller member stats card',
        desc: "Reduced information on the member stats card. The stats command can now be used with a time keyword to query the specified time like with the top command. Also general information has been moved to the new member info command. The member's channel statistics has been moved to the new member top channel command.",
      },
      {
        title: 'Member channel toplist',
        desc: 'The former monthly stats on the member stats embed can now be queried separately and for all times.',
      },
      {
        title: 'New voice XP algorithm',
        desc: 'The counting of voice XP should be way more accurate now in total, but still only tick up once every few minutes.',
      },
    ],
    fixes: [
      {
        title: 'Fix idle connection restarts',
        desc: 'After a certain database connection was not used for a period of time, because all relevant data was already cached in memory, it would cause an error and then restart the bot. This was fixed by adding connection pooling.',
      },
    ],
  },
  {
    version: '4.1',
    date: '2020-09-06',
    time: '00:00:00',
    title: 'Bug fixes, small feature requests and monetization.',
    desc: 'Because of the major changes of patch 4.0, there were a lot of little things to adjust. We also introduce monetization, which does not restrict/unlock features, but gives you some quality of life enhancements.',
    features: [
      {
        title: 'Alias ar!top',
        desc: 'Reintroduced ar!top command as an short form alias for ar!server top members.',
      },
      {
        title: 'Display nicknames',
        desc: 'Option to display nicknames instead of usernames on all embeds and messages.',
      },
      {
        title: 'Allow deafened XP',
        desc: 'You can now choose to give no XP to deafened users.',
      },
      {
        title: 'Allow invisible XP',
        desc: 'You can now choose to give no XP to invisible (shown as offline) users.',
      },
      {
        title: 'No command channels and commandOnly channel',
        desc: 'Restrict certain channels from responding to commands or set one channel as the only channel where commands are allowed. Does not affect users with the manage server permission.',
      },
      {
        title: 'Removed default levelup message',
        desc: 'No default levelup message. If no levelupmessage is set by the admin, no one will appear, but roleassignmessages get sent without levelupmessage. Add option to not send levelupmessage when a roleassignmessage is sent. Removed option to only send levelupmessages on roleassignment (gets unnecessary).',
      },
      {
        title: 'Roleassignmessage without levelupmessage.',
        desc: 'Because of the changes to how the levelup messages work, you can now let the bot send role messages without levelup messages.',
      },
      {
        title: 'Removed { on | off} from all commands',
        desc: 'All true/false settings commands are now toggles. Allow deactivating specific settings of channels and roles (like autoposts) by entering the same command again (as alternative to using id 0).',
      },
      {
        title: 'Removed necessity of "id:" in commands',
        desc: 'Remove necessity of prefixing "id:" for identifying members/channels/roles using their id.',
      },
      {
        title: 'We got verified',
        desc: 'After a lot of support requests we finally got verified with Discord! Yay!',
      },
      {
        title: 'Monetization',
        desc: 'Tokens can now be bought and spent to activate premium on your server. This will not give new features, but quality of life enhancements (like lower stats cooldowns).',
      },
      {
        title: 'Most commands now count as messages',
        desc: 'Certain prefixes (like /,!,>) were excluded from text XP. This restriction is removed now.',
      },
      { title: 'ToS', desc: 'Added ToS and privacy policy.' },
    ],
    fixes: [
      {
        title: 'Unintended upvote of bots',
        desc: 'You can no longer upvote bots.',
      },
      {
        title: 'Sorting of votetag with capital letters',
        desc: 'Sorting did not work until now, if the votetag contained at least one capital letter.',
      },
      {
        title: 'Fixed voice bonus XP',
        desc: 'voice was not giving the correct amount of bonus XP during bonus times.',
      },
      {
        title: 'Fixed channel reset',
        desc: 'Channel resets resulted in wrong roleassignments and levelupmessages (because the internal cache was not flushed together with the persistent data)',
      },
      {
        title: 'Fixed 2x votepower message',
        desc: '2x votepower message was still showing after votepower expired.',
      },
      {
        title: 'Fixed remove roleassignments',
        desc: 'Fixed not being able to remove roleassignments if there are already 3 for a certain level.',
      },
      {
        title: 'Fixed wrong channelname self targeting',
        desc: 'Fixed channel command using current channel if the typed channelname is not found.',
      },
    ],
  },
  {
    version: '4.0',
    date: '2020-07-31',
    time: '00:00:00',
    title: 'Sharded Database and rearranging of commands.',
    desc: 'Sharded Database, small adjustments, changed command structure and preparation for new features.',
    features: [
      {
        title: 'Sharded Database',
        desc: 'To ensure scalability the database is now sharded on multiple machines.',
      },
      {
        title: 'Changed command structure',
        desc: 'Some changes have been made to the commands. Most of the settings are now grouped in ar!set command, while the manual still splits the info into several categories.',
      },
      {
        title: 'Added more selection options for users and channels.',
        desc: 'All comamnds now include the @user, username#tag or id:123456 notation for specifying a user / channel / role. Not specifying it will target the current channel / user.',
      },
      {
        title: 'New reset mechanism',
        desc: 'Resets are done periodically for a fixed amount of rows in the database. This is to prevent resets to stall the bot for everyone else.',
      },
      {
        title: 'Added token currency',
        desc: 'Token represents the support you have shown for the bot. It is also the new way of getting more votepower.',
      },
      {
        title: 'Prefix max length set to 1',
        desc: 'After many requests about this the limit for the prefix length has been reduced to 1.',
      },
      {
        title: 'Added embeds for levelup and welcome messages',
        desc: 'Levelup- and welcomemessages will now be shown in an embed.',
      },
      {
        title: 'Command shortcuts',
        desc: 'To counter the command length of the new command structure, command shortcuts have been added. Simply use the first letter of each command.',
      },
      {
        title: '(Dis)Allow solo xp',
        desc: 'For now you can limit solo xp farmers a little bit with this new setting. XP will only be given if at least two unmuted members are in the channel. However, we are confident to also bring a allowSilentXp setting in the future to only give XP to people who are actually speaking.',
      },
      {
        title: 'Removed downvotes',
        desc: 'We removed this feature because it was not widely used and opened up possibilities for harassement. It also makes sense to remove it in light of the upcoming reaction upvotes (using voteEmote as reaction will trigger an upvote), which would require a separate emote for downvoting.',
      },
      {
        title: 'Notify levelup current channel',
        desc: 'You can now optionally let the bot send levelup messages to the channel the user last wrote in. If no such channel exists the message can still go to the autopost channel or dm.',
      },
    ],
    fixes: [],
  },
  {
    version: '3.8',
    date: '2020-04-14',
    time: '00:00:00',
    title: 'Changes, fixes and additions for existing features.',
    desc: 'A few small problems and optimizations requests have been posted in the support server and are now getting addressed with this patch.',
    features: [
      {
        title: 'New settext command',
        desc: 'This command is introduced simply to take weight off the setserver command.',
      },
      {
        title: 'Changed pointspervoice from five minutes to one minute',
        desc: 'In order to be able to fix this patches voice bonus xp problems, the xpperfiveminutes is changed to xpperminute. To account for this change, the value has been divided by 5 rounded up for everyone (10/5 = 2, but 3/5 = 1). Because of the rounding everyone who had a low pointspervoice value, will see increased stats now.',
      },
      {
        title: 'Changed pointsper and levelfactor limits',
        desc: 'Because of the pointspervoice also levelfactor (to 400), pointspertextmessage (to 20) and pointspervote (to 80) have been increased, so it is possible to have same levels and same proportion between type of stats again.',
      },
      {
        title: 'Default rolemessages',
        desc: 'You can set your own default role assign- and deassignmessage. It will be overwritten for roles, where a specific message was defined (setrole assignmessage).',
      },
      {
        title: 'Deassign assigned roles option',
        desc: 'Until now the bot was not taking away assigned roles above the own level. They will now get removed automatically on level change (most likely due to a leveling down) if you activate this option.',
      },
      {
        title: 'Footer updates',
        desc: 'A new utility has been added for the owner of the bot to easily set the footer message for all shards via a bot command. This way any updates, maintenance, patchtimes and other information can be more easily announced via the footer of the rank and top commands, so users will know better whats going on.',
      },
    ],
    fixes: [
      {
        title: 'Fixed voice bonusxp.',
        desc: 'Bonusxp added through voice activity during bonux xp times did not add the 100% correct value.',
      },
      {
        title: 'Fixed Voteemote command',
        desc: 'Votecommand was not working due to discord.js version update.',
      },
      {
        title: 'Fixed Lvl 1 roles for bots',
        desc: 'ActivityRank was unintentionally assigning serverjoin roles to bots.',
      },
    ],
  },
  {
    version: '3.7',
    date: '2020-03-26',
    time: '00:00:00',
    title: 'Backend changes.',
    desc: 'Framework updates and due to the high demand horizontal scaling is prepared further.',
    features: [
      {
        title: 'Update to Discord.js v12',
        desc: 'We updated Discord.js to v12, because of some small bugs with the old version.',
      },
      {
        title: 'Update to Node.js to v12',
        desc: 'We updated Node.js to v12, because of some small bugs with the old version.',
      },
      {
        title: 'Servercount updates on backupdb',
        desc: 'As the bot will run distributed accross multiple machines, the server count stats for bot-index-websites have to be sent from the backup server, as only there lies all the information necessary.',
      },
    ],
    fixes: [
      {
        title: 'Added a hotfix for a discord.js error',
        desc: 'A known issue in the discord.js framework caused a random shard to not get ready sometimes. A workaraound now manually activates that shard after some time.',
      },
    ],
  },
  {
    version: '3.6',
    date: '2020-03-12',
    time: '00:00:00',
    title: 'No-XP roles, double XP weekends and command restructuring.',
    desc: 'No-XP roles can finally be defined to be excluded from all activity tracking, including voting. A new bonusuntil command enables the possibility to create timeframes for multi XP, like double XP weekends. Command structure has been adjusted for setchannel and setrole commands.',
    features: [
      {
        title: 'No xp roles',
        desc: 'Added the possibility to set noxp roles with the setrole command.',
      },
      {
        title: 'Botstats',
        desc: 'Daily statistics about the bot/shard itself is now saved to the remote database to be able to better track its performance.',
      },
      {
        title: 'Bonusxp stat customizations',
        desc: 'The bonus stat appearance will be customizable like the vote stat now - Name and emote can be customized.',
      },
      {
        title: 'Multi XP times.',
        desc: 'You can activate multi xp for a limited amount of time using the two new setstat bonuspertextmessage and bonuxperfivevoiceminutes commands. These XP will be added within the bonus stat. Additionally to the normal XP, the set amount of bonus points will be added for each textmessage or five minutes in a voicechannel.',
      },
      {
        title: 'Command structure changes',
        desc: 'The activityboard and noxp channel commands have been moved to the new setchannel main command and parsing structure has been adjusted for the setrole command.',
      },
    ],
    fixes: [
      {
        title: 'Backup Snapshots',
        desc: 'To protect the bots data from many threats (like programmer mistakes), a backup schedule (offered by the hosting company) has been added to automatically create snapshots of the remote database server once a week.',
      },
      {
        title: 'Increased limits',
        desc: 'The limit for the give and take commands has been increased from 1K to 10K. The limit for roleassignments has been increased from 50 to 100.',
      },
      {
        title: 'Give/Take points without mention',
        desc: 'Like with the up and down commands, you can now give and take points without mentioning the user.',
      },
    ],
  },
  {
    version: '3.5',
    date: '2020-02-20',
    time: '00:00:00',
    title: 'Implementation of multiple user requested features II',
    desc: 'A lot of ideas have been posted in our support servers featurerequest channel. Those ideas that were requested a lot and are easy to implement will be covered by this patch.',
    features: [
      {
        title: 'Set command split',
        desc: 'The set command was removed and insetad splitted into multiple commands, because it combined too many features. The setserver command will contain settings for the server in general, while the setsats command will customize the leveling system. The setrole command is responsible for setting up the roleassignments.',
      },
      {
        title: 'Custom roleassign messages',
        desc: 'With the new setrole assignmessage command the message sent with the sendlevelupdates option is customizable.',
      },
      {
        title: 'Send levelupdeates only on new role',
        desc: 'Enabling this option will let users direct/activityboard levelupmessages only trigger, whenever the user receives a new role.',
      },
      {
        title: 'Disable downvotes option',
        desc: 'The downvote functionality can now be disabled to avoid harassment on your server.',
      },
      {
        title: 'Limits to roleassigments',
        desc: 'Added very high limits for roleassigment to avoid hostile people trying to overload the bot. A max of 100 roleassigments in total and max 3 per level has been added.',
      },
      {
        title: 'Mention the bot for its prefix',
        desc: 'When you mention the bot itself, it will respond in a friendly way now, showing you the prefix and help command.',
      },
      {
        title: 'Enable muted XP option',
        desc: 'Allow users in voicechannels, who are muted, to still get XP as normal.',
      },
      {
        title: 'Customize toplist entries per page',
        desc: 'Set the amount of users and channels shown in the top commands to get a longer or shorter list.',
      },
      {
        title: 'Vote without mention option',
        desc: 'Allow users to vote for other user without having to ping them. Using the up and down commands, you can now simply write their discord username#tag instead of pinging them.',
      },
    ],
    fixes: [],
  },
  {
    version: '3.4',
    date: '2020-02-10',
    time: '00:00:00',
    title: 'Website Redesign & Bot Statistics',
    desc: 'Redesign of the website to a better look with statistics about the bot.',
    features: [
      {
        title: 'Website',
        desc: 'Removed the very raw looking React template website and integrated a new website (not using React) with Gentelella Bootstrap Theme.',
      },
      {
        title: 'Bot Statistics',
        desc: 'On the website, you can now see some statistics about the bot. These include active voice- and textmembers or commands triggered during the past day. All values get updated every 24 hours.',
      },
    ],
    fixes: [],
  },
  {
    version: '3.3',
    date: '2019-12-27',
    time: '00:00:00',
    title: 'Backend changes',
    desc: 'A more lightweight implementation of certain backend aspects.',
    features: [
      {
        title: 'Removing Users table',
        desc: 'Reducing the load on the backup server by removing the users table. This table had to be queried for every roleassignment (check sendlevelupdates) and vote (check last time upvoted another user). Now the upvotes are in a dedicated table, which is periodically updated from the backup server and the sendlevelupdates setting is saved with the guildmember table. As a result users have to set their sendlevelupdates setting for each guild/server separately.',
      },
      {
        title: 'Redo of texts management',
        desc: "All kinds of texts are now centralized and saved on the backup server. Each time a bot's shard or the website server starts, it will load all necessary information.",
      },
    ],
    fixes: [
      {
        title: 'Reset command overload',
        desc: 'Resetting stats caused an overload problem for very large servers. Resets will now be done instantly and independently on both, bot and backup database (and not updated differentally as usual), and a cooldown for the respective commands has been added.',
      },
      {
        title: 'Bot muted after misspelling of reset command',
        desc: 'Using the reset command caused the bot to not respong anymore in your server, if the commands parameters were formatted the wrong way.',
      },
    ],
  },
  {
    version: '3.2',
    date: '2019-09-26',
    time: '00:00:00',
    title: 'Implementation of multiple user requested features',
    desc: 'We added a number of small additions like creating roleassignments for serverjoins or adding a textmessage cooldown.',
    features: [
      {
        title: 'Reset deleted users and channels',
        desc: 'Understandably those "user lefts" and "channel deleteds" are annoying in your stats. Wipe them all at once with the new reset commands.',
      },
      {
        title: 'Textmessage cooldown',
        desc: 'Admins can activate and set the textmessagecooldown from 0 to 120 seconds. After a user sends a message, it will not be possible for this user to get more xp from messages for set amount of time.',
      },
      {
        title: 'Level 1 Roleassignment (on server join)',
        desc: 'Roleassignments made for level 1 will now be given at the moment of joining the server.',
      },
      {
        title:
          'New command: ar!activityboard - Send activity messages to server channels',
        desc: 'You can now let the messages be posted in specified channels when certain events happen. For now we have levelup and welcome messages (+ set your own customized messages). Any ideas for new activityboards?',
      },
    ],
    fixes: [
      {
        title: 'You cannot vote for yourself anymore',
        desc: "It was never intended that a user should be able to self-vote. Now it is fixed to ensure that our resetted vote stats don't get polluted.",
      },
    ],
  },
  {
    version: '3.1',
    date: '2019-09-23',
    time: '00:00:00',
    title: 'Bonus score',
    desc: 'Admins now have a separate score for giving xp to people, but cannot give votes anymore.',
    features: [
      {
        title: 'Bonus score',
        desc: 'The fact that admins could grant xp only over upvotes was problematic in a few ways. Most notably that it is not transparent anymore how many "real" upvotes the user got. Because of this we introduce the bonus score. From now on ar!give and ar!take will only affect the new bonus score, while votes will only be grantable by users ar!up and ar!down. We will also reset the vote stat globally for everyone (sorry), so all votes will always be true user votes from now on.',
      },
      {
        title: 'Backend changes',
        desc: 'We made also a few fundamental backend adjustments to our previous patch that should further increase the bots performance and scalability, but might cause serious problems after introducing the patch. The transition to the new distributed backend is almost finsihed but not yet. These things are not easy to test with a testbot (that has only 3 servers) and because of this i already say sorry for any downtimes during patching!',
      },
    ],
    fixes: [
      {
        title: 'Not showing of ar!info roles',
        desc: 'There was a problem in displaying ar!info roles, while there was a deleted role in the list.',
      },
    ],
  },
  {
    version: '3.0',
    date: '2019-09-15',
    time: '00:00:00',
    title: 'Remote and in-memory databases',
    desc: 'In order to be able to scale up to many more servers, we need a faster system that also works distributed. This update is big, but mostly necessary backend improvements and nothing new for you. After this is working flawlessly, many new features for our users will follow soon!',
    features: [
      {
        title: 'In-memory database',
        desc: 'An in-memory database is now making the queries for statistics faster (previously the calculation were made on a persistent database). Sadly we cannot test everything with our testbot, as we cannot simulate thousands of users doing different things every second. To test our new code, new remote- and new in-memory-database properly we have to use the live bot - this will cause some serious downtimes / malfunctioning around the update date, sorry!',
      },
      {
        title: 'Remote database',
        desc: 'To save everyones statistics and settings from our in-memory database we simply send it to our remote one periodically. Likewise, after startup with an empty in-memory database the bot will retrieve all the data it needs (for this particular shard and vps) on demand. This way the bot can easily work distributed on multiple machines in the future. But this comes at the cost that during the first minutes there will be a warmup phase so the bot has time to remotely load most of the records into memory before handling all the load. During that time it will simply ignore a certain percentage of messages.',
      },
      {
        title: 'Revamp of the role/noxp tables',
        desc: 'To have a more solid programming we had to change the way roles and noxp channles are saved in our backend. Because of this everyone has to reinsert their configurations for those two features.',
      },
      {
        title: 'Moved reset functionality from set to a new command',
        desc: 'The free up the set command we made a new command for resets. Also because we will soon add another reset command, the reset deleted users/channels functionality to clear up stats.',
      },
      {
        title: 'New command: ar!patchnotes',
        desc: 'A few have expressed the wish to know whats going on with updates. Fair enough, here you have your command.',
      },
    ],
    fixes: [
      {
        title:
          'Not showing of ar!info when one of the roles/noxp lists is too long',
        desc: 'We solved this by having separate commands for showing the lists (f.e. ar!info roles).',
      },
    ],
  },
] satisfies PatchnotesEntry[];
