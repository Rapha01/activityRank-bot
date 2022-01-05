const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');

const statusLookup = {
  0: "Ready",
  1: "Connecting",
  2: "Reconnecting",
  3: "Idle",
  4: "Nearly Connected",
  5: "Disconnected",
  6: "Waiting for Guilds",
  7: "Identifying",
  8: "Resuming Connection"
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Checks the bot\'s latency'),
  async execute(i) {
    const statuses = {};

    const shards = await i.client.shard.broadcastEval(c => [c.shard.ids, c.ws.status, c.ws.ping, c.guilds.cache.size]);
    shards.forEach(shard => {
      statuses[shard[1]] = (statuses[shard[1]] || 0) + 1;
    });


    const sent = await i.deferReply({ fetchReply: true });
    const pingEmbed = new MessageEmbed()
      .setColor(0x00AE86)
      .setTitle('🏓 Pong! 🏓')
      .addFields(
        { name: '🔁 Roundtrip Latency 🔁', value: `\`\`\`${sent.createdTimestamp - i.createdTimestamp}ms\`\`\`` },
        { name: '💗 API Heartbeat 💗', value: `\`\`\`${Math.round(i.client.ws.ping)}ms\`\`\`` },
      )
      .setTimestamp();
    let statusString = '';
    for (const stat in statuses) { 
      statusString += `${statuses[stat]} shard(s) ${statusLookup[stat]} \n`;
    }
    pingEmbed.addField('📡 Shard statuses 📡', statusString);

    await i.editReply({ embeds: [pingEmbed], ephemeral: true });
  }
}