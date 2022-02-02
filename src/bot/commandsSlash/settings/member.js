const guildMemberModel = require('../../models/guild/guildMemberModel.js');
const { MessageEmbed, MessageActionRow, MessageButton } = require('discord.js');

const fields = [
  // form: ['Stylized', 'internal', 'description']
  [
    'Recieve levelup messages by DM',
    'notifyLevelupDm',
    'Whether or not to recieve levelup messages via DM, if the server has enabled it.',
  ], [
    'Vote by Reaction',
    'reactionVote',
    'If you wish to be able to vote by reaction, assuming the guild has enabled it.',
  ],
];

const _bool = {
  0: 'DANGER',
  1: 'SUCCESS',
};

const e = new MessageEmbed()
  .setAuthor({
    name: 'Member Settings',
    iconURL: 'attachment://cog.png',
  })
  .setColor(0x00AE86);

module.exports.execute = async (i) => {
  await guildMemberModel.cache.load(i.member);
  const myGuildMember = await guildMemberModel.storage.get(i.guild, i.member.id);

  const row = new MessageActionRow();

  for (const field of fields) {
    if (row.components.length >= 5) break;
    row.addComponents(new MessageButton()
      .setLabel(field[0])
      .setStyle(_bool[myGuildMember[field[1]]])
      .setCustomId(`commandsSlash/settings.js m ${i.member.id} ${field[1]}`))
  }

  const msg = await i.reply({
    embeds: [e],
    components: [row],
    files: ['./bot/const/img/cog.png'],
    fetchReply: true,
  });
  setTimeout(() => {
    await msg.delete().catch();
  }, 60000);
};

module.exports.component = async (i) => {
  const data = i.customId.split(' ');
  data.shift();
  data.shift();
  if (i.member.id !== data[0]) return await i.deferReply()

  await guildMemberModel.cache.load(i.member);
  const myGuildMember = await guildMemberModel.storage.get(i.guild, i.member.id);

  let res;
  myGuildMember[data[1]] ? res = 0 : res = 1;
  await guildMemberModel.storage.set(i.guild, i.member.id, data[1], res);

  const row = i.message.components[0];
  const comp = row.components.find(element => element.customId == i.customId)
  comp.setStyle(_bool[res]);
  i.update({components: [row]})
}