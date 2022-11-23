const guildMemberModel = require('../../models/guild/guildMemberModel.js');
const guildRoleModel = require('../../models/guild/guildRoleModel.js');
const statFlushCache = require('../../statFlushCache.js');
const { oneLine } = require('common-tags');
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

  // ------------------------------------------

  // TODO(cooldown; piemot) Add command cooldown (resource-heavy command)
  // TOOD(cooldown; piemot) Add command blocking (prevent duplicate command usage per-guild)

  // ~~Request new page of members every x seconds (5-10??)~~
  // ~~Page size can be assumed to be ~1000~~
  // ratelimit for gateway = 120 / 60s
  // DJS GuildMemberManager.fetch()
  // https://github.com/discordjs/discord.js/blob/ff85481d3e7cd6f7c5e38edbe43b27b104e82fba/packages/discord.js/src/managers/GuildMemberManager.js#L493

  /* await i.reply({
    content: '...',
    ephemeral: true,
  }); */

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

  const applicableMembers = new Set();
  let x = 0;
  console.debug(i.guild.memberCount);
  const handler = async (members, _guild, chunk) => {
    if (chunk.nonce !== nonce) return;
    x++;

    if (x === 1) console.debug(`Max ${chunk.count}`);

    if (x % 10 === 0) {
      await i.followUp({
        content: `${x / chunk.count}`,
        ephemeral: true,
      });
    }
    /*
    if (x % 10 === 0)
      console.debug(`${x}/${chunk.count}`); */

    for (const member of members.values()) {
      if (member.roles.cache.has(role.id)) {
        applicableMembers.add(member.id);
        console.debug(`Added ${member.id}`);
      }
    }

    // TODO update progress bar
    if (members.size < 1_000 || x === chunk.count) {
      i.client.removeListener(Events.GuildMembersChunk, handler);
      i.client.decrementMaxListeners();
      console.debug('Final: ', applicableMembers);
      // MUST return; possibility of multiple calls !!!
      // TODO move to function
      // cleanup
    }
  };
  i.client.incrementMaxListeners();
  i.client.on(Events.GuildMembersChunk, handler);
  /*

  const members = await i.guild.members.fetch({ cache: false, withPresences: false, force: true });
  console.log('Role give members ', members.size);

  let affected = 0;
  for (let member of members) {
    member = member[1];
    if (member.roles.cache.has(role.id)) {
      await guildMemberModel.cache.load(member);
      await statFlushCache.addBonus(member, val);
      affected++;
    }
  }
  console.log('Role give affected members', affected);

  await i.reply({
    content: oneLine`Successfully gave \`${val}\` bonus XP
      to \`${affected}\` member${affected == 1 ? '' : 's'} with role ${role}`,
    allowedMentions: { parse: [] },
  }); */
};
