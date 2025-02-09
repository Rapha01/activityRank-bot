import statFlushCache from '../../statFlushCache.js';
import { oneLine, stripIndent } from 'common-tags';
import {
  Events,
  GatewayOpcodes,
  type ChatInputCommandInteraction,
  type Role,
  type Client,
  type InteractionEditReplyOptions,
  type GuildMember,
  type Guild,
  type ReadonlyCollection,
} from 'discord.js';
import { DiscordSnowflake } from '@sapphire/snowflake';
import { command } from '#bot/commands.js';
import { Time } from '@sapphire/duration';
import type { TFunction } from 'i18next';

export const currentJobs = new Set();

export default command({
  name: 'bonus role',
  async execute({ interaction, client, options, t }) {
    if (currentJobs.has(interaction.guild.id)) {
      await interaction.reply({
        content: t('bonus.massXP'),
        ephemeral: true,
      });
      return;
    }

    const role = options.role;
    const change = options.change;

    currentJobs.add(interaction.guild.id);
    // backup removes after 1h
    const clean = () => {
      if (currentJobs.delete(interaction.guild.id)) {
        client.logger.warn(
          `role bonus job removed during sweep from guild ${interaction.guild.id}`,
        );
      } else {
        client.logger.debug(`Guild ${interaction.guild.id} left before bonus role job sweep`);
      }
    };
    setTimeout(clean, Time.Hour);

    if (options['use-beta']) {
      return await betaSystem(t, interaction, role, change);
    }
    return await oldSystem(t, interaction, role, change);
  },
});

async function oldSystem(
  t: TFunction<'command-content'>,
  interaction: ChatInputCommandInteraction<'cached'>,
  role: Role,
  changeAmount: number,
) {
  await interaction.deferReply();

  interaction.client.logger.debug(
    `Starting old role give; fetching ${interaction.guild.memberCount} members`,
  );

  const members = await interaction.guild.members.fetch({ withPresences: false });

  interaction.client.logger.debug(`Old role give to ${members.size} members`);

  await interaction.editReply({ content: t('bonus.applying', { changeAmount }) });

  let affected = 0;
  for (const member of members.values()) {
    if (member.roles.cache.has(role.id) && !member.user.bot) {
      await statFlushCache.addBonus(member, changeAmount);
      affected++;
    }
  }

  currentJobs.delete(interaction.guild.id);

  interaction.client.logger.debug(`Old role give affected ${affected} members`);

  await interaction.editReply({
    content: t('bonus.successfully', {
      changeAmount,
      affected,
      role: role.toString(),
      count: affected,
    }),
    allowedMentions: { parse: [] },
  });
}

async function betaSystem(
  t: TFunction<'command-content'>,
  interaction: ChatInputCommandInteraction<'cached'>,
  role: Role,
  changeAmount: number,
) {
  // DJS GuildMemberManager.fetch()
  // https://github.com/discordjs/discord.js/blob/ff85481d3e7cd6f7c5e38edbe43b27b104e82fba/packages/discord.js/src/managers/GuildMemberManager.js#L493

  await interaction.reply({
    content: t('bonus.processing', { count: interaction.guild.memberCount }),
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

  interaction.client.logger.debug(
    `New role give to guild with member count ${interaction.guild.memberCount}`,
  );

  const members = await getApplicableMembers(
    role.id,
    nonce,
    interaction.client,
    (c) => interaction.editReply(c),
    t,
  );
  console.debug(`${members.size} Members found`);

  await interaction.followUp({ content: t('bonus.applyXP'), ephemeral: true });

  let affected = 0;
  for (const member of members) {
    await statFlushCache.directlyAddBonus(
      member,
      interaction.guild,
      interaction.client,
      changeAmount,
    );

    affected++;
    if (affected % 2000 === 0) {
      await interaction.editReply({
        content: stripIndent`
          ${t('bonus.processing', { count: members.size })}
          \`\`\`yml
          ${progressBar(affected, members.size)}
          \`\`\`
        `,
      });
    }
  }

  currentJobs.delete(interaction.guild.id);

  interaction.client.logger.debug(`New role give affected ${affected} members`);

  await interaction.followUp({
    content: t('bonus.successfully', {
      changeAmount,
      affected,
      role: role.toString(),
      count: affected,
    }),
    allowedMentions: { parse: [] },
    ephemeral: true,
  });
}

// not sure how to use async/await here so just promise-based
async function getApplicableMembers(
  roleId: string,
  nonce: string,
  client: Client,
  reply: (opt: InteractionEditReplyOptions) => unknown,
  t: TFunction<'command-content'>,
): Promise<Set<string>> {
  return new Promise((resolve) => {
    const applicableMembers = new Set<string>();
    let i = 0;

    const handler = async (
      members: ReadonlyCollection<string, GuildMember>,
      _guild: Guild,
      chunk: { index: number; count: number; nonce?: string },
    ) => {
      if (chunk.nonce !== nonce) return;
      i++;

      if (i === 1) console.debug(`Max ${chunk.count}`);

      if (i % 20 === 0) {
        reply({
          content: stripIndent`
            ${t('bonus.processing', { count: members.size })}
            \`\`\`yml
            ${progressBar(i, chunk.count)}
            \`\`\`
          `,
        });
      }

      for (const member of members.values()) {
        if (member.roles.cache.has(roleId) && !member.user.bot) {
          applicableMembers.add(member.id);
          console.debug(`Added ${member.id}`);
        }
      }

      if (members.size < 1_000 || i === chunk.count) {
        client.off(Events.GuildMembersChunk, handler);
        // @ts-expect-error decrementMaxListeners is private but properly handled here
        client.decrementMaxListeners();

        console.debug('Final: ', applicableMembers.size);
        resolve(applicableMembers);
      }
    };

    // @ts-expect-error incrementMaxListeners is private but properly handled here
    client.incrementMaxListeners();
    client.on(Events.GuildMembersChunk, handler);
  });
}

function progressBar(index: number, max: number, len = 40) {
  const fraction = index / max;
  const progress = Math.ceil(len * fraction);
  return `${'■'.repeat(progress)}${'□'.repeat(len - progress)} ${
    Math.round(fraction * 1_000) / 10
  }%`;
}
