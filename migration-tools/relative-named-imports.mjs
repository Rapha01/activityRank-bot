/* 
REGEX TESTED ON:

import { EmbedBuilder, SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { PRIVILEGE_LEVELS } from '../../const/privilegedUsers.js';
import TEST, { PRIVILEGE_LEVELS } from '../../const/privilegedUsers.js';

import { PRIVILEGE_LEVELS } from './../const/privilegedUsers';
import TEST, { PRIVILEGE_LEVELS } from '.../const/privilegedUsers';

import TEST, {a as b} from 'test';
*/

const VERSION_KEY = 'relative-named-imports:v0';

import pm from 'picomatch';
import { resolve } from 'node:path';
import { readFile, readdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

console.log('argv', process.argv);

// gather files

const matcher = pm('**/*.js');

async function getFiles(dir) {
  const dirents = await readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    dirents.map((dirent) => {
      const res = resolve(dir, dirent.name);
      return dirent.isDirectory() ? getFiles(res) : matcher(res) ? res : false;
    }),
  );
  return files.flat().filter(Boolean);
}

const path = await import.meta.resolve(`../${process.argv[2]}`);
const files = (await getFiles(fileURLToPath(path))).slice(0, 10);

console.log(`running ${VERSION_KEY} on files:`);
console.log(files);
console.log('Found', files.length, 'files');

/// parsing

const modifiedFiles = [];

for (const file of files) {
  console.log(`processing file ${file}`);
  let contents = (await readFile(file)).toString();

  const lines = contents.split('\n');

  let didAlter = false;

  for (const [i, line] of lines.entries()) {
    const regex =
      /(?<=import ?(?:.+,)? ?{.+} ?from ?['"])(\..+(?<!\.js))(?=['"];?)/gim;
    if (regex.test(line)) {
      lines[
        i
      ] = `// GENERATED: added extension to relative import\n// ${line}\n${line.replace(
        regex,
        '$&.js',
      )}`;
      didAlter = true;
    }
  }

  if (contents.includes(`[GENERATED: ${VERSION_KEY}]`)) {
    console.log(`ignoring file ${file}: pregenerated`);
    continue;
  }

  if (!didAlter) continue;

  let newContents =
    '// GENERATED: this file has been altered by `relative-named-imports`.\n';
  newContents += `// [GENERATED: ${VERSION_KEY}]\n\n`;

  await writeFile(file, newContents + lines.join('\n'));
  modifiedFiles.push(file);
}

await writeFile(
  fileURLToPath(await import.meta.resolve('./undo.log')),
  JSON.stringify(modifiedFiles, null, 2),
);
