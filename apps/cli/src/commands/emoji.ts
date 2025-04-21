import { join as joinPath } from 'node:path';
import TOML from 'smol-toml';
import { z } from 'zod';
import * as p from '@clack/prompts';
import pc from 'picocolors';
import { Command, UsageError } from 'clipanion';
import { ConfigurableCommand } from '../util/classes.ts';
import { readFile } from 'node:fs/promises';

export class EmojiDeployCommand extends ConfigurableCommand {
  static override paths = [['emoji', 'deploy']];
  static override usage = Command.Usage({
    category: 'Deploy',
    description: "Update the bot's Bot Emoji.",
    details: 'Reading from `packages/assets/emoji`, allows deletion and addition of Bot Emoji.',
  });

  override async execute() {
    p.intro(pc.bgCyan(pc.blackBright('  Emoji Deployment  ')));

    await super.execute();

    const spin = p.spinner();
    spin.start('Loading internal resources...');

    const api = this.getApi();
    const botInfo = await api.applications.getCurrent();

    spin.stop('Loaded internals');

    const currentlyDeployedEmojis = await api.applications.getEmojis(botInfo.id);
    const currentlyDeployedEmojiNames = new Set(
      currentlyDeployedEmojis.items.map((e) => e.name as string),
    );
    const awaitedEmojis = await this.loadEmojis();
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
        options: deleting.map((del) => ({ label: del.name, value: del.id })),
        required: false,
      });

      if (p.isCancel(rm)) {
        p.cancel('Cancelled operation.');
        return;
      }

      for (const id of rm) {
        await api.applications.deleteEmoji(botInfo.id, id);
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
          image: await this.loadEmojiFile(awaitedEmojis[name].path),
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
          image: await this.loadEmojiFile(awaitedEmojis[emoji.name].path),
        });
      }

      p.log.success(`Recreated ${edit.length} emoji${plural(edit.length)}`);
    }
  }

  async loadEmojis() {
    const wsRoot = await this.findWorkspaceRoot();
    if (!wsRoot) {
      throw new UsageError(
        'Could not find workspace root. Either provide an `--output` option or use an ActivityRank workspace.',
      );
    }
    const manifestPath = joinPath(wsRoot, 'packages/assets/manifest.toml');
    const manifestContent = TOML.parse((await readFile(manifestPath)).toString());
    const manifest = manifestSchema.parse(manifestContent);
    return manifest;
  }

  async loadEmojiFile(path: string): Promise<string> {
    const wsRoot = await this.findWorkspaceRoot();
    if (!wsRoot) {
      throw new UsageError(
        'Could not find workspace root. Either provide an `--output` option or use an ActivityRank workspace.',
      );
    }

    const assetPath = joinPath(wsRoot, 'packages/assets/', path);
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
