import { DurationFormat } from '@formatjs/intl-durationformat';
import { Time } from '@sapphire/duration';
import {
  type AnyThreadChannel,
  ButtonStyle,
  type Collection,
  ComponentType,
  type GuildMember,
  type GuildTextBasedChannel,
  MessageFlags,
  type Webhook,
} from 'discord.js';
import { Temporal } from 'temporal-polyfill';
import invariant from 'tiny-invariant';
import { command } from '#bot/commands.ts';
import { runRoleUpdate } from '#bot/levelManager.ts';
import { getGuildModel } from '#bot/models/guild/guildModel.ts';
import { renderProgressBar } from '#bot/models/resetModel.ts';
import { container } from '#bot/util/component.ts';
import { requireUser } from '#bot/util/predicates.ts';
import { ComponentKey, component } from '#bot/util/registry/component.ts';
import { shards } from '#models/shardDb/shardDb.ts';
import { getLevelProgression, sleep } from '#util/fct.ts';

export const activeUpdates: Map<
  string,
  { startedAt: Date; endedAt: Date | null; members: number }
> = new Map();
export const cancelQueue = new Set();

export default command({
  name: 'update-roles',
  async execute({ interaction }) {
    await interaction.deferReply();

    const lastUpdate = activeUpdates.get(interaction.guild.id);
    if (
      lastUpdate &&
      (!lastUpdate.endedAt || Date.now() - lastUpdate.endedAt.getTime() < Time.Hour * 4)
    ) {
      await interaction.followUp({
        components: [
          container([
            {
              type: ComponentType.TextDisplay,
              content: lastUpdate.endedAt
                ? `## Sorry!\nYour latest update only ended <t:${Math.floor(lastUpdate.endedAt.getTime() / 1000)}:R>. You can run another update <t:${Math.floor((lastUpdate.endedAt.getTime() + Time.Hour * 4) / 1000)}:R>.`
                : '## Sorry!\nYour latest update is still running. Please wait for it to complete.',
            },
          ]),
        ],
        flags: [MessageFlags.IsComponentsV2],
      });
      return;
    }

    // clean up state
    cancelQueue.delete(interaction.guild.id);
    activeUpdates.delete(interaction.guild.id);

    const members = await interaction.guild.members.fetch();

    // 1.2 seconds per member
    const duration = fmtDuration(interaction.locale, Math.ceil(members.size * 1.2));

    const cachedGuild = await getGuildModel(interaction.guild);

    const content = `## Mass Role Update\nUpdating roles for **${members.size}** members. While roles are processing, please avoid updating server settings.\nIn ideal conditions, this will take **${duration}**.`;
    const warnings = [];

    if (!cachedGuild.db.takeAwayAssignedRolesOnLevelDown) {
      warnings.push({
        title: 'Take Away Assigned Roles is disabled',
        description:
          'Take Away Assigned Roles on Level Down is disabled. While this setting is disabled, members with a role above their current level will not lose it. Use `/config-server set` to change this behaviour.',
      });
    }

    let canCreateHook = false;
    if (!interaction.appPermissions.has('ManageWebhooks', true)) {
      warnings.push({
        title: 'Manage Webhooks permissions are disabled',
        description:
          'I do not have `Manage Webhooks` permissions in this channel. Because of this, I can only update you on the progress of the update for 15 minutes.',
      });
    } else if (interaction.channel?.isThread()) {
      warnings.push({
        title: 'Cannot create webhook in Thread channel',
        description:
          'I cannot create webhooks in this channel. Because of this, I can only update you on the progress of the update for 15 minutes. To fix this, run the command again from a text channel.',
      });
    } else {
      canCreateHook = true;
    }

    await interaction.followUp({
      components: [
        container([
          {
            type: ComponentType.TextDisplay,
            content,
          },
          ...warnings.map((w) => ({
            type: ComponentType.TextDisplay,
            content: `### :warning: ${w.title}\n${w.description}`,
          })),
          {
            type: ComponentType.ActionRow,
            components: [
              {
                type: ComponentType.Button,
                style: ButtonStyle.Primary,
                label: 'Start Role Update',
                customId: run.instanceId({
                  data: { members, createHook: canCreateHook },
                  predicate: requireUser(interaction.user),
                }),
              },
            ],
          },
        ]),
      ],
      flags: [MessageFlags.IsComponentsV2],
    });
  },
});

function fmtDuration(locale: string, seconds: number): string {
  let dura = Temporal.Duration.from({ seconds });
  // balances `dura` up until "x days"
  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Temporal/Duration#duration_balancing
  const smallestUnit = seconds > 60 * 3 ? 'minutes' : 'seconds';
  dura = dura.round({ smallestUnit, largestUnit: 'days' });

  return new DurationFormat([locale, 'en-US'], { style: 'long' }).format(dura);
}

function isNotThreadChannel(
  channel: GuildTextBasedChannel,
): channel is Exclude<GuildTextBasedChannel, AnyThreadChannel> {
  return !channel.isThread();
}

const run = component<{ members: Collection<string, GuildMember>; createHook: boolean }>({
  type: ComponentType.Button,
  async callback({ interaction, data }) {
    await interaction.update({
      components: [
        container([
          {
            type: ComponentType.TextDisplay,
            content: `## Mass Role Update\nUpdating roles for **${data.members.size}** members. While roles are processing, please avoid updating server settings.\nIn ideal conditions, this will take **${fmtDuration(interaction.locale, Math.ceil(data.members.size * 1.2))}**.`,
          },
          {
            type: ComponentType.ActionRow,
            components: [
              {
                type: ComponentType.Button,
                style: ButtonStyle.Primary,
                label: 'Start Role Update',
                customId: ComponentKey.Throw,
                disabled: true,
              },
            ],
          },
        ]),
      ],
    });
    const cachedGuild = await getGuildModel(interaction.guild);

    let canUpdate = true;
    let updateHook: Webhook | null = null;
    let updateHookMessage: string | null = null;
    if (data.createHook) {
      const channel = interaction.channel;
      invariant(
        channel?.isTextBased() && isNotThreadChannel(channel),
        'should have been checked in the command above',
      );
      updateHook = await channel.createWebhook({
        name: 'Role Updates',
        avatar: interaction.client.user.avatarURL({ size: 2048 }),
      });
    }

    const memberCount = data.members.size;
    const { db } = shards.get(cachedGuild.dbHost);

    activeUpdates.set(interaction.guild.id, {
      startedAt: new Date(),
      members: memberCount,
      endedAt: null,
    });

    function buildComponents(completion: number, disableCancel: boolean) {
      return [
        container([
          {
            type: ComponentType.TextDisplay,
            content: `## Role Update\n\n${renderProgressBar(completion)}`,
          },
          {
            type: ComponentType.ActionRow,
            components: [
              {
                type: ComponentType.Button,
                style: ButtonStyle.Secondary,
                label: 'Cancel',
                disabled: disableCancel,
                customId: cancel.instanceId({ predicate: requireUser(interaction.user) }),
              },
            ],
          },
        ]),
      ];
    }

    if (updateHook) {
      const msg = await updateHook.send({
        components: buildComponents(0, false),
        flags: [MessageFlags.IsComponentsV2],
      });
      updateHookMessage = msg.id;
    } else {
      await interaction.update({ components: buildComponents(0, false) });
    }

    for (let i = 0; i <= Math.floor(memberCount / 100); i++) {
      const memberIds = Array.from({ length: 100 }, (_, n) =>
        data.members.keyAt(i * 100 + n),
      ).filter((n) => n !== undefined);

      const res = await db
        .selectFrom('guildMember')
        .select(['userId', 'alltime'])
        .where('guildId', '=', interaction.guild.id)
        .where('userId', 'in', memberIds)
        .execute();

      for (const memberId of memberIds) {
        // before each member is processed, check if we need to cancel
        if (cancelQueue.has(interaction.guild.id)) {
          return;
        }

        const discordMember = data.members.get(memberId);
        invariant(discordMember, '`memberIds` is based on `data.members`');

        if (discordMember.user.bot) {
          await sleep(1000); // sleep for 1 second
          continue;
        }

        const xp = res.find((i) => i.userId === memberId)?.alltime ?? 0;
        const level = Math.floor(getLevelProgression(xp, cachedGuild.db.levelFactor));

        await runRoleUpdate(discordMember, level);
        await sleep(1000); // sleep for 1 second
      }

      // To avoid race conditions, check if the job has been cancelled just before editing messages too
      if (cancelQueue.has(interaction.guild.id)) {
        return;
      }

      if (updateHook) {
        invariant(updateHookMessage, 'updateHookMessage has been set earlier in the function');
        await updateHook.editMessage(updateHookMessage, {
          components: buildComponents(((i + 1) * 100) / memberCount, false),
        });
      } else if (canUpdate) {
        await interaction
          .update({ components: buildComponents(((i + 1) * 100) / memberCount, false) })
          .catch(() => {
            // probably ran out of updating time; avoid trying to update again
            canUpdate = false;
          });
      }
    }

    const thisUpdate = activeUpdates.get(interaction.guild.id);
    if (thisUpdate) {
      activeUpdates.set(interaction.guild.id, { ...thisUpdate, endedAt: new Date() });
    }

    if (updateHook) {
      invariant(updateHookMessage, 'updateHookMessage has been set earlier in the function');
      await updateHook.editMessage(updateHookMessage, { components: buildComponents(1, true) });
    } else if (canUpdate) {
      await interaction.update({ components: buildComponents(1, true) }).catch(() => {
        // probably ran out of updating time; avoid trying to update again
        canUpdate = false;
      });
    }
  },
});

const cancel = component({
  type: ComponentType.Button,
  async callback({ interaction }) {
    cancelQueue.add(interaction.guild.id);
    // just in case it isn't removed properly, clean up after 2 hours
    setTimeout(() => cancelQueue.delete(interaction.guild.id), Time.Hour * 2);

    const thisUpdate = activeUpdates.get(interaction.guild.id);
    // set endedAt value
    if (thisUpdate) {
      activeUpdates.set(interaction.guild.id, { ...thisUpdate, endedAt: new Date() });
    }

    const message = {
      components: [
        container([
          {
            type: ComponentType.TextDisplay,
            content: '## Role Update\n\n```ansi\n\u001b[1;31mCANCELLED\n```',
          },
          {
            type: ComponentType.ActionRow,
            components: [
              {
                type: ComponentType.Button,
                style: ButtonStyle.Secondary,
                label: 'Cancel',
                disabled: true,
                customId: ComponentKey.Throw,
              },
            ],
          },
        ]),
      ],
    };
    await interaction.update(message);
  },
});
