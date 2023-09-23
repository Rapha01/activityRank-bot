import { registerSlashCommand } from 'bot/util/commandLoader.js';
import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { createRequire } from 'node:module';
const commands: { old: string; desc: string; new: string }[] = createRequire(import.meta.url)(
  '../temp/const/commands.json',
);

registerSlashCommand({
  data: new SlashCommandBuilder()
    .setName('migrate')
    .setDescription('Look up the new equivalent of a command!')
    .addStringOption((o) =>
      o
        .setName('command')
        .setDescription('The command to look up')
        .setRequired(true)
        .setAutocomplete(true),
    ),
  execute: async function (i) {
    const opt = i.options.getString('command')!.trim();
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
            { name: 'Replacement', value: cmd.new },
          )
          .setColor(0x00ae86),
      ],
    });
  },
  executeAutocomplete: async function (i) {
    let cmds = commands.map((o) => o.old.trim());
    const focused = i.options.getFocused().trim().replace('ar!', '');

    i.respond(
      cmds
        .filter((o) => o.includes(focused))
        .map((o) => ({ name: `ar!${o}`, value: o }))
        .slice(0, 25),
    );
  },
});