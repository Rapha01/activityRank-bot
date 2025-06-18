#!/usr/bin/env node --experimental-strip-types --no-warnings

import { Builtins, Cli } from 'clipanion';
import { DeployCommand, DeployProductionCommand } from './commands/deploy.ts';
import { ClearCommand } from './commands/clear.ts';
import { CommandsCommand } from './commands/commands.ts';
import { GenerateCommand } from './commands/generate.ts';
import { ValidateCommand } from './commands/validate.ts';
import { EmojiDeployCommand } from './commands/emoji.ts';
import { ExportCommand } from './commands/export.ts';

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
cli.register(CommandsCommand);
cli.register(EmojiDeployCommand);
cli.register(GenerateCommand);
cli.register(ValidateCommand);
cli.register(ExportCommand);
cli.register(Builtins.HelpCommand);
cli.runExit(args);
