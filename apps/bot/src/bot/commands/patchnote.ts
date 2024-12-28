import { command } from '#bot/util/registry/command.js';
import { EmbedBuilder, ApplicationCommandOptionType } from 'discord.js';
import { getTexts } from '#models/managerDb/textModel.js';
import type { PatchnotesEntry, TextsPatchnotes } from '#models/types/external.js';

export default command.basic({
  data: {
    name: 'patchnote',
    description: 'Show patchnotes.',
    options: [
      {
        name: 'version',
        description: 'The specific version to show. Defaults to the latest version.',
        autocomplete: true,
        type: ApplicationCommandOptionType.String,
      },
    ],
  },
  async execute({ interaction }) {
    const version = interaction.options.getString('version');
    const { patchnotes } = await getTexts();

    const applicableVersions = patchnotes.map((note) => note.version);
    applicableVersions.push('latest');

    let embed: EmbedBuilder;

    if (!version || !applicableVersions.includes(version)) {
      embed = patchnotesMainEmbed(patchnotes);
    } else if (version == 'latest') {
      embed = patchnotesVersionEmbed(patchnotes[0]);
    } else {
      const matchPatchnote = (note: PatchnotesEntry): boolean =>
        note.version === version.toLowerCase();
      // applicableVersions.includes(version) has already been checked above; this `find()` cannot fail
      embed = patchnotesVersionEmbed(patchnotes.find(matchPatchnote)!);
    }

    await interaction.reply({ embeds: [embed] });
  },
  autocomplete: {
    async version({ interaction }) {
      const { patchnotes } = await getTexts();

      const focused = interaction.options.getFocused().replace('v', '').replace('.', '');
      const versions = [
        'latest',
        ...patchnotes
          .map((note) => note.version)
          .filter((version) => version.replace('.', '').includes(focused)),
      ].slice(0, 25);

      await interaction.respond(versions.map((o) => ({ name: o, value: o })));
    },
  },
});

function patchnotesMainEmbed(patchnotes: TextsPatchnotes) {
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

function patchnotesVersionEmbed(patchnote: PatchnotesEntry) {
  const embed = new EmbedBuilder()
    .setColor(0x00ae86)
    .setTitle(`**Patch ${patchnote.version} - ${patchnote.title} (${patchnote.date})**`);

  for (const feature of patchnote.features)
    embed.addFields({ name: feature.title, value: feature.description });

  for (const fix of patchnote.fixes) embed.addFields({ name: fix.title, value: fix.description });

  return embed;
}
