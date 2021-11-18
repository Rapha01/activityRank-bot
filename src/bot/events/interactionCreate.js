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
            /******* Command Handler  *******/
            // TODO: permissionLevels, cooldown {seconds, allowedUses}

            // Features: ~~dmOnly, guildOnly~~, permissionLevels, 
            // botServerPermissions, botChannelPermissions, userServerPermissions, userChannelPermissions,
            // description, cooldown {seconds, allowedUses}
            
            //dmOnly
            if (command.dmOnly && interaction.channel.type != 'DM') {
	            return interaction.reply({ content: 'I can\'t execute that command in guilds!', ephemeral: true });
            }
            if (command.guildOnly && interaction.channel.type === 'DM') {
	            return interaction.reply({ content: 'I can\'t execute that command inside DMs!', ephemeral: true });
            }
            //Perms
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

            //cooldowns
            
            /******* /Command Handler *******/
            await command.execute(interaction);
        } catch (e) {
            console.error(e);
            await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
        }
	},
};
