module.exports = {
  name: 'modalSubmit',
  async execute(interaction) {
    try {
      let path = 'commandsSlash';
      path = path.concat('/', interaction.commandName);
      const group = await interaction.options.getSubcommandGroup(false);
      const sub = await interaction.options.getSubcommand(false);
      if (group)
        path = path.concat('/', group);
      if (sub)
        path = path.concat('/', sub);
      path = path.concat('.js');
      const command = interaction.client.commands.get(path);

      if (!command) return;

      await command.modal(interaction);
    } catch (e) {
      console.error(e);
    }
  },
};
