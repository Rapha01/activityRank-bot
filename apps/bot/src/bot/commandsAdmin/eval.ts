/* 
  Code adapted from @sapphiredev (code owned by @favna), under the *Unlicense*
  https://github.com/sapphiredev/examples/blob/main/examples/with-typescript-complete/src/commands/General/eval.ts
 */

import { command, permissions } from '#bot/util/registry/command.js';
import { DEVELOPER_ONLY } from '#bot/util/predicates.js';
import { inspect } from 'node:util';
import { ApplicationCommandOptionType, codeBlock } from 'discord.js';

export default command.basic({
  predicate: DEVELOPER_ONLY,
  deploymentMode: 'LOCAL_ONLY',
  data: {
    name: 'eval',
    description: "Evaluates an arbitrary script in the shard's environment.",
    default_member_permissions: permissions(permissions.BanMembers),
    options: [
      {
        name: 'eval',
        description: 'The code to evaluate',
        required: true,
        type: ApplicationCommandOptionType.String,
      },
      {
        name: 'async',
        description: 'Whether to evaluate the code in an async context',
        type: ApplicationCommandOptionType.Boolean,
      },
      {
        name: 'depth',
        description: 'How deep to recurse when inspecting the result',
        max_value: 10,
        min_value: 0,
        type: ApplicationCommandOptionType.Integer,
      },
      {
        name: 'show-hidden',
        description: 'Whether or not to show hidden properties when inspecting the result',
        type: ApplicationCommandOptionType.Boolean,
      },
      {
        name: 'visible',
        description: 'Whether the result should be non-ephemeral',
        type: ApplicationCommandOptionType.Boolean,
      },
    ],
  },
  async execute({ interaction }) {
    if (!['370650814223482880', '774660568728469585'].includes(interaction.user.id)) {
      // sanity check
      console.log(`!!! Unauthorized use of /eval command by ${interaction.user.id}`, {
        interaction,
      });
      process.exit(1);
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
      // add context to eval (accessed via `this`)
      const ctx = { interaction, client: interaction.client };

      result = function (str: string) {
        return eval(str);
      }.call(ctx, code);
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
