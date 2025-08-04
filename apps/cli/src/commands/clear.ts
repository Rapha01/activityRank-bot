import * as p from '@clack/prompts';
import { Command, Option } from 'clipanion';
import pc from 'picocolors';
import { ConfigurableCommand2 } from '../util/classes.ts';

export class ClearCommand extends ConfigurableCommand2 {
  static override paths = [['clear']];
  static override usage = Command.Usage({
    category: 'Deploy',
    description: 'Clear Slash Commands.',
    details: "Clears the bot's Slash Commands. This command should mostly be used in development.",
    examples: [
      ['Clear slash commands globally', '$0 clear --global'],
      ['Clear slash commands from a single server', '$0 clear --local <serverId>'],
      [
        'Clear slash commands from multiple servers',
        '$0 clear --local <serverId1> --local <serverId2>',
      ],
      [
        'Clear slash commands globally and local commands from a single server',
        '$0 clear --global --local <serverId>',
      ],
    ],
  });

  global = Option.Boolean('-g,--global', {
    description: 'Whether to clear globally deployed commands.',
    required: false,
  });

  local = Option.Array('-l,--local', {
    description: 'Guilds to clear local commands from.',
    required: false,
  });

  override async execute() {
    p.intro(pc.bgCyan(pc.blackBright('  Clear Commands  ')));

    const { api, config } = await this.loadBaseConfig();

    const ownUser = await api.users.getCurrent();

    p.log.info(
      `Clearing Commands For: ${pc.blueBright(`${ownUser.username}#${ownUser.discriminator}`)} (${pc.dim(ownUser.id)})`,
    );

    if (this.global) {
      const confirm = await p.confirm({
        message: `Are you sure you would like to ${pc.bold(pc.red('clear all global commands'))}?`,
        initialValue: false,
      });
      if (p.isCancel(confirm)) {
        p.cancel('Cancelled.');
        return 8;
      }
      if (confirm) {
        const spin = p.spinner();
        spin.start('Clearing global commands');
        await api.applicationCommands.bulkOverwriteGlobalCommands(ownUser.id, []);
        spin.stop('Cleared global commands');
      }
    }

    if (this.local) {
      const localServers = new Set([...this.local, ...config.developmentServers]);
      const guildsData = await Promise.all(
        [...localServers].map(
          async (id) =>
            await api.guilds.get(id).then(
              (guild) => ({ success: true as const, id, guild }),
              () => ({ success: false as const, id }),
            ),
        ),
      );

      for (const guild of guildsData.filter((s) => !s.success)) {
        p.log.warn(`Failed to fetch server ${pc.underline(pc.yellow(guild.id))}.`);
      }

      const validGuilds = guildsData.filter((s) => s.success);

      const selected = await p.multiselect({
        message: `Confirm which guilds you would like to ${pc.bold(pc.red('clear local commands from'))}.`,
        options: validGuilds.map(({ guild }) => ({
          value: guild.id,
          label: guild.name,
          hint: `${guild.id}${config.developmentServers.includes(guild.id) ? ` • from ${pc.blue('config.developmentServers')}` : ''}`,
        })),
        // all guilds are selected by default
        initialValues: validGuilds.map((guild) => guild.id),
      });

      if (p.isCancel(selected)) {
        p.cancel('Cancelled.');
        return 8;
      }

      if (selected.length > 0) {
        const spin = p.spinner();
        spin.start('Clearing local commands');

        for (const guildId of selected) {
          const name = validGuilds.find((g) => g.id === guildId)?.guild.name;
          spin.message(`Clearing local commands • ${name}`);
          await api.applicationCommands.bulkOverwriteGuildCommands(ownUser.id, guildId, []);
        }
        spin.stop('Cleared local commands');
      }
    }
  }
}
