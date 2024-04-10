import type { GuildMember, VoiceBasedChannel } from 'discord.js';
import { getGuildModel } from '../models/guild/guildModel.js';
import guildRoleModel from '../models/guild/guildRoleModel.js';

export const noVoiceXp = async (member: GuildMember, channel: VoiceBasedChannel) => {
  if (member.user.bot) return true;

  const cachedGuild = await getGuildModel(member.guild);

  if (!cachedGuild.db.allowMutedXp && member.voice.mute) return true;
  if (!cachedGuild.db.allowDeafenedXp && member.voice.deaf) return true;
  if (!cachedGuild.db.allowSoloXp && channel.members.size < 2) return true;

  for (const role of member.roles.cache.values()) {
    const cachedRole = await guildRoleModel.cache.get(role);
    if (cachedRole.db.noXp) return true;
  }

  return false;
};

export default {
  noVoiceXp,
};
