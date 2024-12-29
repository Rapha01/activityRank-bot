import { command, permissions } from '#bot/util/registry/command.js';
import { HELPSTAFF_ONLY } from '#bot/util/predicates.js';
import {
  AttachmentBuilder,
  ApplicationCommandOptionType,
  type InteractionReplyOptions,
} from 'discord.js';
import { RESET_JOBS, RESET_QUEUE } from '#bot/models/resetModel.js';

export default command.basic({
  deploymentMode: 'LOCAL_ONLY',
  predicate: HELPSTAFF_ONLY,
  data: {
    name: 'reset-jobs',
    description: 'Check the status of active reset jobs',
    default_member_permissions: permissions(permissions.ModerateMembers),
    options: [
      {
        name: 'full',
        description: 'Send the full contents of resetJobs',
        type: ApplicationCommandOptionType.Boolean,
      },
      {
        name: 'eph',
        description: 'Send as an ephemeral message',
        type: ApplicationCommandOptionType.Boolean,
      },
      {
        name: 'search',
        description: 'Get the current reset of the specified guild ID',
        type: ApplicationCommandOptionType.String,
        min_length: 17,
        max_length: 20,
      },
    ],
  },
  async execute({ interaction }) {
    const useFull = interaction.options.getBoolean('full') ?? false;
    const search = interaction.options.getString('search');
    let content: string;
    if (search) {
      const job = [...RESET_JOBS].find((job) => job.guild.id === search);
      content =
        `**Reset information: **${job ? JSON.stringify({ ...job, guild: search }, null, 2) : '`No job running in guild`'}`;
    } else {
      content = `${RESET_QUEUE.remaining} remaining jobs in queue. ${RESET_JOBS.size} cached jobs.\n`;
    }

    const res: InteractionReplyOptions = {
      content,
      ephemeral: interaction.options.getBoolean('eph') ?? false,
    };

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
