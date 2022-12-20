const { SlashCommandBuilder } = require('discord.js');

module.exports.data = new SlashCommandBuilder()
  .setName('config-xp')
  .setDescription("Change your server's XP settings!")
  .addSubcommand((sc) =>
    sc
      .setName('levelfactor')
      .setDescription('Set the levelfactor')
      .addIntegerOption((o) =>
        o
          .setName('levelfactor')
          .setDescription('The levelfactor to use in the server')
          .setMinValue(20)
          .setMaxValue(400)
          .setRequired(true)
      )
  )
  .addSubcommand((sc) =>
    sc
      .setName('xp-per')
      .setDescription('Set the amount of XP gained')
      .addIntegerOption((o) =>
        o
          .setName('message')
          .setDescription('The amount of XP gained per message sent')
          .setMinValue(0)
          .setMaxValue(10)
      )
      .addIntegerOption((o) =>
        o
          .setName('voiceminute')
          .setDescription('The amount of XP gained per minute spent in VC')
          .setMinValue(0)
          .setMaxValue(5)
      )
      .addIntegerOption((o) =>
        o
          .setName('vote')
          .setDescription('The amount of XP gained per upvote')
          .setMinValue(0)
          .setMaxValue(100)
      )
      .addIntegerOption((o) =>
        o
          .setName('invite')
          .setDescription('The amount of XP gained per invitation')
          .setMinValue(0)
          .setMaxValue(1000)
      )
  )
  .addSubcommand((sc) =>
    sc
      .setName('bonus-xp-per')
      .setDescription('Set the amount of bonus XP gained')
      .addIntegerOption((o) =>
        o
          .setName('message')
          .setDescription(
            'The amount of XP gained per message sent during bonustime'
          )
          .setMinValue(0)
          .setMaxValue(20)
      )
      .addIntegerOption((o) =>
        o
          .setName('voiceminute')
          .setDescription(
            'The amount of XP gained per minute spent in VC during bonustime'
          )
          .setMinValue(0)
          .setMaxValue(10)
      )
      .addIntegerOption((o) =>
        o
          .setName('vote')
          .setDescription('The amount of XP gained per upvote during bonustime')
          .setMinValue(0)
          .setMaxValue(100)
      )
      .addIntegerOption((o) =>
        o
          .setName('invite')
          .setDescription(
            'The amount of XP gained per invitation during bonustime'
          )
          .setMinValue(0)
          .setMaxValue(2000)
      )
  )
  .addSubcommand((sc) =>
    sc
      .setName('bonustime')
      .setDescription('Starts bonustime for the specified duration')
      .addIntegerOption((o) =>
        o
          .setName('time')
          .setDescription('The time for the bonus time to last, in minutes')
          .setMinValue(0)
          .setMaxValue(4320)
          .setRequired(true)
          .setAutocomplete(true)
      )
  );
