import { SlashCommandBuilder, PermissionFlagsBits, AttachmentBuilder } from 'discord.js';
import { PRIVILEGE_LEVELS } from '../../const/privilegedUsers';
import resetModel from '../models/resetModel';

export const requiredPrivileges = PRIVILEGE_LEVELS.HelpStaff;

export const data = new SlashCommandBuilder()
  .setName('reset-jobs')
  .setDescription('Check the reset job status')
  .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
  .addBooleanOption((o) =>
    o.setName('full').setDescription('Send the full contents of resetJobs')
  )
  .addBooleanOption((o) =>
    o.setName('eph').setDescription('Send as an ephemeral message')
  )
  .addStringOption((o) =>
    o
      .setName('search')
      .setDescription('Get the current reset of the specified guild ID')
      .setMinLength(17)
      .setMaxLength(19)
  )
  .setDMPermission(false);

export const execute = async function (i) {
  const useFull = i.options.getBoolean('full') ?? false;
  const search = i.options.getString('search');
  let content;
  if (search) {
    content =
      '**Reset information: **' +
      (resetModel.resetJobs[search] ?? '`No current job`');
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

    const typeDisplay = types.map(
      (t) =>
        `\n - ${t}: ${Object.values(resetModel.resetJobs).reduce(
          (p, c) => (c.type === t ? ++p : p),
          0
        )}`
    );

    content = `Length: ${
      Object.keys(resetModel.resetJobs).length
    }\nTypes: ${typeDisplay}`;
  }

  const res = {
    content,
    ephemeral: i.options.getBoolean('eph') ?? false,
  };

  if (useFull) {
    res.files = [
      new AttachmentBuilder(
        Buffer.from(JSON.stringify(resetModel.resetJobs, null, 2), 'utf8'),
        { name: 'logs.json' }
      ),
    ];
  }

  await i.reply(res);
};


// GENERATED: start of generated content by `exports-to-default`.
// [GENERATED: exports-to-default:v0]

export default {
    requiredPrivileges,
    data,
    execute,
}

// GENERATED: end of generated content by `exports-to-default`.

