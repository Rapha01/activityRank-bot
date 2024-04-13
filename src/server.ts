import { createServer } from 'node:http';
import { toNodeListener } from 'h3';
import { app } from './app.js';

createServer(toNodeListener(app)).listen(process.env.PORT || 3000);
console.info(`Server listening on port ${process.env.PORT || 3000}`);
