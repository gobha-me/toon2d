#!/usr/bin/env node
// Serve a project folder for manual play: node scripts/serve.mjs <dir> [port=8080]
import { startServer } from './lib/serve.mjs';

const [dir = '.', port = '8080'] = process.argv.slice(2);
const s = await startServer(dir, Number(port));
console.log(`serving ${dir} at ${s.url}`);
