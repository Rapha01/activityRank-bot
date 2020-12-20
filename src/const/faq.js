module.exports = [
  {
    id: 1,
    title: 'How do I see more Level/Roles/...?',
    desc: 'Simply page through it! Add a number at the end of the command, f. e. `ar!i level 2` or `ar!faq 2`.',
  },
  {
    id: 2,
    title: 'What is the prefix of my bot?',
    desc: 'The default prefix is `ar!` - Ping/Mention the bot to get your prefix (@ActivityRank)',
  },
  {
    id: 3,
    title: 'Why do my commands not get recognized?',
    desc: 'Either you are using the wrong prefix, made a spelling mistake or you are trying to type the commands with `( )`, `[ ]` or `{ }` *yeah, do NOT use placeholders...*',
  },
  {
    id: 4,
    title: 'What are tokens and how do I get/earn them?',
    desc: 'Tokens are currently used to double your votepower (ar!m @user up) and fuel Servers to activate the premium status for a removal of the “please power the server” message and a shorter stats cooldown. More Information on the website link below.\nYou receive tokens by upvoting the bot on top.gg (https://top.gg/bot/534589798267224065)\nYou can buy tokens on our website (https://activityrank.me/tokens)',
  },
  {
    id: 5,
    title: 'How do I get the role, channel or user ID?',
    desc: '1. Go to your Discord user settings and then Appearance\n2. Enable Developer Mode\n3. Go to the role, channel or user you wish to find the ID of\n4. Right click on it and copy ID',
  },
  {
    id: 6,
    title: 'My Bot doesn’t respond to commands or is offline?',
    desc: '-> Check the right side of discord to see if the bot is online (if not it may be a restart)\n-> Try pinging/mentioning the bot @ActivityRank\n-> Make sure the bot has got all needed role permissions on the server.\n-> Make sure the bot has got all needed role permissions within the channel settings.\n-> Check if you have set noCommands or CommandOnly channel.\n\nYou can only have one CommandOnly channel. All others get ignored, except you got MANAGE_SERVER permissions. If you want to allow multiple commandOnly channel, you need to set every other channel as noCommand Channel.',
  },
  {
    id: 7,
    title: 'How do I add/change/remove assign/deassign level roles?',
    desc: 'To add a role use `ar!r [@role | rolename | roleid] set assignlevel [level]`\nTo deassign the assigned role at a higher level use `ar!r [@role | rolename | roleid] set deassignlevel [level]`\nTo remove, set the level to 0: `ar!r @role set [deassignlevel | assignlevel[ 0`',
  },
  {
    id: 8,
    title: 'The bot is not giving out the roles I set',
    desc: 'Make sure the roles are correctly set with `ar!i roles`\nThe assignlevel has to be lower than the deassignlevel\nMake sure the bot role is above the roles you want it to assign\nMake sure the bot has the ‘Manage_Server’ permission',
  },
  {
    id: 9,
    title: 'The bot doesn’t give XP',
    desc: 'Make sure the bot has the permissions to read in the channels\nCheck if you have a noxp role: `ar!i noxp roles`\nCheck if the channel is a noxp channel: `ar!i noxp channels`\nIf it’s a voice channel: the Bot updates voicetime every 0.1 hours (6 min) or 0.2 hours (12 min)\nMake sure you didn`t deactivate the specific XP type'
  },
  {
    id: 10,
    title: 'I added a new role. Will people who are already that level or above get it?',
    desc: 'Yes and No. Their roles get updated once they leveled up again.',
  },
  {
    id: 11,
    title: 'Can I give/take XP/Level to a role/user?',
    desc: 'Currently you can only give bonus XP to single users with the command: `ar!m [@name | name | <id>] [give | take] [amount]`\nYou can’t give Level, only XP. Maximum of 1.000.000 XP per command run. You can’t give XP or Level to roles (future feature).',
  },
  {
    id: 12,
    title: 'How do I set up levels for voice/text only?',
    desc: 'You can deactivate textmessage XP, voice XP, invite XP or like/vote XP\n`ar!s set textXP`\n`ar!s set voiceXP`\n`ar!s set inviteXP`\n`ar!s set voteXP`\nThese are toggles. Means they either get activated or deactivated.',
  },
  {
    id: 13,
    title: 'I’m not getting any level up messages?',
    desc: 'Choose between DM, specific channel or last channel the user wrote in to. Priority: current channel > autopost channel > direct message\n`ar!s set notifyLevelupCurrentChannel`\n`ar!c #channel autopost levelup`\n`ar!s set notifyLevelupDM`\n\nSet the level up message, use the variables, <mention>, <name>, <level> and <servername>\nExample: `ar!s set levelupmessage Well done <mention> you got level <level>!`\nMake sure the bot has the permissions to send embeds and messages aswell as attach files in your chosen channel',
  },
  {
    id: 14,
    title: 'What are votes?',
    desc: 'Votes (or Likes) are a way for users to give someone XP. You can use the command `ar!m @member up` or you can activate reaction voting on your server with `ar!s set reactionvote`, you need to set your vote-emote with `ar!s setvoteemote :emote:` then when a user reacts on a message, it gives the message sender one Like (or two if you got 2x power), and they gain a set amount of XP.\nYou can get 2x power for 3 days by redeeming 10 tokens: `ar!token redeem votepower`\n\nYou receive tokens by upvoting the bot on top.gg (https://top.gg/bot/534589798267224065)\nYou can buy tokens on our website (https://activityrank.me/tokens) ',
  },
  {
    id: 15,
    title: 'Can I stop muted/deafened/solo users from gaining XP in voice channels?',
    desc: 'Toggle gaining XP while someone is alone in voice: `ar!s set allowSoloXP`\nToggle gaining XP if someone is muted in voice: `ar!s set allowMutedXP`\nToggle gaining XP if user is deafened: `ar!s set allowDeafenedXP`\nToggle gaining xp if users are invisible: `ar!s set allowinvisibleXP `\nBots don’t count as users!',
  },
  {
    id: 16,
    title: 'When does the monthly, weekly and daily stats reset?',
    desc: 'The monthly stats reset every 2nd day of the month.\nThe weekly stats reset every Tuesday.\nThe daily stats reset every midnight.\n\nTimezone is GMT',
  },
  {
    id: 17,
    title: 'How does invite XP work?',
    desc: 'You can set one person as Inviter -> The person who invited you. `ar!m @user set inviter`\nBoth of you get 1 Invite (:envelope:) onto your Stats and a set amount of XP.\nTo check who you set as Inviter, simply run `ar!m info`.\n**This is a one-time decision!! Once this is set, only a reset of the whole Servers Inviters can undo it!!**',
  },
  {
    id: 18,
    title: 'What are the different Stats/Emojis?',
    desc: ':writing_hand: = Textmessages\n:microphone2: = Voicetime (shown in hours)\n:envelope: = Invites\n:heart: = likes \n:trophy: = Bonus (give/take or Bonustime)',
  },
  {
    id: 19,
    title: 'What is the level factor?',
    desc: 'The level factor says how many XP more per level you need. See below the definition of each number as well as how it is calculated.\n\nRun: `ar!i levels`\nThe 1st number is the amount of XP needed to gain the next level (the bracketed number is the total XP needed)\n**Previous level total XP + (previous level * level factor) + 100**\n*(Previous level is previous to your current level eg. you are level 5, use level 4)*',
  },
  {
    id: 20,
    title: 'How do I change the xp settings?',
    desc: '-> For text messages `ar!s set xppertextmessage [0-10]`\n-> For voice `ar!s set xppervoiceminute [0-5]`\n-> For upvotes `ar!s set xpperupvote [0-100]`\n-> For invites `ar!s set xpperinvote [0-1000]`\n-> For text message cooldown `ar!s set textmessagecooldown [0-120]`',
  },
]
