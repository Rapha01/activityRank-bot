/* 
  Code adapted from @sapphiredev (code owned by @favna), under the *Unlicense*
  https://github.com/sapphiredev/examples/blob/main/examples/with-typescript-complete/src/commands/General/eval.ts
 */

import { inspect } from 'node:util';
import { codeBlock } from 'discord.js';
import { outdent } from 'outdent';
import { command } from '#bot/commands.js';
import { DEVELOPER_ONLY } from '#bot/util/predicates.js';

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

    const serverId = options['server-id'];
    if (serverId && !/^\d{17,20}$/.test(serverId)) {
      await interaction.reply({ content: 'Invalid ID provided to `server-id`.', ephemeral: true });
      return;
    }

    const ephemeral = !options.visible;
    await interaction.deferReply({ ephemeral });

    let code = options.eval;
    const async = options.async ?? serverId !== undefined ?? false;

    if (async) {
      code = outdent`
        (async () => {\n
          ${code}\n
        })();`;
    } else if (serverId) {
      code = outdent`
        (async () => {
          const res = await this.client.shard.broadcastEval(async c => {
            if (!c.shard.client.guilds.cache.has("${serverId}")) {
              return null;
            } else {
              ${code}
            }
          });
          return res.find(d => d !== null);
        })();`;
    }

    const depth = options.depth ?? 3;
    const showHidden = options['show-hidden'] ?? false;

    let success = true;
    let result = null;

    console.log('Eval used\n\n', code, '\n\n');

    try {
      // add context to eval (accessed via `this`)
      const ctx = { interaction, client: interaction.client };

      // biome-ignore lint/security/noGlobalEval: necessary
      result = await eval.call(ctx, code);
    } catch (err) {
      if (err && err instanceof Error && err.stack) {
        console.error('Error found in eval command:\n', err);
      }
      result = err;
      success = false;
    }

    if (typeof result !== 'string') {
      result = inspect(result, { depth, showHidden, numericSeparator: true });
    }

    if (result.length > 1950) {
      await interaction.followUp({
        content: 'Output was too long. Result sent as a file.',
        files: [{ attachment: Buffer.from(result), name: success ? 'output.js' : 'error.txt' }],
      });
    } else {
      await interaction.followUp({
        content: success ? codeBlock('js', result) : `**ERROR**: ${codeBlock(result)}`,
      });
    }
  },
});
