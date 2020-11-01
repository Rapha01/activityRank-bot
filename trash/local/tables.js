module.exports = {
  guild: {
    type: 'settings',
    backupbatchsize: 10,
    priority:1,
  },
  guildmember: {
    type: 'settings',
    backupbatchsize: 200,
    priority:1,
  },
  guildchannel: {
    type: 'settings',
    backupbatchsize: 100,
    priority:1,
  },
  guildrole: {
    type: 'settings',
    backupbatchsize: 100,
    priority:1,
  },
  textmessage: {
    type: 'stats',
    backupbatchsize: 300,
    priority:0,
  },
  voiceminute: {
    type: 'stats',
    backupbatchsize: 300,
    priority:0,
  },
  vote: {
    type: 'stats',
    backupbatchsize: 300,
    priority:0,
  },
  bonus: {
    type: 'stats',
    backupbatchsize: 300,
    priority:0,
  },
  command: {
    type: 'stats',
    backupbatchsize: 300,
    priority:0,
  },
};
