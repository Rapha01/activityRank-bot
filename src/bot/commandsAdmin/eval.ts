/* 
  Code adapted from @sapphiredev (code owned by @favna), under the *Unlicense*
  https://github.com/sapphiredev/examples/blob/main/examples/with-typescript-complete/src/commands/General/eval.ts
 */
import { SlashCommandBuilder, codeBlock } from 'discord.js';
import { registerAdminCommand } from 'bot/util/commandLoader.js';
import { PrivilegeLevel } from 'const/config.js';
import { inspect } from 'util';

registerAdminCommand({
  data: new SlashCommandBuilder()
    .setName('eval')
    .setDescription("Evaluates an arbitrary script in the shard's environment.")
    .addStringOption((o) =>
      o.setName('eval').setDescription('The code to evaluate').setMinLength(1).setRequired(true),
    )
    .addBooleanOption((o) =>
      o.setName('async').setDescription('Whether to evaluate the code in an async context'),
    )
    .addIntegerOption((o) =>
      o
        .setName('depth')
        .setDescription('How deep to recurse when inspecting the result')
        .setMinValue(0)
        .setMaxValue(10),
    )
    .addBooleanOption((o) =>
      o
        .setName('show-hidden')
        .setDescription('Whether or not to show hidden properties when inspecting the result'),
    )
    .addBooleanOption((o) =>
      o.setName('visible').setDescription('Whether the result should be non-ephemeral'),
    )
    .setDefaultMemberPermissions('0'),
  requiredPrivilege: PrivilegeLevel.Developer,
  execute: async function (interaction) {
    if (!['370650814223482880', '774660568728469585'].includes(interaction.user.id)) {
      // sanity check
      console.log(`!!! Unauthorized use of /eval command by ${interaction.user.id}`);
      process.exit(1);
      return;
    }

    const visible = interaction.options.getBoolean('visible') ?? false;

    await interaction.deferReply({ ephemeral: !visible });

    let code = interaction.options.getString('eval', true);
    const async = interaction.options.getBoolean('async') ?? false;
    if (async) code = `(async () => {\n${code}\n})();`;

    const depth = interaction.options.getInteger('depth') ?? 3;
    const showHidden = interaction.options.getBoolean('show-hidden') ?? false;

    let success = true;
    let result = null;

    console.log('Eval used\n\n', code, '\n\n');

    try {
      result = eval(code);
    } catch (err) {
      if (err && err instanceof Error && err.stack) {
        console.error('Error found in eval command', err);
      }
      result = err;
      success = false;
    }

    result = await Promise.resolve(result);

    if (typeof result !== 'string') {
      result = inspect(result, { depth, showHidden });
    }

    const output = success ? codeBlock('js', result) : `**ERROR**: ${codeBlock('bash', result)}`;

    if (output.length > 2000) {
      await interaction.followUp({
        content: `Output was too long. Result sent as a file.`,
        files: [{ attachment: Buffer.from(output), name: 'output.js' }],
      });
      return;
    }

    await interaction.followUp({ content: output });
  },
});
