import { registerSlashCommand } from 'bot/util/commandLoader.js';
import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

registerSlashCommand({
  data: new SlashCommandBuilder()
    .setName('patchnote')
    .setDescription('Show patchnotes. Omit the version parameter to see a generalized list.')
    .addStringOption((o) =>
      o
        .setName('version')
        .setDescription('The specific version to show. Defaults to the latest version.')
        .setAutocomplete(true),
    ),
  execute: async (interaction) => {
    const version = interaction.options.getString('version');
    const patchnotes = interaction.client.appData.texts.patchnotes;
    const applicableVersions = patchnotes.map((o) => o.version);
    applicableVersions.push('latest');
    let e;

    if (!applicableVersions.includes(version) || !version) e = patchnotesMainEmbed(patchnotes);
    else if (version == 'latest') e = patchnotesVersionEmbed(patchnotes[0]);
    else e = patchnotesVersionEmbed(patchnotes.find((o) => o.version == version.toLowerCase()));

    await interaction.reply({ embeds: [e] });
  },
  executeAutocomplete: async (interaction) => {
    let patchnoteVersions = interaction.client.appData.texts.patchnotes.map((o) => o.version);
    const focused = interaction.options.getFocused().replace('v', '').replace('.', '');

    patchnoteVersions = patchnoteVersions.filter((o) => o.replace('.', '').includes(focused));

    patchnoteVersions.push('latest');
    patchnoteVersions = patchnoteVersions.map((o) => ({ name: o, value: o }));

    interaction.respond(patchnoteVersions);
  },
});

function patchnotesMainEmbed(patchnotes) {
  const embed = new EmbedBuilder()
    .setTitle('**ActivityRank Patchnotes**')
    .setColor(0x00ae86)
    .setDescription("Check what's going on with ActivityRank.");

  for (const patchnote of patchnotes)
    embed.addFields({
      name: `Patch ${patchnote.version} - ${patchnote.title} (${patchnote.date})`,
      value: patchnote.desc,
    });

  return embed;
}

function patchnotesVersionEmbed(patchnote) {
  const embed = new EmbedBuilder()
    .setColor(0x00ae86)
    .setTitle(`**Patch ${patchnote.version} - ${patchnote.title} (${patchnote.date})**`);

  for (const feature of patchnote.features)
    embed.addFields({ name: feature.title, value: feature.desc });

  for (const fix of patchnote.fixes) embed.addFields({ name: fix.title, value: fix.desc });

  return embed;
}
