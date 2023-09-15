import {
  SlashCommandBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
  MessageComponentInteraction,
} from 'discord.js';
import { stripIndent } from 'common-tags';
import { supportServerInviteLink } from '../../const/config.js';
import { registerComponent, registerSlashCommand } from 'bot/util/commandLoader.js';

registerSlashCommand({
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Shows information for operating the bot'),
  execute: async function (interaction) {
    const helpEmbed = helpMainEmbed(interaction.client.appData.texts.commands);
    await interaction.reply({
      embeds: [helpEmbed],
      components: [
        new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
          new StringSelectMenuBuilder()
            .setCustomId(`help select ${interaction.user.id}`)
            .setPlaceholder('Nothing selected')
            .addOptions(
              { label: 'Server Statistics', value: 'stats' },
              { label: 'Voting and Inviting', value: 'voting' },
              { label: 'Configuration Info', value: 'info' },
              { label: 'Personal Settings', value: 'mysettings' },
              { label: 'FAQ and Patchnotes', value: 'other' },
              { label: 'Server Settings', value: 'serverSettings' },
              { label: 'XP Settings', value: 'xpSettings' },
              { label: 'Bonus XP', value: 'bonusxp' },
              { label: 'Role autoassignments', value: 'roleAssignments' },
              { label: 'Resets', value: 'reset' },
            ),
        ),
        new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder()
            .setCustomId(`help closeMenu ${interaction.user.id}`)
            .setLabel('Close')
            .setStyle(ButtonStyle.Danger),
        ),
      ],
    });
  },
});

async function checkUserId(id: string | undefined, interaction: MessageComponentInteraction) {
  if (id !== interaction.user.id) {
    await interaction.reply({
      content: "Sorry, this menu isn't for you.",
      ephemeral: true,
    });
    return true;
  }
  return false;
}

registerComponent({
  identifier: 'help.sel',
  type: ComponentType.StringSelect,
  callback: async function (interaction, memberId) {
    if (await checkUserId(memberId, interaction)) return;

    let e = interaction.message.embeds[0].toJSON();
    e = helpFeatureEmbed(interaction.client.appData.texts.commands[interaction.values[0]]).toJSON();
    interaction.update({ embeds: [e] });
  },
});

registerComponent({
  identifier: 'help.cls',
  type: ComponentType.Button,
  callback: async function (interaction, memberId) {
    if (await checkUserId(memberId, interaction)) return;

    await interaction.deferUpdate();
    await interaction.deleteReply();
  },
});

interface HelpSection {
  title: string;
  desc: string;
  subdesc: string;
  subcommands: { title: string; example: string; desc: string; command: string }[];
}

function helpMainEmbed(sections: HelpSection[]) {
  const embed = new EmbedBuilder().setAuthor({ name: 'ActivityRank Manual' }).setColor(0x00ae86)
    .setDescription(stripIndent`
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

function helpFeatureEmbed(section: HelpSection) {
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
