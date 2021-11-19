const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Gets the ping of the bot!'),
    async execute(i) {
        var botping = Math.round(i.client.ws.ping)
        const sent = await i.reply({ content: 'Pinging...', fetchReply: true });
        const pingEmbed = new MessageEmbed()
	        .setColor('#7289da')
	        .setTitle('🏓 Pong! 🏓')
	        .addFields(
	        	{ name: 'Roundtrip Latency', value: `\`\`\`${sent.createdTimestamp - i.createdTimestamp}ms\`\`\`` },
	        	{ name: 'API Heartbeat', value: `\`\`\`${botping}ms\`\`\`` },
	        )
	        .setTimestamp()
        await i.deleteReply()
        i.followUp({ embeds: [pingEmbed], ephemeral: true });
    }
}
