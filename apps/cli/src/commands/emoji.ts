import { join as joinPath } from 'node:path';
import TOML from 'smol-toml';
import { z } from 'zod';
import * as p from '@clack/prompts';
import pc from 'picocolors';
import { Command, Option } from 'clipanion';
import { readFile, writeFile } from 'node:fs/promises';
import type { Writable } from 'node:stream';
import { createWriteStream } from 'node:fs';
import { ConfigurableCommand2 } from '../util/classes.ts';
import { findWorkspaceRoot } from '../util/loaders.ts';

export class EmojiDeployCommand extends ConfigurableCommand2 {
  static override paths = [['emoji', 'deploy']];
  static override usage = Command.Usage({
    category: 'Deploy',
    description: "Update the bot's Bot Emoji.",
    details: 'Reading from `packages/assets/emoji`, allows creation and deletion of Bot Emoji.',
  });

  outputFile = Option.String('-o,--output', {
    required: false,
    description:
      'The file to output emoji typings to. Use `-` to output to stdout. Defaults to `apps/bot/src/const/emoji.generated.ts`.',
  });

  updateConfig = Option.Boolean('-u,--update,--update-cfg', {
    required: false,
    description: 'Whether to update the IDs in `config/emoji.json`.',
  });

  override async execute() {
    p.intro(pc.bgCyan(pc.blackBright('  Emoji Deployment  ')));

    const { api } = await this.loadBaseConfig();
    const workspaceRoot = await findWorkspaceRoot(
      `Could not find the root of the ${pc.cyan('activityrank')} monorepo. A properly configured ActivityRank workspace is necessary for this command to function.`,
    );

    const spin = p.spinner();
    spin.start('Loading...');

    const botInfo = await api.applications.getCurrent();

    let outputStream: Writable;
    let outputDisplay: string;

    if (this.outputFile) {
      if (this.outputFile.trim() === '-') {
        outputStream = process.stdout;
        outputDisplay = 'stdout';
      } else {
        outputStream = createWriteStream(this.outputFile);
        outputDisplay = this.outputFile;
      }
    } else {
      const outputFile = joinPath(workspaceRoot, 'apps/bot/src/const/emoji.generated.ts');
      outputStream = createWriteStream(outputFile);
      outputDisplay = outputFile;
    }

    spin.stop('Loading...complete');

    const currentlyDeployedEmojis = await api.applications.getEmojis(botInfo.id);
    const currentlyDeployedEmojiNames = new Set(
      currentlyDeployedEmojis.items.map((e) => e.name as string),
    );
    const awaitedEmojis = await this.loadEmojiManifest(workspaceRoot);
    const awaitedEmojiNames = new Set(Object.keys(awaitedEmojis));

    const deleting = currentlyDeployedEmojis.items
      .filter((e) => !awaitedEmojiNames.has(e.name as string))
      .map((e) => ({ name: e.name as string, id: e.id as string }));
    const editing = [...currentlyDeployedEmojiNames]
      .filter((a) => awaitedEmojiNames.has(a))
      .map((name) => {
        const id = currentlyDeployedEmojis.items.find((e) => e.name === name)?.id;
        if (!id) {
          throw new Error(
            'unreachable invariant; `editing` depends on `currentlyDeployedEmojis.items`',
          );
        }
        return { name, id };
      });
    const adding = [...awaitedEmojiNames].filter((a) => !currentlyDeployedEmojiNames.has(a));

    p.log.info(`Currently deployed emojis: ${[...currentlyDeployedEmojiNames].join(', ')}`);
    p.log.info(`Available emojis: ${[...awaitedEmojiNames].join(', ')}`);

    const plural = (n: number) => (n === 1 ? '' : 's');
    if (deleting.length > 0) {
      const rm = await p.multiselect({
        message: 'Choose which emojis to delete.',
        options: deleting.map((del) => ({ label: del.name, value: del })),
        required: false,
      });

      if (p.isCancel(rm)) {
        p.cancel('Cancelled operation.');
        return;
      }

      for (const del of rm) {
        await api.applications.deleteEmoji(botInfo.id, del.id);
      }

      p.log.success(`Deleted ${rm.length} emoji${plural(rm.length)}`);
    }

    if (adding.length > 0) {
      const add = await p.multiselect({
        message: 'Choose which emojis to add.',
        options: adding.map((name) => ({ label: name, value: name })),
        required: false,
      });

      if (p.isCancel(add)) {
        p.cancel('Cancelled operation.');
        return;
      }

      for (const name of add) {
        await api.applications.createEmoji(botInfo.id, {
          name,
          image: await this.loadEmojiFile(awaitedEmojis[name].path, workspaceRoot),
        });
      }

      p.log.success(`Created ${add.length} emoji${plural(add.length)}`);
    }

    if (editing.length > 0) {
      const edit = await p.multiselect({
        message: 'Choose which emojis to update.',
        options: editing.map((e) => ({ label: e.name, value: e })),
        required: false,
      });

      if (p.isCancel(edit)) {
        p.cancel('Cancelled operation.');
        return;
      }

      for (const emoji of edit) {
        // the image of an emoji cannot be edited; only the name -
        // therefore we recreate the edited emoji.
        await api.applications.deleteEmoji(botInfo.id, emoji.id);
        await api.applications.createEmoji(botInfo.id, {
          name: emoji.name,
          image: await this.loadEmojiFile(awaitedEmojis[emoji.name].path, workspaceRoot),
        });
      }

      p.log.success(`Recreated ${edit.length} emoji${plural(edit.length)}`);
    }

    outputStream.write(
      [
        `/* 🛠️ This file was generated with \`activityrank emoji deploy\` on ${new Date().toDateString()}. */\n\n`,
        `export type EmojiNames = ${[...awaitedEmojiNames].map((n) => `'${n}'`).join(' | ')};\n`,
      ].join('\n'),
    );

    if (!this.updateConfig) {
      p.outro(`Emoji typings written to ${pc.gray(outputDisplay)}`);
      return;
    }
    p.log.success(`Emoji typings written to ${pc.gray(outputDisplay)}`);

    const emojiFilePath = joinPath(workspaceRoot, 'config/emoji.json');
    const emojiFile = (await readFile(emojiFilePath)).toString();
    const emojiFileData = JSON.parse(emojiFile);

    const currentEmojis = await api.applications.getEmojis(botInfo.id);
    const currentEmojiNames = currentEmojis.items.map((e) => {
      if (!e.name) throw new Error();
      return e.name;
    });

    function arraysAreEqual(a: string[], b: string[]): boolean {
      return a.length === b.length && a.every((v, i) => v === b[i]);
    }

    if (!arraysAreEqual([...Object.keys(emojiFileData)].sort(), currentEmojiNames.sort())) {
      p.log.warn(
        'The keys listed in `config/emoji.json` are different from those currently in the bot.',
      );
      const confirm = await p.confirm({
        message: 'Are you sure you would like to continue?',
      });

      if (p.isCancel(confirm) || !confirm) {
        p.cancel('Cancelled operation.');
        return;
      }
    }

    await writeFile(
      emojiFilePath,
      JSON.stringify(Object.fromEntries(currentEmojis.items.map((e) => [e.name, e.id])), null, 2),
    );

    p.outro(`Emoji IDs written to ${pc.gray('config/emoji.json')}`);
  }

  async loadEmojiManifest(workspaceRoot: string) {
    const manifestPath = joinPath(workspaceRoot, 'packages/assets/manifest.toml');
    const manifestContent = TOML.parse((await readFile(manifestPath)).toString());
    const manifest = manifestSchema.parse(manifestContent);
    return manifest;
  }

  async loadEmojiFile(path: string, workspaceRoot: string): Promise<string> {
    const assetPath = joinPath(workspaceRoot, 'packages/assets/', path);
    const filetype = assetPath.split('.').at(-1);
    if (!filetype || !['png', 'jpeg', 'gif'].includes(filetype)) {
      throw new Error(
        `Invalid filetype "${filetype}" from image "${path}"; expected "png", "jpeg", "gif"`,
      );
    }

    const file = await readFile(assetPath);
    return `data:image/${filetype};base64,${file.toString('base64')}`;
  }
}

const manifestSchema = z.record(z.object({ path: z.string() }));
