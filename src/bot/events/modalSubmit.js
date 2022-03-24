module.exports = {
  name: 'modalSubmit',
  async execute(interaction) {
    try {
      const command = interaction.client.commands.get(interaction.customId.split(' ')[0]);

      if (!command) return;

      await command.modal(interaction);

    } catch (e) {
      console.error(e);
    }
  },
};
