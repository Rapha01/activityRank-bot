module.exports = [
  {
    title: 'I have set roleassignments but why can the bot not assign them on my server?',
    desc: 'Anyone on discord, also bots, can only assign a role, if the own role has a higher priority than the role it wants to assign. Make sure the bot has a higher priority than any role in the role ladder. You can change this by drag and dropping the roles in the server settings.',
  },
  {
    title: 'Why does the bot not show all the roles or no-xp channels in its tables?',
    desc: 'If you have many roles or no-xp channels you will notice that commands like ar!info roles doesn\'t show all that you set. That is because there is more that one page, you will need to do ar!info roles 2 for watch the page number 2.',
  },
  {
    title: 'Why can\'t the bot find roles or channels i use in the commands?',
    desc: 'If you try specify roles or channels in commands (f.e. in the assignrole command) you have to make sure, that you don\'t mention the role or channel, but only type out its name. This means don\'t use an @ or # to specify roles or channels. The reason for this is that not all are mentionable. You can use the info commands for verifying your settings (f.e. the info roles command). If the problem continues, we recommend to try it with a simple test name, or check the help command to find out how you add them by id.',
  }
]
