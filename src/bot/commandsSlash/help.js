const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed, MessageActionRow, MessageSelectMenu, MessageButton } = require('discord.js');
const { stripIndent } = require('common-tags');
const { supportServerInviteLink } = require('../../const/config');


module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Shows information for operating the bot'),
  async execute(i) {
    const helpEmbed = helpMainEmbed(i.guild, i.client.appData.texts.commands);
    await i.reply({ embeds:[helpEmbed], components: [
      new MessageActionRow().addComponents(
        new MessageSelectMenu()
          .setCustomId('commandsSlash/help.js select')
          .setPlaceholder('Nothing selected')
          .addOptions([
            { label: 'Server Statistics', value: 'stats', emoji: '' },
            { label: 'Voting and Inviting', value: 'voting', emoji: '' },
            { label: 'Configuration Info', value: 'info', emoji: '' },
            { label: 'Tokens', value: 'token', emoji: '' },
            { label: 'Personal Settings', value: 'mysettings', emoji: '' },
            { label: 'FAQ and Patchnotes', value: 'other', emoji: '' },
            { label: 'Server Settings', value: 'serverSettings', emoji: '' },
            { label: 'XP Settings', value: 'xpSettings', emoji: '' },
            { label: 'Bonus XP', value: 'bonusxp', emoji: '' },
            { label: 'Role autoassignments', value: 'roleAssignments', emoji: '' },
            { label: 'Autopost messages', value: 'autopost', emoji: '' },
            { label: 'Resets', value: 'reset', emoji: '' },
          ]),
      ),
      new MessageActionRow().addComponents(
        new MessageButton()
          .setCustomId('commandsSlash/help.js closeMenu')
          .setLabel('Close')
          .setStyle('DANGER'),
      ),
    ] });
  },
  async component(i) {
    const type = i.customId.split(' ')[1];
    if (type === 'closeMenu') {
      i.message.delete();
    } else if (type === 'select') {
      let e = i.message.embeds[0];
      e = helpFeatureEmbed(i.guild, i.client.appData.texts.commands[i.values[0]]);
      i.update({ embeds:[e] });
    }
  },
};


function helpMainEmbed(guild, sections) {
  const embed = new MessageEmbed()
    .setAuthor({ name: 'ActivityRank Manual' })
    .setColor(0x00AE86)
    .setDescription(stripIndent`
      **[Website](https://activityrank.me/commands)**
      **[Support Server](${supportServerInviteLink})**
      By using this bot you accept the **[terms and conditions](https://activityrank.me/termsandconditions)**.`);

  for (const command in sections)
    embed.addField(`***${sections[command].title}***`, sections[command].desc);

  return embed;
}

function helpFeatureEmbed(guild, section) {
  const embed = new MessageEmbed()
    .setColor(0x00AE86)
    .setTitle(`**Manual - ${section.title}**`)
    .setDescription(section.subdesc);

  for (const command of section.subcommands) {
    embed.addField(
      `${command.title}\n${command.command.replace(/<prefix>/g, guild.appData.prefix)}`,
      `${command.desc}\nex.: \`\`${command.example.replace(/<prefix>/g, guild.appData.prefix)}\`\``,
    );
  }
  return embed;
}