import {
  SlashCommandBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
} from 'discord.js';
import { stripIndent } from 'common-tags';
import { supportServerInviteLink } from '../../const/config.js';
import { registerComponent, registerSlashCommand } from 'bot/util/commandLoader.js';
import type { TextsCommands, TextsEntry } from 'models/types/external.js';
import { getTexts } from 'models/managerDb/textModel.js';

registerSlashCommand({
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Shows information for operating the bot'),
  execute: async function (interaction) {
    const { commands } = await getTexts();
    const helpEmbed = helpMainEmbed(commands);
    await interaction.reply({
      embeds: [helpEmbed],
      components: [
        new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
          new StringSelectMenuBuilder()
            .setCustomId(selectId(null, { ownerId: interaction.user.id }))
            .setPlaceholder('Nothing selected')
            .addOptions([
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
            ] satisfies { label: string; value: keyof TextsCommands }[]),
        ),
        new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder()
            .setCustomId(closeId(null, { ownerId: interaction.user.id }))
            .setLabel('Close')
            .setStyle(ButtonStyle.Danger),
        ),
      ],
    });
  },
});

const selectId = registerComponent({
  identifier: 'help.sel',
  type: ComponentType.StringSelect,
  callback: async function (interaction) {
    let e = interaction.message.embeds[0].toJSON();
    const { commands } = await getTexts();
    e = helpFeatureEmbed(commands[interaction.values[0] as keyof TextsCommands]).toJSON();
    interaction.update({ embeds: [e] });
  },
});

const closeId = registerComponent({
  identifier: 'help.cls',
  type: ComponentType.Button,
  callback: async function (interaction) {
    await interaction.deferUpdate();
    await interaction.deleteReply();
  },
});

function helpMainEmbed(sections: TextsCommands) {
  const embed = new EmbedBuilder().setAuthor({ name: 'ActivityRank Manual' }).setColor(0x00ae86)
    .setDescription(stripIndent`
      **[Website](https://activityrank.me/commands)**
      **[Support Server](${supportServerInviteLink})**
      By using this bot you accept the **[terms and conditions](https://activityrank.me/termsandconditions)**.`);

  for (const _command in sections) {
    const command = _command as keyof TextsCommands;
    embed.addFields({
      name: `***${sections[command].title}***`,
      value: sections[command].desc,
    });
  }

  return embed;
}

function helpFeatureEmbed(section: TextsEntry) {
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
