// Headless smoke test of the embeddable bust widget (bust.html): loads, drives the API, screenshots.
/* global window */
import { spawn } from 'node:child_process';
import { chromium } from 'playwright-core';

const port = 8500 + Math.floor(Math.random() * 100);
const server = spawn(process.execPath, ['scripts/serve.mjs', '.', String(port)], { stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 400));
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 800, height: 600 } });
const errs = [];
p.on('pageerror', (e) => errs.push(e.message));
p.on('response', (r) => r.status() >= 400 && !r.url().endsWith('favicon.ico') && errs.push(`${r.status()} ${r.url()}`));
await p.goto(`http://localhost:${port}/prototype/bust.html`);
await p.waitForFunction(() => window.bust);
const events = await p.evaluate(() => {
  const B = window.bust, got = [];
  B.stop();
  B.on('hit', (e) => got.push(e.type));
  B.setExpression('angry').yell(0.9);
  B.advance(50);
  B.hit(1);
  B.advance(4);
  return got;
});
await p.locator('#bust').screenshot({ path: process.argv[2] || 'work/bust.png' });
console.log('events', events, 'errors', errs);
await b.close();
server.kill();
process.exit(errs.length ? 1 : 0);
