const guildModel = require('../../models/guild/guildModel.js');
const guildMemberModel = require('../../models/guild/guildMemberModel.js');
const guildRoleModel = require('../../models/guild/guildRoleModel.js');
const statFlushCache = require('../../statFlushCache.js');
const { oneLine, stripIndent } = require('common-tags');
const { PermissionFlagsBits, Events, GatewayOpcodes } = require('discord.js');
const { DiscordSnowflake } = require('@sapphire/snowflake');

module.exports.execute = async (i) => {
  await guildModel.cache.load(i.guild);

  const role = i.options.getRole('role', true);
  if (!i.member.permissionsIn(i.channel).has(PermissionFlagsBits.ManageGuild)) {
    return await i.reply({
      content:
        'You need the permission to manage the server in order to use this command.',
      ephemeral: true,
    });
  }

  const change = i.options.getInteger('change', true);

  if (i.options.getBoolean('use-beta')) return await betaSystem(i, role, change);
  else return await oldSystem(i, role, change);
};

async function oldSystem(interaction, role, changeAmount) {
  await interaction.deferReply();
  await guildRoleModel.cache.load(role);

  const members = await interaction.guild.members.fetch({
    cache: false,
    withPresences: false,
    force: true,
  });
  console.log('Role give members ', members.size);

  let affected = 0;
  for (let member of members) {
    member = member[1];
    if (member.roles.cache.has(role.id)) {
      await guildMemberModel.cache.load(member);
      await statFlushCache.addBonus(member, changeAmount);
      affected++;
    }
  }
  console.log('Role give affected members', affected);

  await interaction.editReply({
    content: oneLine`Successfully gave \`${changeAmount}\` bonus XP 
      to \`${affected}\` member${affected == 1 ? '' : 's'} with role ${role}`,
    allowedMentions: { parse: [] },
  });
}

async function betaSystem(interaction, role, changeAmount) {
  await guildRoleModel.cache.load(role);

  // DJS GuildMemberManager.fetch()
  // https://github.com/discordjs/discord.js/blob/ff85481d3e7cd6f7c5e38edbe43b27b104e82fba/packages/discord.js/src/managers/GuildMemberManager.js#L493

  await interaction.reply({
    content: `Processing ${interaction.guild.memberCount} members`,
    ephemeral: true,
  });

  const nonce = DiscordSnowflake.generate().toString();

  interaction.guild.shard.send({
    op: GatewayOpcodes.RequestGuildMembers,
    d: {
      guild_id: interaction.guild.id,
      presences: false,
      query: '', // required to be empty string in order to fetch all
      nonce,
      limit: 0,
    },
  });

  console.debug('Member count ', interaction.guild.memberCount);
  const members = await getApplicableMembers(
    role.id,
    nonce,
    interaction.client,
    (c) => interaction.editReply(c),
    interaction.guild.memberCount
  );
  console.debug(`${members.size} Members found`);

  await interaction.followUp({
    content: 'Applying XP...',
    ephemeral: true,
  });

  let affected = 0;
  for (const member of members) {
    await statFlushCache.directlyAddBonus(
      member,
      interaction.guild,
      interaction.client,
      changeAmount
    );

    affected++;
    if (affected % 2000 === 0) {
      await interaction.editReply({
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

  await interaction.followUp({
    content: oneLine`Successfully gave \`${changeAmount}\` bonus XP
      to \`${affected}\` member${affected == 1 ? '' : 's'} with role ${role}`,
    allowedMentions: { parse: [] },
    ephemeral: true,
  });
}

// not sure how to use async/await here so just promise-based
async function getApplicableMembers(roleId, nonce, client, reply, memberCount) {
  return new Promise((resolve) => {
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
