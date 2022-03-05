const { sendMembersEmbed } = require('../top');

module.exports.execute = async (i) => {
  sendMembersEmbed(i, 'invite');
};