const userModel = require("../../../models/userModel.js");
const guildModel = require("../../../models/guild/guildModel.js");
const guildMemberModel = require("../../../models/guild/guildMemberModel.js");
const { oneLine } = require("common-tags");

module.exports.execute = async (i) => {
  await userModel.cache.load(i.user);
  const myUser = await userModel.storage.get(i.user);

  const value = i.options.getInteger("tokens");

  if (myUser.tokens < value) {
    return await i.reply({
      content: `You have less tokens than you want to add to this server. You have and can only add ${myUser.tokens} currently. Use \`/token get\` to get more!`,
      ephemeral: true,
    });
  }

  await userModel.storage.increment(i.user, "tokens", -value);

  await guildMemberModel.storage.increment(
    i.guild,
    i.member.id,
    "tokensBurned",
    value
  );
  await guildModel.storage.increment(i.guild, "tokens", value);

  await i.reply({
    content: oneLine`Successfully powered tokens into this servers bot.
    Thank you for supporting this server and the development of ActivityRank!`,
    ephemeral: true,
  });
};
