const { sendMembersEmbed } = require('../../top');

module.exports.execute = async (i) => {
  if (i.options.getString('type'))
    return sendMembersEmbed(i, i.options.getString('type'));
  sendMembersEmbed(i, 'totalScore');
};