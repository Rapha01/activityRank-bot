#!/usr/bin/env node --experimental-strip-types --no-warnings

import { Builtins, Cli } from 'clipanion';
import { ClearCommand } from './commands/clear.ts';
import { CommandsCommand } from './commands/commands.ts';
import { DeployCommand } from './commands/deploy.ts';
import { EmojiDeployCommand } from './commands/emoji.ts';
import { ExportCommand } from './commands/export.ts';
import { GenerateCommand } from './commands/generate.ts';
import { UpdateConfigCommand } from './commands/update-configs.ts';
import { ValidateCommand } from './commands/validate.ts';

const [_node, _app, ...args] = process.argv;

const cli = new Cli({
  binaryLabel: 'ActivityRank CLI',
  binaryName: 'activityrank',
  binaryVersion: '1.0.0',
  enableCapture: true,
});

cli.register(DeployCommand);
cli.register(ClearCommand);
cli.register(CommandsCommand);
cli.register(EmojiDeployCommand);
cli.register(GenerateCommand);
cli.register(ValidateCommand);
cli.register(ExportCommand);
cli.register(UpdateConfigCommand);
cli.register(Builtins.HelpCommand);
cli.runExit(args);
