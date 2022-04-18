const checkUserPerms = require('../util/checkMemberPermissions');
const guildModel = require('../models/guild/guildModel.js');
const guildChannelModel = require('../models/guild/guildChannelModel.js');


module.exports = {
  name: 'interactionCreate',
  async execute(interaction) {
    try {
      await guildModel.cache.load(interaction.guild);
      await guildChannelModel.cache.load(interaction.channel);

      if (interaction.channel.appData.noCommand
        && !interaction.member.permissionsIn(interaction.channel).has('MANAGE_GUILD')
      ) {
        return await interaction.reply({
          content: 'This is a noCommand channel, and you are not an admin.',
          ephemeral: true,
        });
      }

      if (interaction.guild.appData.commandOnlyChannel != 0
        && interaction.guild.appData.commandOnlyChannel != interaction.channel.id
        && !interaction.member.permissionsIn(interaction.channel).has('MANAGE_GUILD')
      ) {
        return await interaction.reply({
          content: `Commands can only be used in <#${interaction.guild.appData.commandOnlyChannel}> unless you are an admin.`,
          ephemeral: true,
        });
      }

      if (interaction.isButton() || interaction.isSelectMenu())
        await component(interaction);
      if (interaction.isUserContextMenu())
        await userCtx(interaction);

      if (!interaction.isCommand() && !interaction.isAutocomplete()) return;

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

      if (!command) return console.log('No command found: ', path);

      console.log(path);

      if ([
        'settings', 'config',
      ].includes(interaction.commandName) && !checkUserPerms(interaction)) return console.log('Perms failed: ', path);

      if (interaction.isCommand()) await command.execute(interaction);
      else if (interaction.isAutocomplete()) await command.autocomplete(interaction);
    } catch (e) {
      console.error(e);
      await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
    }
  },
};

const component = async (interaction) => {
  if (interaction.customId.split(' ')[0] === 'ignore') return;
  const command = interaction.client.commands.get(interaction.customId.split(' ')[0]);

  if (!command) return;

  try {
    await command.component(interaction);
  } catch (e) {
    console.error(e);
    await interaction.reply({ content: 'There was an error while executing this component!', ephemeral: true });
  }
};

const userCtx = async (interaction) => {
  const command = interaction.client.commands.get(`contextMenus/${interaction.commandName}.js`);
  try {
    await command.execute(interaction);
  } catch (e) {
    console.error(e);
    await interaction.reply({ content: 'There was an error while executing this interaction!', ephemeral: true });
  }
};
