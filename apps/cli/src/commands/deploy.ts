import * as p from '@clack/prompts';
import { Command, Option } from 'clipanion';
import type { RESTPutAPIApplicationGuildCommandsJSONBody } from 'discord-api-types/v10';
import pc from 'picocolors';
import t from 'typanion';
import { ConfigurableCommand2 } from '../util/classes.ts';
import { Deploy } from '../util/commandSchema.ts';

export class DeployCommand extends ConfigurableCommand2 {
  static override paths = [['deploy']];
  static override usage = Command.Usage({
    category: 'Deploy',
    description: 'Deploy Slash Commands to Discord.',
    details: `
      Deploy the bot's Slash Commands.

      If a list of guild IDs is provided, all \`Global\` and \`LocalOnly\` commands will be deployed 
      to the list of guild IDs. Otherwise, they will be deployed to the list defined in \`config.developmentServers\`.
    `,
    examples: [
      ['Deploy to `config.developmentServers`', '$0 deploy'],
      ['Deploy all global commands (to **ALL SERVERS**)', '$0 deploy global'],
      ['Deploy to a specific list of servers', '$0 deploy 123456789123456789 234567890234567890'],
    ],
  });

  global = Option.Boolean('-g,--global', {
    description: 'Whether to deploy commands globally.',
    required: false,
  });

  local = Option.Array('-l,--local', {
    description: 'Guilds to deploy local commands into.',
    required: false,
  });

  globalDeploy = Option.String('--deploy-global', {
    description:
      'How to deploy Global commands (default: `global`). \
      Setting `--deploy-global=local` deploys global commands as local commands.',
    required: false,
    validator: t.isOneOf([t.isLiteral('global'), t.isLiteral('local'), t.isLiteral('never')]),
  });

  override async execute() {
    p.intro(pc.bgCyan(pc.blackBright('  Deploy Commands  ')));

    const { api, config } = await this.loadBaseConfig();

    const ownUser = await api.users.getCurrent();

    p.log.info(
      `Deploying Commands For: ${pc.blueBright(`${ownUser.username}#${ownUser.discriminator}`)} (${pc.dim(ownUser.id)})`,
    );

    this.globalDeploy ??= 'global';

    const commands = await this.getDeployableCommands();

    const globalCommands: RESTPutAPIApplicationGuildCommandsJSONBody = commands.filter(
      (c) => c.deployment === Deploy.Global,
    );
    const localCommands: RESTPutAPIApplicationGuildCommandsJSONBody =
      this.globalDeploy === 'local'
        ? commands.filter(
            (c) => c.deployment === Deploy.LocalOnly || c.deployment === Deploy.Global,
          )
        : commands.filter((c) => c.deployment === Deploy.LocalOnly);

    if (this.global && this.globalDeploy === 'never') {
      p.log.warn(
        `Skipped deploying commands globally because ${pc.magenta('--deploy-global=never')}`,
      );
    } else if (this.global && this.globalDeploy === 'global') {
      const confirm = await p.confirm({
        message: `Are you sure you would like to ${pc.bold(`deploy ${pc.green(globalCommands.length)} global commands`)}?`,
        initialValue: true,
      });
      if (p.isCancel(confirm)) {
        p.cancel('Cancelled.');
        return 8;
      }
      if (confirm) {
        const spin = p.spinner();
        spin.start('Deploying global commands');
        await api.applicationCommands.bulkOverwriteGlobalCommands(ownUser.id, globalCommands);
        spin.stop('Deployed global commands');
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
        message: `Confirm which guilds you would like to ${pc.bold(`update ${pc.green(localCommands.length)} local commands in`)}.`,
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
        spin.start('Deploying local commands');

        for (const guildId of selected) {
          const name = validGuilds.find((g) => g.id === guildId)?.guild.name;
          spin.message(`Deploying local commands • ${name}`);
          await api.applicationCommands.bulkOverwriteGuildCommands(
            ownUser.id,
            guildId,
            localCommands,
          );
        }
        spin.stop('Deployed local commands');
      }
    }
  }
}
