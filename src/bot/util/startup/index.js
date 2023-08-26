import cmdLoader from './cmdLoader';
import eventLoader from './eventLoader';

export default function load(client) {
  cmdLoader(client);
  eventLoader(client);
};
