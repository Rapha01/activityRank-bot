/* 
  Code adapted from @sapphiredev (code owned by @favna), under the *Unlicense*
  https://github.com/sapphiredev/examples/blob/main/examples/with-typescript-complete/src/commands/General/eval.ts
 */

import { command } from '#bot/commands.js';
import { DEVELOPER_ONLY } from '#bot/util/predicates.js';
import { inspect } from 'node:util';
import { codeBlock } from 'discord.js';

export default command({
  predicate: DEVELOPER_ONLY,
  name: 'eval',
  async execute({ interaction, options }) {
    if (!['370650814223482880', '774660568728469585'].includes(interaction.user.id)) {
      // sanity check
      console.log(`!!! Unauthorized use of /eval command by ${interaction.user.id}`, {
        interaction,
      });
      process.exit(1);
    }

    const visible = options.visible ?? false;

    await interaction.deferReply({ ephemeral: !visible });

    let code = options.eval;
    const async = options.async ?? false;
    if (async) code = `(async () => {\n${code}\n})();`;

    const depth = options.depth ?? 3;
    const showHidden = options['show-hidden'] ?? false;

    let success = true;
    let result = null;

    console.log('Eval used\n\n', code, '\n\n');

    try {
      // add context to eval (accessed via `this`)
      const ctx = { interaction, client: interaction.client };

      // biome-ignore lint/security/noGlobalEval: necessary
      result = ((str: string) => eval(str)).call(ctx, code);
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
        content: 'Output was too long. Result sent as a file.',
        files: [{ attachment: Buffer.from(output), name: 'output.js' }],
      });
      return;
    }

    await interaction.followUp({ content: output });
  },
});
