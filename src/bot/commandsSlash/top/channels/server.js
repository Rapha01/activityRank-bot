const guildMemberModel = require("../../../models/guild/guildMemberModel.js");
const guildModel = require("../../../models/guild/guildModel.js");
const rankModel = require("../../../models/rankModel.js");
const fct = require("../../../../util/fct.js");
const cooldownUtil = require("../../../util/cooldownUtil.js");
const nameUtil = require("../../../util/nameUtil.js");
const { EmbedBuilder } = require("discord.js");

const _prettifyTime = {
  Day: "Today",
  Week: "Past week",
  Month: "This month",
  Year: "This year",
  Alltime: "Forever",
};

module.exports.execute = async (i) => {
  await i.deferReply();
  await guildMemberModel.cache.load(i.member);
  const guild = await guildModel.storage.get(i.guild);

  if (!(await cooldownUtil.checkStatCommandsCooldown(i, i))) return;

  const page = fct.extractPageSimple(
    i.options.getInteger("page") || 1,
    guild.entriesPerPage
  );
  const time = i.options.getString("period") || "Alltime";
  const type = i.options.getString("type");

  const channelRanks = await rankModel.getChannelRanks(
    i.guild,
    type,
    time,
    page.from,
    page.to
  );
  if (!channelRanks || channelRanks.length == 0) {
    return await i.editReply({
      content: "No entries found for this page.",
      ephemeral: true,
    });
  }

  const e = new EmbedBuilder()
    .setTitle(
      `Toplist for server ${i.guild.name} ${
        type === "textMessage" ? "text channels" : "voice channels"
      } from ${page.from} to ${page.to} | ${_prettifyTime[time]}`
    )

    .setColor("#4fd6c8");

  if (i.client.appData.settings.footer)
    e.setFooter({ text: i.client.appData.settings.footer });

  let str = "";
  for (let iter = 0; iter < channelRanks.length; iter++) {
    if (type == "voiceMinute")
      str =
        ":microphone2: " +
        Math.round((channelRanks[iter][time] / 60) * 10) / 10;
    else if (type == "textMessage")
      str = ":writing_hand: " + channelRanks[iter][time];

    e.addFields({
      name: `#${page.from + iter}  ${nameUtil.getChannelName(
        i.guild.channels.cache,
        channelRanks[iter].channelId
      )}`,
      value: str,
    });
  }

  await i.editReply({
    embeds: [e],
    ephemeral: true,
  });
};
