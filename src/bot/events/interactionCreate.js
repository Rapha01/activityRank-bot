const Discord = require('discord.js');

module.exports = {
	name: 'interactionCreate',
	async execute(interaction) {
        if (!interaction.isCommand()) return;

        const command = client.commands.get(interaction.commandName);

        if (!command) {
            console.log(`WARNING - command  ${interaction.commandName} was called without existance!`)
            return;
        }

        try {

            if (command.dmOnly && interaction.channel.type != 'DM') {
	            return interaction.reply({ content: 'I can\'t execute that command in guilds!', ephemeral: true });
            }
            if (command.guildOnly && interaction.channel.type === 'DM') {
	            return interaction.reply({ content: 'I can\'t execute that command inside DMs!', ephemeral: true });
            }


            if (command.userChannelPermissions) {
            	const authorPerms = interaction.member.permissionsIn(interaction.channel);
            	if (!authorPerms || !authorPerms.has(command.userChannelPermissions))
            		return interaction.reply({ content: 'You do not have the permissions required to do this!', ephemeral: true });
            }
            if (command.userServerPermissions) {
            	const authorPerms = interaction.member.permissions;
            	if (!authorPerms || !authorPerms.has(command.userServerPermissions))
            		return interaction.reply({ content: 'You do not have the permissions required to do this!', ephemeral: true });
            }
            if (command.botChannelPermissions) {
            	const authorPerms = interaction.guild.me.permissionsIn(interaction.channel);
            	if (!authorPerms || !authorPerms.has(command.botChannelPermissions))
            		return interaction.reply({ content: 'I do not have the permissions required to do this! Please contact a server admin.', ephemeral: true });
            }
            if (command.botServerPermissions) {
            	const authorPerms = interaction.guild.me.permissions;
            	if (!authorPerms || !authorPerms.has(command.botServerPermissions))
            		return interaction.reply({ content: 'I do not have the permissions required to do this! Please contact a server admin.', ephemeral: true });
            }


            const { cooldowns } = interaction.client;

            if (!cooldowns.has(command.name)) {
            	cooldowns.set(command.name, new Discord.Collection());
            }

            const now = Date.now();
            const timestamps = cooldowns.get(command.name);
            const cooldownAmount = (command.cooldown || 3) * 1000;

            if (command.cooldown) {
                const { cooldowns } = interaction.client;
                if (!cooldowns.has(command.name))
                    cooldowns.set(command.name, new Discord.Collection());
                const now = Date.now();
                const timestamps =  cooldowns.get(command.name);
                const cooldownAmount = command.cooldown * 1000;

                if (timestamps.has(interaction.member.id)) {
                	const expirationTime = timestamps.get(interaction.member.id) + cooldownAmount;

                	if (now < expirationTime) {
                		const timeLeft = (expirationTime - now) / 1000;
                		return message.reply({ content: `Please wait ${timeLeft.toFixed(1)} more second${timeLeft.toFixed(1) > 1 ? "s" : ""} before reusing the \`/${command.name}\` command!`, ephemeral: true });
                	}
                }
            }


            await command.execute(interaction);

        } catch (e) {
            console.error(e);
            await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
        }
	},
};
