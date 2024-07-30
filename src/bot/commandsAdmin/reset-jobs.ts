import { command, permissions } from 'bot/util/registry/command.js';
import { HELPSTAFF_ONLY } from 'bot/util/predicates.js';
import {
  AttachmentBuilder,
  ApplicationCommandOptionType,
  type InteractionReplyOptions,
} from 'discord.js';
import resetModel from '../models/resetModel.js';

export default command.basic({
  developmentOnly: true,
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
  async execute({ interaction, client }) {
    const useFull = interaction.options.getBoolean('full') ?? false;
    const search = interaction.options.getString('search');
    let content;
    if (search) {
      content = '**Reset information: **' + (resetModel.resetJobs[search] ?? '`No current job`');
    } else {
      const types = [
        'guildMembersStats',
        'guildChannelsStats',
        'all',
        'stats',
        'settings',
        'textstats',
        'voicestats',
        'invitestats',
        'votestats',
        'bonusstats',
      ];

      const typeDisplay = types
        .map(
          (t) =>
            `- ${t}: ${Object.values(resetModel.resetJobs).reduce(
              (p, c) => (c.type === t ? ++p : p),
              0,
            )}`,
        )
        .join('\n');

      content = `Length: ${Object.keys(resetModel.resetJobs).length}\nTypes:\n${typeDisplay}`;
    }

    const res: InteractionReplyOptions = {
      content,
      ephemeral: interaction.options.getBoolean('eph') ?? false,
    };

    if (useFull) {
      res.files = [
        new AttachmentBuilder(Buffer.from(JSON.stringify(resetModel.resetJobs, null, 2), 'utf8'), {
          name: 'logs.json',
        }),
      ];
    }

    await interaction.reply(res);
  },
});
