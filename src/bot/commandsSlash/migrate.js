import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import commands from '../temp/const/commands';

export const data = new SlashCommandBuilder()
  .setName('migrate')
  .setDescription('Look up the new equivalent of a command!')
  .addStringOption((o) =>
    o
      .setName('command')
      .setDescription('The command to look up')
      .setRequired(true)
      .setAutocomplete(true)
  );

export const execute = async function (i) {
  const opt = i.options.getString('command').trim();
  let cmd = null;
  cmd = commands.find((o) => o.old === opt);

  if (!cmd) {
    return await i.reply({
      content:
        "Could not find this command! Be sure you've selected one of the autocomplete options.",
      ephemeral: true,
    });
  }
  await i.reply({
    embeds: [
      new EmbedBuilder()
        .setAuthor({ name: 'ar!' + cmd.old })
        .addFields(
          { name: 'Description', value: cmd.desc },
          { name: 'Replacement', value: cmd.new }
        )
        .setColor(0x00ae86),
    ],
  });
};

export const autocomplete = async function (i) {
  let cmds = commands.map((o) => o.old.trim());
  const focused = i.options.getFocused().trim().replace('ar!', '');
  cmds = cmds.filter((o) => o.includes(focused));
  cmds = cmds.map((o) => ({ name: 'ar!' + o, value: o }));
  i.respond(cmds.slice(0, 25));
};


// GENERATED: start of generated content by `exports-to-default`.
// [GENERATED: exports-to-default:v0]

export default {
    data,
    execute,
    autocomplete,
}

// GENERATED: end of generated content by `exports-to-default`.

