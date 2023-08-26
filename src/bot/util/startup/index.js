// GENERATED: this file has been altered by `relative-named-imports`.
// [GENERATED: relative-named-imports:v0]

// GENERATED: added extension to relative import
// import cmdLoader from './cmdLoader';
import cmdLoader from './cmdLoader.js';
// GENERATED: added extension to relative import
// import eventLoader from './eventLoader';
import eventLoader from './eventLoader.js';

export default function load(client) {
  cmdLoader(client);
  eventLoader(client);
};
