const { SlashCommandBuilder } = require("discord.js");

module.exports.data = new SlashCommandBuilder()
  .setName("reset")
  .setDescription("Reset your server or members")
  .addSubcommand((sc) =>
    sc
      .setName("server")
      .setDescription("Reset server statistics")
      .addStringOption((o) =>
        o
          .setName("type")
          .setDescription("The type of reset to execute")
          .addChoices(
            { name: "Stats & Settings", value: "all" },
            { name: "All Statistics", value: "stats" },
            { name: "All Server Settings", value: "settings" },
            { name: "Text XP", value: "textstats" },
            { name: "Voice XP", value: "voicestats" },
            { name: "Invite XP", value: "invitestats" },
            { name: "Upvote XP", value: "votestats" },
            { name: "Bonus XP", value: "bonusstats" },
            {
              name: "Members no longer in the server",
              value: "deletedMembers",
            },
            { name: "Deleted channels", value: "deletedchannels" },
            { name: "Cancel Active Resets", value: "stop" }
          )
          .setRequired(true)
      )
  )
  .addSubcommand((sc) =>
    sc
      .setName("member")
      .setDescription("Reset a member")
      .addUserOption((o) =>
        o.setName("member").setDescription("The member to reset")
      )
      .addStringOption((o) =>
        o.setName("id").setDescription("The ID of the member to reset")
      )
  )
  .addSubcommand((sc) =>
    sc
      .setName("channel")
      .setDescription("Reset a channel")
      .addChannelOption((o) =>
        o.setName("channel").setDescription("The channel to reset")
      )
      .addStringOption((o) =>
        o.setName("id").setDescription("The ID of the channel to reset")
      )
  );
