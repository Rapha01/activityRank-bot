import resetModel from '../models/resetModel.js';
import { logger } from '../util/logger.js';
let jobIndex = 0;

const batchsize = process.env.NODE_ENV == 'production' ? 10_000 : 10;

export default async () => {
  try {
    let hrstart, hrend, resetJob;
    const keys = Object.keys(resetModel.resetJobs);

    if (keys.length > 0) {
      if (jobIndex >= keys.length) jobIndex = 0;

      resetJob = resetModel.resetJobs[keys[jobIndex]];
      hrstart = process.hrtime();
      await doResetJob(resetJob);
      hrend = process.hrtime(hrstart);
      jobIndex++;
      logger.debug(
        { resetJob },
        `doResetJob ${resetJob.type} for ${resetJob.cmdChannel.guild.id} finished after ${hrend[0]}s.`
      );
    }
  } catch (e) {
    logger.warn(e, 'Reset job error');
  }
};

const doResetJob = async (resetJob) => {
  try {
    let count = 0;
    if (!resetJob || !resetJob.cmdChannel || !resetJob.cmdChannel.guild) {
      resetModel.resetJobs = {};
      throw 'Resetjob cache properties undefined.';
    }

    logger.debug({ resetJob }, 'Doing reset job');

    if (resetJob.type == 'all')
      count = await resetModel.storage.resetGuildAll(
        batchsize,
        resetJob.cmdChannel.guild
      );
    else if (resetJob.type == 'settings')
      count = await resetModel.storage.resetGuildSettings(
        batchsize,
        resetJob.cmdChannel.guild
      );
    else if (resetJob.type == 'stats')
      count = await resetModel.storage.resetGuildStats(
        batchsize,
        resetJob.cmdChannel.guild
      );
    else if (resetJob.type == 'textstats')
      count = await resetModel.storage.resetGuildStatsByType(
        batchsize,
        resetJob.cmdChannel.guild,
        'textMessage'
      );
    else if (resetJob.type == 'voicestats')
      count = await resetModel.storage.resetGuildStatsByType(
        batchsize,
        resetJob.cmdChannel.guild,
        'voiceMinute'
      );
    else if (resetJob.type == 'invitestats')
      count = await resetModel.storage.resetGuildStatsByType(
        batchsize,
        resetJob.cmdChannel.guild,
        'invite'
      );
    else if (resetJob.type == 'votestats')
      count = await resetModel.storage.resetGuildStatsByType(
        batchsize,
        resetJob.cmdChannel.guild,
        'vote'
      );
    else if (resetJob.type == 'bonusstats')
      count = await resetModel.storage.resetGuildStatsByType(
        batchsize,
        resetJob.cmdChannel.guild,
        'bonus'
      );
    else if (
      resetJob.type == 'guildMembersStats' &&
      resetJob.userIds.length > 0
    )
      count = await resetModel.storage.resetGuildMembersStats(
        batchsize,
        resetJob.cmdChannel.guild,
        resetJob.userIds
      );
    else if (
      resetJob.type == 'guildChannelsStats' &&
      resetJob.channelIds.length > 0
    )
      count = await resetModel.storage.resetGuildChannelsStats(
        batchsize,
        resetJob.cmdChannel.guild,
        resetJob.channelIds
      );

    await resetJob.ref.followUp({
      content: `Reset ${count} rows...`,
      ephemeral: true,
    });

    if (count < batchsize) {
      await resetJob.ref.followUp({
        content: 'Finished reset.',
        ephemeral: true,
      });

      delete resetModel.resetJobs[resetJob.cmdChannel.guild.id];
    }
  } catch (e) {
    resetModel.resetJobs = {};
    throw e;
  }
};
