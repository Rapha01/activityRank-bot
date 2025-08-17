import { readFile, writeFile } from 'node:fs/promises';
import { CliPrettify } from 'markdown-table-prettify';

const files = [
  new URL('../schemas/manager.md', import.meta.url),
  new URL('../schemas/shard.md', import.meta.url),
];

for (const file of files) {
  const content = await readFile(file, 'utf-8');
  const pretty = CliPrettify.prettify(content);
  await writeFile(file, pretty);
}
