const guildMemberModel = require("../../../models/guild/guildMemberModel.js");
const guildModel = require("../../../models/guild/guildModel.js");
const rankModel = require("../../../models/rankModel.js");
const fct = require("../../../../util/fct.js");
const cooldownUtil = require("../../../util/cooldownUtil.js");
const nameUtil = require("../../../util/nameUtil.js");
const { EmbedBuilder, ChannelType } = require("discord.js");

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

  if (!(await cooldownUtil.checkStatCommandsCooldown(i))) return;
  const channel = await i.options.getChannel("channel");

  let type;
  if (channel.type === ChannelType.GuildVoice) type = "voiceMinute";
  else type = "textMessage";

  const page = fct.extractPageSimple(
    i.options.getInteger("page") || 1,
    guild.entriesPerPage
  );
  const time = i.options.getString("period") || "Alltime";

  const header = `Toplist for channel ${channel.name} from ${page.from} to ${page.to} | ${_prettifyTime[time]}`;

  const channelMemberRanks = await rankModel.getChannelMemberRanks(
    i.guild,
    channel.id,
    type,
    time,
    page.from,
    page.to
  );
  if (!channelMemberRanks || channelMemberRanks.length == 0) {
    return await i.editReply({
      content: "No entries found for this page.",
      ephemeral: true,
    });
  }
  await nameUtil.addGuildMemberNamesToRanks(i.guild, channelMemberRanks);

  const e = new EmbedBuilder().setTitle(header).setColor("#4fd6c8");

  if (guild.bonusUntilDate > Date.now() / 1000) {
    e.setDescription(
      `**!! Bonus XP Active !!** (${
        Math.round(
          ((guild.bonusUntilDate - Date.now() / 1000) / 60 / 60) * 10
        ) / 10
      }h left) \n`
    );
  }
  if (i.client.appData.settings.footer)
    e.setFooter({ text: i.client.appData.settings.footer });

  let str = "",
    guildMemberName;
  for (let iter = 0; iter < channelMemberRanks.length; iter++) {
    if (type == "voiceMinute")
      str =
        ":microphone2: " +
        Math.round((channelMemberRanks[iter][time] / 60) * 10) / 10;
    else str = ":writing_hand: " + channelMemberRanks[iter][time];

    guildMemberName = (
      await nameUtil.getGuildMemberInfo(
        i.guild,
        channelMemberRanks[iter].userId
      )
    ).name;
    e.addFields({
      name: `#${page.from + iter}  ${guildMemberName}`,
      value: str,
      inline: true,
    });
  }

  await i.editReply({
    embeds: [e],
    ephemeral: true,
  });
};
