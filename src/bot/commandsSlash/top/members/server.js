const { sendMembersEmbed } = require("../../top");

module.exports.execute = async (i) => {
  if (i.options.getString("type"))
    return await sendMembersEmbed(i, i.options.getString("type"));
  await sendMembersEmbed(i, "totalScore");
};
