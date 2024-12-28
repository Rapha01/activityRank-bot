export interface FAQEntry {
  id: number;
  title: string;
  desc: string;
}

export default [
  {
    id: 1,
    title: "What is my bot's prefix?",
    desc:
      "You don't need any prefix since we now use Slash Commands.<br>" +
      '<br>' +
      "Type <code>/</code> - If you don't see any commands listed, reinvite the bot " +
      '<a href="https://discord.com/api/oauth2/authorize?client_id=534589798267224065&permissions=294172224721&scope=bot%20applications.commands">here</a>.',
  },
  /*{
    id: 2,
    title: 'What are tokens and how do I get/earn them?',
    desc: 'Tokens are used to double your votepower (see FAQ number 17).<br>' +
      'Tokens can also be used to make a server go Premium, resulting in shorter stats cooldowns (5 seconds instead of 30 seconds) as well as removing the "please go Premium" message.<br>' +
      'Find more information on our website below.<br>' +
      '<br>' +
      'You receive tokens by <a href="https://top.gg/bot/534589798267224065">upvoting the bot on top.gg</a>. <br>' +
      'You can buy tokens <a href="https://activityrank.me/tokens">on our website</a>. '
  },*/
  {
    id: 3,
    title: 'How do I get the role, channel or user ID?',
    desc:
      '1. Go to your Discord user settings and then Advanced<br>' +
      '2. Enable Developer Mode<br>' +
      '3. Go to the role, channel or user you wish to find the ID of<br>' +
      '4. Right click on it and copy ID',
  },
  {
    id: 4,
    title: "My Bot doesn't respond to commands or is offline?",
    desc:
      '-> Check the right side of discord to see if the bot is online (if not it may be a restart).<br>' +
      '-> Try the command <code>/ping</code><br>' +
      '-> Make sure the bot has got all needed role permissions on the server.<br>' +
      '-> Make sure the bot has got all needed Role permissions within the channel settings.<br>' +
      '-> Check if you have disabled slash commands in certain channels, via <code>Server Settings -> Integrations -> ActivityRank.</code><br>' +
      '<br>' +
      'Also check commandOnly and noCommand channels, but it is advised to use the Integrations menu instead.  ',
  },
  {
    id: 5,
    title: 'How do I change the xp settings?',
    desc:
      '<code>/config-xp xp-per</code><br>' +
      '<code>/config-xp bonus-xp-per</code><br>' +
      '<code>/config-server cooldown</code><br>' +
      '<br>' +
      '<br>' +
      '<b>Note</b> that this will recalculate everything',
  },
  {
    id: 6,
    title: 'What is the level factor?',
    desc:
      'The level factor says how many XP more per level you need. See below the definition of each number as well as how it is calculated.<br>' +
      '<br>' +
      'Run: <code>/serverinfo type:levels</code><br>' +
      'The 1st number is the amount of XP needed to gain the next level (the bracketed number is the total XP needed)<br>' +
      '<br>' +
      '<strong>Previous Level</strong><br>' +
      '<code>((((level + 1) * level) / 2) - 1) * LF - 100</code><br>' +
      '<br>' +
      '<strong>Next Level</strong><br>' +
      '<code>((((level + 1) * level) / 2) * LF) + (level * 100)</code><br>' +
      '<br>' +
      '<strong>Current level</strong><br>' +
      '<code>(((((level + 1) * level) / 2) * LF) + (level * 100)) - ((level * LF) + 100)</code><br>' +
      '<em>(Previous level is previous to your current level eg. you are level 5, use level 4)</em>',
  },
  {
    id: 7,
    title: 'All about Levelroles',
    desc:
      '-> To add a role use <code>/config-role levels</code> and fill out the required fields.<br>' +
      '-> To change the level use the command for assigning/deassigning levels again but use the level you wish.<br>' +
      '-> To remove, set the level to 0.<br>' +
      '<br>' +
      "If roles don't get assigned upon levelup:<br>" +
      '-> Make sure the ActivityRank role is above all levelroles on the role ladder/hirachy: https://cdn.discordapp.com/attachments/940677091446386739/1005850212872507443/unknown.png?size=4096<br>' +
      '-> Make sure the Bot has all needed permissions (Check via <code>/serverinfo</code> - Subcategory permissions<br>' +
      '-> Make sure the assignlevel is lower than the deassignlevel.<br>' +
      '<br>' +
      'When do people get the roles assigned?<br>' +
      '-> They need to levelup again. This can happen by receiving enough XP on the default way or an admin giving bonus XP.',
  },
  {
    id: 8,
    title: 'Is it possible to use Admin commands without Admin permissions?',
    desc: 'Yes, because you need MANAGE SERVER permissions in order to use Admin commands.',
  },
  {
    id: 9,
    title: 'Are there only 13 levels and top 12 users?',
    desc:
      'There are unlimited levels! Simply add a page number at the end of the commands:<br>' +
      '<code>/serverinfo type:levels</code> (shows page 5 of the levels)<br>' +
      '<code>/top members server page:2</code> (shows page 2 of the leaderboard)',
  },
  {
    id: 10,
    title: 'Is there a rank card?',
    desc: 'A rank card will be a thing in the future.',
  },
  {
    id: 11,
    title: "The bot doesn't give XP",
    desc:
      'Make sure the bot has the permissions to read in the channels.<br>' +
      'Check if you have a noxp role: <code>/serverinfo type:NO XP roles</code><br>' +
      'Check if the channel is a noxp channel: <code>/serverinfo type:NP XP channels</code><br>' +
      "If it's a voice channel: the Bot updates voicetime every 0.1 hours (6 min) or 0.2 hours (12 min)<br>" +
      "Make sure you didn't deactivate the specific XP type",
  },
  {
    id: 12,
    title: 'All about 🏆 bonus XP',
    desc:
      'To give bonus XP<br>' +
      '<code>/bonus role role: give: take:</code><br>' +
      '<code>/bonus member member: give: take:</code><br>' +
      '<br>' +
      "You can't give Level, only XP. Maximum of 1.000.000 XP per command run.<br>" +
      '<br>' +
      'Bonustime:<br>' +
      'Configure your XP per values (they get added upon the default XP per settings, NOT multiplied!): <code>/config-bonus xp-per</code><br>' +
      'Sart your bonustime with: <code>/config-xp bonustime</code>',
  },
  {
    id: 13,
    title: 'How do I set up levels for voice/text/invites/likes only?',
    desc:
      'You can deactivate textmessage XP, voice XP, invite XP or like/vote XP<br>' +
      '<code>/config-server set</code><br>' +
      '<br>' +
      'These are toggles. Means they either get activated or deactivated.<br>' +
      '<br>' +
      '-----------------------------<br>' +
      '<br>' +
      'More details for Voice Leveling only:<br>' +
      '<br>' +
      '1. disable all other modules:<br>' +
      '<code>/config-server set</code><br>' +
      '<br>' +
      '2. If you need specific voicetimes <a href="https://docs.google.com/spreadsheets/d/1TbLNHgtCDU7wyWF9GMmRQhCSR5lhxOjcP9NDrKVwCnE/edit?usp=sharing">check our calculator <em>(not completely finished yet)</em></a>.<br>' +
      'Maybe you need to change your <b>levelfactor</b> or <b>xp per voiceminute</b>!!<br>' +
      '<code>/config-xp levelfactor</code><br>' +
      '<code>/config-xp xp-per</code><br>' +
      '<br>' +
      '3. Do the levelroles:<br>' +
      '<code>/config-role levels role: assignlevel: deassignlevel:</code>',
  },
  {
    id: 14,
    title: "I'm not getting any level up messages?",
    desc:
      '1. Either use <code>/config-server set</code> and choose between "Notify via DM" or "Notify Last Active Channel"<br>' +
      'or use <code>/config-channel channel:</code> and choose Levelup Channel<br>' +
      '<br>' +
      '2. Set the level up message, use the variables, &lt;mention&gt;, &lt;name&gt;, &lt;level&gt;, &lt;servername&gt; and &lt;rolemention&gt;<br>' +
      'Type <code>/config-messages</code>, choose "Levelup Message" and then enter your message.<br>' +
      'Make sure the bot has the permissions to send embeds and messages aswell as attach files in your chosen channel',
  },
  {
    id: 15,
    title: 'What are votes?',
    desc:
      'Votes (or Likes) are a way for users to give someone XP. You can use the command <code>/member upvote</code> or you can activate reaction voting on your server with <code>/config-server set</code> and choose "reaction vote",<br>' +
      '<br>' +
      'You can change the votecooldown with <code>/config-server cooldown</code><br>' +
      '<br>' +
      'You can change your vote-emote and name with <code>/config-server vote</code> then when a user reacts on a message, it gives the message sender one Like (or two if you got 2x power), and they gain a set amount of XP.<br>' +
      'You can get 2x power for 3 days by upvoting the bot on top.gg <code>/token redeem votepower</code><br>',
    //'<br>' +
    //'You receive tokens by <a href="https://top.gg/bot/534589798267224065">upvoting the bot on top.gg</a>. <br>' +
    //'You can buy tokens <a href="https://activityrank.me/tokens">on our website</a>.'
  },
  {
    id: 16,
    title:
      'Can I stop muted/deafened/solo users from gaining XP in voice channels?',
    desc:
      'Run <code>/config-server set</code> and click on "Allow Muted XP", "Allow Deafened XP" or "Allow Solo XP" to either allow or disallow.<br>' +
      '<br>' +
      "<strong>Bots don't count as users!</strong>",
  },
  {
    id: 17,
    title: 'When does the monthly, weekly and daily stats reset?',
    desc:
      'The monthly stats reset every 2nd day of the month <t:1654560000:T>.<br>' +
      'The weekly stats reset every Tuesday <t:1654560000:T>.<br>' +
      'The daily stats reset every midnight <t:1654560000:T>.<br>' +
      '<br>' +
      'Timezone is GMT <t:1654560000:T>',
  },
  {
    id: 18,
    title: 'An error occured or no Commands get listed, what to do?',
    desc:
      'If there are no commands listed if you type <code>/</code>, <a href="https://discord.com/api/oauth2/authorize?client_id=534589798267224065&permissions=294172224721&scope=bot%20applications.commands">reinvite the bot</a> and wait 5 minutes.<br>' +
      '<br>' +
      "If the bot says an error occured or the application timed out, please try again later. It might be a shard down or a restart. If it still doesn't work contact the Help Staff",
  },
  {
    id: 19,
    title: "Why doesn't my voicetime get updated anymore?",
    desc:
      'Most likely you just need to disconnect and connect back to any voice channel, wait a few minutes and then check your stats again.<br>' +
      '<br>' +
      "Otherwise you're using a Bot that creates temporary voice channels. At a certain point this breaks your voice tracking (and XP). <br>" +
      'Either remove the voice channel bot, stop using the voice activity XP (in future you will be able to turn this off) or live with it. <br>' +
      'After a restart of the bot it fixes itself, BUT only for a certain amount of time!<br>' +
      '<br>' +
      "If it's not a Bot, then the first update happens after 12 minutes (0.2) and then every 6 minutes (0.1)<br>" +
      '0.1 = 6 min<br>' +
      '0.5 = 30 min<br>' +
      '1.0 = 60 min',
  },
  {
    id: 20,
    title: 'How does invite XP work?',
    desc:
      'You can set one person as Inviter -> The person who invited you. <code>/inviter member:</code><br>' +
      'Both of you get 1 Invite (✉️) onto your Stats and a set amount of XP. <br>' +
      'To check who you set as Inviter, simply run <code>/memberinfo</code><br>' +
      "<strong>This is a one-time decision!! Once this is set, only a reset of the whole server's Inviters can undo it!</strong>",
  },
  {
    id: 21,
    title: 'What are the different Stats/Emojis?',
    desc:
      '✍️ = Textmessages<br>' +
      '🎙️ = Voicetime (shown in hours)<br>' +
      '✉️ = Invites (see FAQ nr. 22)<br>' +
      '❤️ = likes (see FAQ nr. 17)<br>' +
      '🏆 = Bonus (give/take or Bonustime)',
  },
  {
    id: 22,
    title: 'Will there be a Dashboard?',
    desc: "A Dashboard is planned, but we can't give an ETA.",
  },
] satisfies FAQEntry[];
