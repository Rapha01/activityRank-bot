module.exports = [
  {
    id: 1,
    title: 'What is my bot\'s prefix?',
    desc: 'You don\'t need any prefix since we now use slash commands.',
  },
  {
    id: 2,
    title: 'What are tokens and how do I get/earn them?',
    desc: 'Tokens are used to double your votepower (see FAQ number 17).' +
      'Tokens can also be used to make a server go Premium, resulting in shorter stats cooldowns (5 seconds instead 30 seconds), as well as removing the "please go Premium" message.' +
      'You receive tokens by <a href="https://top.gg/bot/534589798267224065">upvoting the bot on top.gg.</a><br>You can also <a href="https://activityrank.me/tokens">buy tokens on our website.</a>',
  },
  {
    id: 3,
    title: 'How do I get the role, channel or user ID?',
    desc: '1. Go to your Discord user settings and then Advanced<br>' +
      '2. Enable Developer Mode.<br>3. Go to the role, channel or user you wish to find the ID of.<br>' +
      '4. Right click on it and select "Copy ID".',
  },
  {
    id: 4,
    title: 'My Bot doesn\'t respond to commands or is offline?',
    desc: '-> Check the right side of discord to see if the bot is online (if not it may be a restart).<br>' +
      '-> Try the command <code>/ping</code>.<br>-> Make sure the bot has got all needed role permissions on the server.<br>' +
      '-> Make sure the bot has got all needed Role permissions within the channel settings.<br>' +
      '-> Check if you have disabled slash commands in certain channels.' +
      '<br><br>You can only have one CommandOnly channel. All others get ignored, except if you have <code>Manage Server</code> permissions.' +
      'If you want to allow multiple commandOnly channels, you need to set every other channel as a noCommand Channel.',
  },
  {
    id: 5,
    title: 'How do I change the xp settings?',
    desc: 'Use <code>/config-xp</code> and <code>/config-server cooldown</code>.<br>Note that this will recalculate your members\' XP values.',
  },
  {
    id: 6,
    title: 'What is the levelfactor?',
    desc: 'The level factor says how many XP more per level you need. See below the definition of each number as well as how it is calculated.<br><br>' +
      'Run: <code>/serverinfo type:levels</code><br>The 1st number is the amount of XP needed to gain the next level (the bracketed number is the total XP needed)<br><br>' +
      '<strong>Previous Level</strong><br><code>((((level + 1) * level) / 2) - 1) * LF - 100</code><br><br<strong>Next Level</strong><br><code>((((level + 1) * level) / 2) * LF) + (level * 100)</code><br><br>' +
      '<strong>Current level</strong><br><code>(((((level + 1) * level) / 2) * LF) + (level * 100)) - ((level * LF) + 100)</code><br><i>(Previous level is previous to your current level eg. you are level 5, use level 4)</i>',
  },
  {
    id: 7,
    title: 'How do I add/change/remove assign/deassign level roles?',
    desc: 'To add a role use <code>/config-role levels</code> and fill out the required fields.<br><br>To change the level use the command for assigning/deassigning levels again but use the level you wish.<br>To remove, set the level to <code>0</code>.',
  },
  {
    id: 8,
    title: 'The bot is not giving out the roles I set',
    desc: 'Make sure the roles are correctly set in the <code>Roles</code> tab of <code>/serverinfo</code>.<br>' +
      'The assignlevel has to be lower than the deassignlevel.<br>' +
      'Make sure the bot role is above the roles you want it to assign.<br>' +
      'Make sure the bot has the <b>Manage Roles</b> permission.',
  },
  {
    id: 9,
    title: 'Is it possible to use Admin commands without Admin permissions?',
    desc: 'Yes, because you only need <b>Manage Server</b> permissions in order to use Admin commands.',
  },
  {
    id: 10,
    title: 'Are there only 13 levels and top 12 users?',
    desc: 'There are unlimited levels! Simply add a page number at the end of the commands:<br>' +
      '<code>/serverinfo type:levels</code> (shows page 5 of the levels)<br>' +
      '<code>/top members server page:2</code> (shows page 2 of the leaderboard)',
  },
  {
    id: 11,
    title: 'I added a new role. Will people who are already that level or above get it?',
    desc: 'Their roles will be updated once they level up again.',
  },
  {
    id: 12,
    title: 'Is there a rank card?',
    desc: 'Probably in the future!',
  },
  {
    id: 13,
    title: 'The bot doesn\'t give XP',
    desc: 'Make sure the bot has the permissions to read in the channels.<br>' +
      'Check if you have a noxp role: <code>/serverinfo type:NO XP roles</code><br>' +
      'Check if the channel is a noxp channel: <code>/serverinfo type:NP XP channels</code><br>' +
      'If it\'s a voice channel: the bot updates voicetime every 0.1 hours (6 min) or 0.2 hours (12 min)<br>' +
      'Make sure you didn\'t deactivate the specific XP type',
  },
  {
    id: 14,
    title: 'Can I give/take XP/Level to a role/user?',
    desc: '<code>/bonus role role: give: take:</code><br>' +
      '<code>/bonus member member: give: take:</code><br>' +
      'You can\'t give levels, only XP. There is a maximum of 1.000.000 XP per command run.',
  },
  {
    id: 15,
    title: 'How do I set up levels for voice/text/invites/likes only?',
    desc: 'You can deactivate textmessage XP, voice XP, invite XP or like/vote XP with <code>/config-server set</code>.<br>' +
      'These are toggles, meaning they either get activated or deactivated.',
  },
  {
    id: 16,
    title: 'I\'m not getting any level up messages?',
    desc: '1. Either use <code>/config-server set</code> and choose between <i>"Notify via DM"</i> or <i>"Notify Last Active Channel"</i>' +
      'or use <code>/config-channel channel:</code> and choose Levelup Channel.<br>' +
      '2. Set the level up message, use the variables, &lt;mention&gt;, &lt;name&gt;, &lt;level&gt; and &lt;servername&gt;' +
      'Type <code>/config-messages</code>, choose <i>"Levelup Message"</i> and then enter your message.' +
      'Make sure the bot has the permissions to send embeds and messages as well as attach files in your chosen channel',
  },
  {
    id: 17,
    title: 'What are votes?',
    desc: 'Votes (or Likes) are a way for users to give someone XP. You can use the command <code>/member upvote</code> or you can right click on them and select <code>Apps -> Upvote</code>.<br>' +
      'You can change the votecooldown with <code>/config-server cooldown</code>.<br>' +
      'You can change your vote-emote and name with <code>/config-server vote</code> then when a user reacts on a message, it gives the message sender one Like (or two if you got 2x power), and they gain a set amount of XP.<br>' +
      'You can get 2x power for 3 days by redeeming 10 tokens: <code>/token redeem votepower</code><br><br>' +
      'You receive tokens by <a href="https://top.gg/bot/534589798267224065">upvoting the bot on top.gg.</a><br>' + 
      'You can also <a href="https://activityrank.me/tokens">buy tokens on our website.</a>',
  },
  {
    id: 18,
    title: 'Can I stop muted/deafened/solo users from gaining XP in voice channels?',
    desc: 'Run <code>/config-server set</code> and click on "Allow Muted XP", "Allow Deafened XP" or "Allow Solo XP" to either allow or disallow.<br>' +
      'Bots don\'t count as users!',
  },
  {
    id: 19,
    title: 'When do the monthly, weekly and daily stats reset?',
    desc: 'The monthly stats reset every 2nd day of the month.<br>' +
      'The weekly stats reset every Tuesday.<br>' +
      'The daily stats reset every midnight.<br><br>' +
      'Timezone is GMT.',
  },
  {
    id: 20,
    title: 'Why doesn\'t my command get recognized?',
    desc: 'Most likely you trying to type the command with { }, [ ] or ( ). These are just placeholders to show you "please replace me with the correct parts".' +
      'Otherwise you did a spelling mistake somewhere, doublecheck the command.',
  },
  {
    id: 21,
    title: 'Why doesn\'t my voicetime get updated anymore?',
    desc: 'Most likely you just need to disconnect and connect back to any voice channel, wait a few minutes and then check your stats again.<br><br>' +
      'Otherwise you\'re using a bot that creates temporary voice channels. At a certain point this breaks your voice tracking (and XP).<br>' +
      'Either remove the voice channel bot, stop using the voice activity XP (in future you will be able to turn this off) or live with it.<br>' +
      'After a restart of the bot it fixes itself, BUT only for a certain amount of time!<br><br>' +
      'If it\'s not a Bot, then the first update happens after 12 minutes (0.2) and then every 6 minutes (0.1)<br>' +
      '0.1 = 6 min<br>' +
      '0.5 = 30 min<br>' +
      '1.0 = 60 min<br>',
  },
  {
    id: 22,
    title: 'How does invite XP work?',
    desc: 'You can set one person as Inviter -> The person who invited you. <code>/inviter</code><br>' +
      'Both of you get 1 Invite (✉️) onto your Stats and a set amount of XP.<br>' +
      'To check who you set as Inviter, simply run `/memberinfo`.<br>' +
      '<strong>This is a one-time decision!! Once this is set, only a reset of the whole Servers Inviters can undo it!!</strong>',
  },
  {
    id: 23,
    title: 'What are the different Stats/Emojis?',
    desc: '✍️ = Textmessages<br>' +
      '🎙️ = Voicetime (shown in hours)<br>' +
      '✉️ = Invites (see FAQ nr. 22)<br>' +
      '❤️ = likes (see FAQ nr. 17)<br>' +
      '🏆 = Bonus (give/take or Bonustime)<br>',
  },
  {
    id: 24,
    title: 'How do I setup voice levels only?',
    desc: '1. disable all other modules:<br>' +
    '<code>/config-server set</code><br><br>' +
    '2. If you need specific voicetimes check our calculator <em>(not completely finished yet)</em>:<br>'+
    'https://docs.google.com/spreadsheets/d/1TbLNHgtCDU7wyWF9GMmRQhCSR5lhxOjcP9NDrKVwCnE/edit?usp=sharing<br>' +
    'Maybe you need to change your <b>levelfactor</b> or <b>xp per voiceminute</b>:<br>' +
    '<code>/config-xp levelfactor</code><br>' +
    '<code>/config-xp xp-per voiceminute:</code><br><br>' +
    '3. Do the levelroles:<br>' +
    '<code>/config-role levels role: assignlevel: deassignlevel:</code>',
  },
  {
    id: 25,
    title: 'What is Bonus XP or Bonustime?',
    desc: 'Bonus XP are a way to give people extra XP. They can also be taken away. They will be shown on the 🏆 trophy category. There is a max of 1.000.000 bonus XP per command.<br>' +
      'Single Member: <code>/bonus member: give: take:</code><br>' +
      'All Members in Role: <code>/bonus role: give: take:</code><br><br>' +
      'Bonus XP can also be gained by bonustimes. These amounts are being added onto the 🏆 trophy category.  You set your bonus XP values with' +
      '<code>/config-xp bonus-xp-per</code>, and then start your bonustime with <code>/config-xp bonusuntil</code>.',
  },
  {
    id: 26,
    title: 'Will there be a Dashboard?',
    desc: 'A Dashboard is planned, but we can\'t give an ETA.',
  },
]

// testchange
