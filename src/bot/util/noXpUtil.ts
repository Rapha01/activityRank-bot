import type { GuildMember, VoiceBasedChannel } from 'discord.js';
import guildRoleModel from '../models/guild/guildRoleModel.js';

export const noVoiceXp = async (member: GuildMember, channel: VoiceBasedChannel) => {
  if (member.user.bot) return true;

  if (!member.guild.appData.allowMutedXp && member.voice.mute) return true;

  if (!member.guild.appData.allowDeafenedXp && member.voice.deaf) return true;

  //console.log(member.voice.mute, member.voice.deaf);

  if (!member.guild.appData.allowSoloXp && channel.members.size < 2) return true;

  //if (!member.guild.appData.allowInvisibleXp && member.user.presence.status == 'offline')
  //return resolve(true);

  for (const _role of member.roles.cache) {
    const role = _role[1];
    await guildRoleModel.cache.load(role);

    if (role.appData.noXp) return true;
  }

  return false;
};

export default {
  noVoiceXp,
};
