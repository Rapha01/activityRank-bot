const { EmbedBuilder, PermissionFlagsBits } = require("discord.js");
const { stripIndent } = require("common-tags");
const guildModel = require("../../models/guild/guildModel.js");

module.exports.execute = async function (i) {
  if (!i.member.permissionsIn(i.channel).has(PermissionFlagsBits.ManageGuild)) {
    return await i.reply({
      content:
        "You need the permission to manage the server in order to use this command.",
      ephemeral: true,
    });
  }
  const items = {
    xpPerTextMessage: i.options.getInteger("message"),
    xpPerVoiceMinute: i.options.getInteger("voiceminute"),
    xpPerVote: i.options.getInteger("vote"),
    xpPerInvite: i.options.getInteger("invite"),
  };
  if (Object.values(items).every((x) => x === null)) {
    return await i.reply({
      content:
        "You must specify at least one option for this command to do anything!",
      ephemeral: true,
    });
  }

  for (const k in items)
    if (items[k] !== null) await guildModel.storage.set(i.guild, k, items[k]);
  await i.reply({
    embeds: [
      new EmbedBuilder().setAuthor({ name: "XP Values" }).setColor(0x00ae86)
        .setDescription(stripIndent`
      Modified XP Values! New values:

      \`${i.guild.appData.xpPerTextMessage} xp\` per text message
      \`${i.guild.appData.xpPerVoiceMinute} xp\` per minute in VC
      \`${i.guild.appData.xpPerVote} xp\` per vote
      \`${i.guild.appData.xpPerInvite} xp\` per invite
      `),
    ],
    ephemeral: true,
  });
};
