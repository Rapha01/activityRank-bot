const { EmbedBuilder, RESTJSONErrorCodes } = require('discord.js');
const guildMemberModel = require('../models/guild/guildMemberModel');
const statFlushCache = require('../statFlushCache');
const { stripIndent } = require('common-tags');

module.exports.currentlyProcessing = new Set();
const statusDeferrals = new Map();

module.exports.changeXp = async (interaction, roleId, change) => {
  statusDeferrals.set(interaction.guild.id, { timeout: Date.now(), type: 'hook' });
  exports.currentlyProcessing.add(interaction.guild.id);
  await interaction.editReply({ embeds: [new EmbedBuilder().setDescription(
    'Fetching members...',
  ).setColor(0x00AE86)] });
  const members = await interaction.guild.members.fetch();
  console.debug(`fetched ${members.size} members for guild ${interaction.guild.id} in roleXpUtil`);

  let modifiedMembers = 0;
  let checkedMembers = 0;
  for (const member of members.values()) {
    if (member.roles.cache.has(roleId)) {
      await guildMemberModel.cache.load(member);
      await statFlushCache.addBonus(member, change);
      modifiedMembers++;
    }

    if (!(modifiedMembers % 5)) {
      if (statusDeferrals.get(interaction.guild.id).timeout < Date.now()) {
        try {
          if (statusDeferrals.get(interaction.guild.id).type === 'hook') {
            await interaction.editReply({ embeds: [new EmbedBuilder().setDescription(
              stripIndent`
                \`${modifiedMembers}\` members updated.
                \`${checkedMembers}\`/\`${members.size}\` (\`${(checkedMembers / members.size) * 20}%\`) members processed.`,
            ).setColor(0x00AE86)] });
          } else {
            await interaction.channel.send({ embeds: [new EmbedBuilder().setDescription(
              stripIndent`
                \`${modifiedMembers}\` members updated.
                \`${checkedMembers}\`/\`${members.size}\` (\`${(checkedMembers / members.size) * 20}%\`) members processed.`,
            ).setColor(0x00AE86)] });
          }
        } catch (e) {
          if (e.code === RESTJSONErrorCodes.InvalidWebhookToken)
            // interaction hit 15-min timeout
            statusDeferrals.set(interaction.guild.id, { timeout: Date.now() + 3e+5, type: 'msg' });
          else
            console.warn(e);
        }
        if (statusDeferrals.get(interaction.guild.id).type === 'hook')
          statusDeferrals.set(interaction.guild.id, { timeout: Date.now() + 10e+3, type: 'hook' }); // 10 sec
        else
          statusDeferrals.set(interaction.guild.id, { timeout: Date.now() + 3e+5, type: 'msg' }); // 5 min
      }
    }

    checkedMembers++;
    if (members.size > 100) {
      if (!(checkedMembers % 1000)) {
        console.debug(
          members.size, checkedMembers, modifiedMembers,
          statusDeferrals.get(interaction.guild.id), Date.now(),
          statusDeferrals.get(interaction.guild.id) < Date.now(),
        );
      }
    } else {
      console.debug(members.size, checkedMembers, modifiedMembers);
    }
  }
  if (statusDeferrals.get(interaction.guild.id).type === 'hook') {
    await interaction.editReply({ embeds: [new EmbedBuilder().setDescription(
      'Operation complete.',
    ).setColor(0x00AE86)] });
  } else {
    await interaction.channel.send({ embeds: [new EmbedBuilder().setDescription(
      'Operation complete.',
    ).setColor(0x00AE86)] });
  }
  exports.currentlyProcessing.delete(interaction.guild.id);
};
