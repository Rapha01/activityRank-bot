module.exports = {
	name: 'interactionCreate',
	async execute(interaction) {
        if (!interaction.isCommand()) return;

        const command = client.commands.get(interaction.commandName);

        if (!command) return;

        try {
            await command.execute(interaction);
        } catch (e) {
            console.error(e);
            await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
        }
	},
};
