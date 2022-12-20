const { PermissionFlagsBits } = require("discord.js");
const guildModel = require("../../models/guild/guildModel");

module.exports.execute = async function (i) {
  if (!i.member.permissionsIn(i.channel).has(PermissionFlagsBits.ManageGuild)) {
    return await i.reply({
      content:
        "You need the permission to manage the server in order to use this command.",
      ephemeral: true,
    });
  }
  const endsAt = Math.floor(
    Date.now() / 1000 + i.options.getInteger("time") * 60
  );
  await guildModel.storage.set(i.guild, "bonusUntilDate", endsAt);
  await await i.reply({
    content: `Bonus time has started! It will end <t:${endsAt}:R>.`,
  });
};

module.exports.autocomplete = async (i) => {
  i.respond([
    { name: "End Now", value: 0 },
    { name: "1 hour", value: 60 },
    { name: "3 hours", value: 180 },
    { name: "12 hours", value: 720 },
    { name: "1 day", value: 1440 },
    { name: "2 days", value: 2880 },
    { name: "3 days", value: 4320 },
  ]);
};
