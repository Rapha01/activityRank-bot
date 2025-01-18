import { command, subcommand } from '#bot/util/registry/command.js';
import { ApplicationCommandOptionType } from 'discord.js';
import { subtle } from 'node:crypto';
import { customAlphabet } from 'nanoid';
import { shards } from '#models/shardDb/shardDb.js';
import { getGuildModel } from '#bot/models/guild/guildModel.js';

const maketoken = subcommand({
  data: {
    name: 'create-token',
    description: 'Create a token to access the API.',
    type: ApplicationCommandOptionType.Subcommand,
    options: [
      {
        name: 'guild-id',
        description: 'The ID of the guild the token is valid for.',
        type: ApplicationCommandOptionType.String,
        min_length: 17,
        max_length: 20,
        required: true,
      },
    ],
  },
  async execute({ interaction }) {
    const guildId = interaction.options.getString('guild-id', true);
    await interaction.deferReply();

    if (!interaction.client.shard) {
      throw new Error();
    }
    const fetchResults = await interaction.client.shard.broadcastEval(
      (client, ctx) => {
        const guild = client.guilds.cache.get(ctx.guildId);
        return guild ? guild.ownerId : null;
      },
      { context: { guildId } },
    );
    const ownerId = fetchResults.find((d) => d !== null);

    if (!ownerId) {
      await interaction.followUp({
        content: 'ActivityRank is not in the listed guild. Please check your guild ID.',
      });
      return;
    }

    if (ownerId !== interaction.user.id) {
      await interaction.followUp({
        content: 'For security, only the owner of the guild may generate tokens.',
      });
      return;
    }

    const { hash, token } = await generateToken(guildId);

    const guild = await interaction.client.guilds.fetch(guildId);
    const targetGuild = await getGuildModel(guild);

    await shards
      .get(targetGuild.dbHost)
      .db.updateTable('guild')
      .set({ apiToken: hash })
      .where('guildId', '=', guildId)
      .executeTakeFirstOrThrow();

    await interaction.followUp({ content: 'Token generated. *See the hidden message below.*' });
    await interaction.followUp({
      content: `Your API token has been generated. **It will not be shown again.** 
-# * As a reminder, the API is in **alpha**. Please discuss your plans with <@774660568728469585> to ensure it stays stable for you.
-# * If you generate a new token, the current one will be invalidated.

\`\`\`${token}\`\`\``,
      ephemeral: true,
    });
  },
});

export default command.parent({
  deploymentMode: 'LOCAL_ONLY',
  data: {
    name: 'api',
    description: 'Manage your access to the Public API.',
  },
  subcommands: [maketoken],
});

// 24 characters -> log2(36**24) = appx. 124 bits of entropy (min. 120 for security)
const generator = customAlphabet('0123456789abcdefghijklmnopqrstuvwxyz', 24);

async function generateToken(guildId: string): Promise<{ token: string; hash: string }> {
  const token = generator(24);

  const hash = await sha256(token);

  return { token: `ar-${guildId}-${token}`, hash };
}

// NOTE: must be kept in sync with apps/api/src/middleware/auth.ts
async function sha256(data: string) {
  const sourceBuffer = new TextEncoder().encode(data);
  const buffer = await subtle.digest({ name: 'SHA-256' }, sourceBuffer);
  const hash = Array.prototype.map
    .call(new Uint8Array(buffer), (x) => `00${x.toString(16)}`.slice(-2))
    .join('');
  return hash;
}