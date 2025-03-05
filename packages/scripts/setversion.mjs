#!/usr/bin/env node

import process from 'node:process';
import path from 'node:path';
import { readFile, writeFile } from 'node:fs/promises';

const [_node, _app, filepath_r, newversion] = process.argv;

if (!newversion) {
  console.error(
    'Invalid arguments.\n\nUsage: setversion <path> <version>\n\n    path: A path to a `package.json` file that needs to be edited.\n    version: The new version of the `package.json` file. Must be SemVer-compatible.',
  );
  process.exit(1);
}

// The path to the package.json file to modify
const filepath = path.resolve(filepath_r);

// https://semver.org/#is-there-a-suggested-regular-expression-regex-to-check-a-semver-string
const SEMVER_REGEX =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;

if (!SEMVER_REGEX.test(newversion)) {
  throw new Error('`newversion` is not a valid SemVer version.');
}

const content = JSON.parse(await readFile(filepath));

if (!SEMVER_REGEX.test(content.version)) {
  throw new Error(
    `The current value of the \`version\` field of ${filepath} is not a valid SemVer version.`,
  );
}

content.version = newversion;

await writeFile(filepath, JSON.stringify(content, null, 4));
