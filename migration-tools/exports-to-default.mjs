const VERSION_KEY = 'exports-to-default:v0';

import { Parser } from 'acorn';
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
const files = await getFiles(fileURLToPath(path));

console.log('running exports-to-default on files:');
console.log(files);
console.log('Found', files.length, 'files');

/// parsing

const modifiedFiles = [];

for (const file of files) {
  console.log(`processing file ${file}`);
  let contents = await readFile(file);

  let ast;
  try {
    ast = Parser.parse(contents, { sourceType: 'module', ecmaVersion: '2022' });
  } catch (e) {
    console.log('Error parsing AST of file', file);
    console.log(e);
    continue;
  }

  if (!ast) throw new Error(`AST not properly generated (${file})`);

  if (contents.includes(`[GENERATED: ${VERSION_KEY}]`)) {
    console.log(`ignoring file ${file}: pregenerated`);
    continue;
  }

  if (ast.body.some((node) => node.type === 'ExportDefaultDeclaration')) {
    console.log(`ignoring file ${file}: has existing default declaration`);
    continue;
  }

  if (!ast.body.some((node) => node.type === 'ExportNamedDeclaration')) {
    console.log(`ignoring file ${file}: has no named declarations`);
    return;
  }

  contents +=
    '\n\n// GENERATED: start of generated content by `exports-to-default`.\n';
  contents += `// [GENERATED: ${VERSION_KEY}]\n\n`;
  contents += 'export default {\n';

  for (const parentnode of ast.body.filter(
    (node) => node.type === 'ExportNamedDeclaration',
  )) {
    const node = parentnode.declaration;
    if (node.type === 'VariableDeclaration')
      contents += `    ${node.declarations[0].id.name},\n`;
    else if (node.type === 'FunctionDeclaration')
      contents += `    ${node.id.name},\n`;
    else throw new Error(`unknown node ${node.type}`);
  }

  contents +=
    '}\n\n// GENERATED: end of generated content by `exports-to-default`.\n\n';

  await writeFile(file, contents);
  modifiedFiles.push(file);
}

await writeFile(
  fileURLToPath(await import.meta.resolve('./undo.log')),
  JSON.stringify(modifiedFiles, null, 2),
);
