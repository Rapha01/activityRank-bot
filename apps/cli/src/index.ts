#!/usr/bin/env node --experimental-strip-types --no-warnings
import { Builtins, Cli } from 'clipanion';
import { DeployCommand, DeployProductionCommand } from './commands/deploy.ts';
import { ClearCommand, ClearProductionCommand } from './commands/clear.ts';
import { CommandsCommand } from './commands/commands.ts';

const [_node, _app, ...args] = process.argv;

const cli = new Cli({
  binaryLabel: 'ActivityRank CLI',
  binaryName: 'activityrank',
  binaryVersion: '1.0.0',
  enableCapture: true,
});

cli.register(DeployCommand);
cli.register(DeployProductionCommand);
cli.register(ClearCommand);
cli.register(ClearProductionCommand);
cli.register(CommandsCommand);
cli.register(Builtins.HelpCommand);
cli.runExit(args);
