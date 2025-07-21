import { getGuildModel } from '#bot/models/guild/guildModel.js';
import { ComponentType, MessageFlags, type Channel, type Guild } from 'discord.js';
import invariant from 'tiny-invariant';

export async function warnGuild(guild: Guild, content: string) {
  let success = false;

  async function tryToSend(channel?: Channel | null) {
    if (!channel || success) {
      return;
    }
    if (!channel.isSendable()) {
      return;
    }

    invariant(guild.members.me);
    if (!channel.isDMBased() && !guild.members.me.permissionsIn(channel).has('SendMessages')) {
      return;
    }

    try {
      await channel.send({
        components: [
          {
            type: ComponentType.Container,
            accentColor: 0xd97706,
            components: [{ type: ComponentType.TextDisplay, content }],
          },
        ],
        allowedMentions: { parse: [] },
        flags: MessageFlags.IsComponentsV2,
      });
      success = true;
    } catch (e) {
      // TODO: consider logging here?
    }
  }

  const guildModel = await getGuildModel(guild);
  const levelupChannel = await guild.channels.fetch(guildModel.db.autopost_levelup);
  const joinChannel = await guild.channels.fetch(guildModel.db.autopost_serverJoin);

  await tryToSend(levelupChannel);
  await tryToSend(joinChannel);
  await tryToSend(guild.safetyAlertsChannel);
  await tryToSend(guild.publicUpdatesChannel);
  await tryToSend(guild.systemChannel);

  if (success) {
    return;
  }

  const owner = await guild.fetchOwner();

  try {
    await owner.send({
      components: [
        {
          type: ComponentType.Container,
          accentColor: 0xd97706,
          components: [{ type: ComponentType.TextDisplay, content }],
        },
      ],
      flags: MessageFlags.IsComponentsV2,
    });
    success = true;
  } catch (e) {
    // TODO: consider logging here?
  }
}
