const {
  SlashCommandBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require('discord.js');
const { stripIndent } = require('common-tags');
const { supportServerInviteLink } = require('../../const/config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Shows information for operating the bot'),
  async execute(i) {
    const helpEmbed = helpMainEmbed(i.guild, i.client.appData.texts.commands);
    await i.reply({
      embeds: [helpEmbed],
      components: [
        new ActionRowBuilder().addComponents(
          new StringSelectMenuBuilder()
            .setCustomId(`help select ${i.user.id}`)
            .setPlaceholder('Nothing selected')
            .addOptions(
              { label: 'Server Statistics', value: 'stats' },
              { label: 'Voting and Inviting', value: 'voting' },
              { label: 'Configuration Info', value: 'info' },
              { label: 'Tokens', value: 'token' },
              { label: 'Personal Settings', value: 'mysettings' },
              { label: 'FAQ and Patchnotes', value: 'other' },
              { label: 'Server Settings', value: 'serverSettings' },
              { label: 'XP Settings', value: 'xpSettings' },
              { label: 'Bonus XP', value: 'bonusxp' },
              { label: 'Role autoassignments', value: 'roleAssignments' },
              { label: 'Resets', value: 'reset' }
            )
        ),
        new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId(`help closeMenu ${i.user.id}`)
            .setLabel('Close')
            .setStyle(ButtonStyle.Danger)
        ),
      ],
    });
  },
  async component(i) {
    const [, type, memberId] = i.customId.split(' ');
    if (memberId !== i.member.id)
      return await i.reply({
        content: "Sorry, this menu isn't for you.",
        ephemeral: true,
      });
    if (type === 'closeMenu') {
      await i.deferUpdate();
      return await i.deleteReply();
    } else if (type === 'select') {
      let e = i.message.embeds[0];
      e = helpFeatureEmbed(
        i.guild,
        i.client.appData.texts.commands[i.values[0]]
      );
      i.update({ embeds: [e] });
    }
  },
};

function helpMainEmbed(guild, sections) {
  const embed = new EmbedBuilder()
    .setAuthor({ name: 'ActivityRank Manual' })
    .setColor(0x00ae86).setDescription(stripIndent`
      **[Website](https://activityrank.me/commands)**
      **[Support Server](${supportServerInviteLink})**
      By using this bot you accept the **[terms and conditions](https://activityrank.me/termsandconditions)**.`);

  for (const command in sections)
    embed.addFields({
      name: `***${sections[command].title}***`,
      value: sections[command].desc,
    });

  return embed;
}

function helpFeatureEmbed(guild, section) {
  const embed = new EmbedBuilder()
    .setColor(0x00ae86)
    .setTitle(`**Manual - ${section.title}**`)
    .setDescription(section.subdesc);

  for (const command of section.subcommands) {
    embed.addFields({
      name: `${command.title}\n${command.command}`,
      value: `${command.desc}\nex.: \`\`${command.example}\`\``,
    });
  }
  return embed;
}
