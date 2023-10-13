import { registerSlashCommand } from 'bot/util/commandLoader.js';
import { SlashCommandBuilder } from 'discord.js';

registerSlashCommand({
  data: new SlashCommandBuilder()
    .setName('config-server')
    .setDescription("Change your server's settings!")
    .addSubcommand((sc) =>
      sc
        .setName('bonus')
        .setDescription('Set your bonusTag and emote')
        .addStringOption((o) => o.setName('tag').setDescription('The bonusTag to set'))
        .addStringOption((o) => o.setName('emote').setDescription('The bonusEmote to set')),
    )
    .addSubcommand((sc) =>
      sc
        .setName('vote')
        .setDescription('Set your voteTag and emote')
        .addStringOption((o) => o.setName('tag').setDescription('The voteTag to set'))
        .addStringOption((o) => o.setName('emote').setDescription('The voteEmote to set')),
    )
    .addSubcommand((sc) =>
      sc
        .setName('entries-per-page')
        .setDescription('Set the number of entries per page in embeds sent by the bot')
        .addIntegerOption((o) =>
          o
            .setName('value')
            .setDescription('The number of entries per page')
            .setMinValue(4)
            .setMaxValue(20)
            .setRequired(true),
        ),
    )
    .addSubcommand((sc) =>
      sc
        .setName('cooldown')
        .setDescription('Changes the message and vote cooldowns')
        .addIntegerOption((o) =>
          o
            .setName('message')
            .setDescription('The time between messages counting for XP')
            .setMinValue(0)
            .setMaxValue(120)
            .setAutocomplete(true),
        )
        .addIntegerOption((o) =>
          o
            .setName('vote')
            .setDescription('The time to wait before a member can vote again')
            .setMinValue(180)
            .setMaxValue(86400)
            .setAutocomplete(true),
        ),
    )
    .addSubcommand((sc) => sc.setName('set').setDescription('Open a button menu to configure')),
});
