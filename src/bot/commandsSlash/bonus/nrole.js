/* eslint-disable no-unreachable */
const guildMemberModel = require('../../models/guild/guildMemberModel.js');
const guildRoleModel = require('../../models/guild/guildRoleModel.js');
const statFlushCache = require('../../statFlushCache.js');
const { stripIndent, oneLine } = require('common-tags');
const {
  PermissionFlagsBits,
  GatewayOpcodes,
  Events,
  Collection,
} = require('discord.js');
const { DiscordSnowflake } = require('@sapphire/snowflake');

module.exports.execute = async (i) => {
  const role = i.options.getRole('role');
  /*  if (!i.member.permissionsIn(i.channel).has(PermissionFlagsBits.ManageGuild)) {
    return await i.reply({
      content: 'You need the permission to manage the server in order to use this command.',
      ephemeral: true,
    });
    // FIXME replace
  } */

  const give = i.options.getInteger('give') || 0;
  const take = i.options.getInteger('take') || 0;
  const val = give - take;
  if (val === 0) {
    return await i.reply({
      content: 'You cannot give/take 0 XP!',
      ephemeral: true,
    });
  }

  await guildRoleModel.cache.load(role);

  // TODO(cooldown; piemot) Add command cooldown (resource-heavy command)
  // TOOD(cooldown; piemot) Add command blocking (prevent duplicate command usage per-guild)

  // DJS GuildMemberManager.fetch()
  // https://github.com/discordjs/discord.js/blob/ff85481d3e7cd6f7c5e38edbe43b27b104e82fba/packages/discord.js/src/managers/GuildMemberManager.js#L493

  await i.reply({
    content: `Processing ${i.guild.memberCount} members`,
    ephemeral: true,
  });

  const nonce = DiscordSnowflake.generate().toString();

  i.guild.shard.send({
    op: GatewayOpcodes.RequestGuildMembers,
    d: {
      guild_id: i.guild.id,
      presences: false,
      // user_ids
      query: '', // required to be empty string in order to fetch all
      nonce,
      limit: 0,
    },
  });

  console.debug('Member count ', i.guild.memberCount);
  const members = await getApplicableMembers(
    role.id,
    nonce,
    i.client,
    (c) => i.editReply(c), // TODO refactor to allow for unknown interaction
    i.guild.memberCount
  );
  console.debug(`${members.size} Members found`);

  await i.followUp({
    content: 'Applying XP...',
    ephemeral: true,
  });

  let affected = 0;
  for (const member of members) {
    // member = member[1];
    // await guildMemberModel.cache.load(member);
    await statFlushCache.directlyAddBonus(member, i.guild, i.client, val);
    // TODO check cache desync implications of not updating memberTotalXP

    affected++;
    if (affected % 2000 === 0) {
      await i.editReply({
        content: stripIndent`
          Processing \`${members.size}\` members...
          \`\`\`yml
          ${progressBar(affected, members.size)}
          \`\`\`
        `,
        ephemeral: true,
      });
    }
  }

  console.log('Role give affected members', affected);

  await i.followUp({
    content: oneLine`Successfully gave \`${val}\` bonus XP
      to \`${affected}\` member${affected == 1 ? '' : 's'} with role ${role}`,
    allowedMentions: { parse: [] },
    ephemeral: true,
  });
};

// not sure how to use async/await here so just promise-based
async function getApplicableMembers(roleId, nonce, client, reply, memberCount) {
  return new Promise((resolve) => {
    // const applicableMembers = new Collection();
    const applicableMembers = new Set();
    let i = 0;

    const handler = async (members, _guild, chunk) => {
      if (chunk.nonce !== nonce) return;
      i++;

      if (i === 1) console.debug(`Max ${chunk.count}`);

      if (i % 20 === 0) {
        reply({
          content: stripIndent`
            Processing \`${memberCount}\` members...
            \`\`\`yml
            ${progressBar(i, chunk.count)}
            \`\`\`
          `,
          ephemeral: true,
        });
      }

      for (const member of members.values()) {
        if (member.roles.cache.has(roleId)) {
          applicableMembers.add(member.id);
          // applicableMembers.set(member.id, member);
          console.debug(`Added ${member.id}`);
        }
      }

      if (members.size < 1_000 || i === chunk.count) {
        client.removeListener(Events.GuildMembersChunk, handler);
        client.decrementMaxListeners();

        console.debug('Final: ', applicableMembers.size);
        resolve(applicableMembers);
      }
    };
    client.incrementMaxListeners();
    client.on(Events.GuildMembersChunk, handler);
  });
}

function progressBar(index, max, len = 40) {
  const fraction = index / max;
  const progress = Math.ceil(len * fraction);
  return `${'■'.repeat(progress)}${'□'.repeat(len - progress)} ${
    Math.round(fraction * 1_000) / 10
  }%`;
}
