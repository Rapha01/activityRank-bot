import { AttachmentBuilder, type InteractionReplyOptions } from 'discord.js';
import { command } from '#bot/commands.js';
import { RESET_JOBS, RESET_QUEUE } from '#bot/models/resetModel.js';
import { HELPSTAFF_ONLY } from '#bot/util/predicates.js';

export default command({
  predicate: HELPSTAFF_ONLY,
  name: 'reset-jobs',
  async execute({ interaction, options }) {
    const useFull = options.full ?? false;
    const search = options.search;

    let content: string;
    if (search) {
      const job = [...RESET_JOBS].find((job) => job.guild.id === search);
      content = `**Reset information: **${job ? JSON.stringify({ ...job, guild: search }, null, 2) : '`No job running in guild`'}`;
    } else {
      content = `${RESET_QUEUE.remaining} remaining jobs in queue. ${RESET_JOBS.size} cached jobs.\n`;
    }

    const res: InteractionReplyOptions = { content, ephemeral: options.eph ?? false };

    if (useFull) {
      res.files = [
        new AttachmentBuilder(Buffer.from(JSON.stringify([...RESET_JOBS], null, 2), 'utf8'), {
          name: 'reset-jobs.json',
        }),
      ];
    }

    await interaction.reply(res);
  },
});
