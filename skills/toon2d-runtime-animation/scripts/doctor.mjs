#!/usr/bin/env node
// Environment check for the skill's scripts. Run this first on a new machine.
//   node scripts/doctor.mjs
// Prints Node version, the browser capture/score will use, the temp dir, and runs a 1-page smoke launch.
import { tmpdir } from 'node:os';
import { findChrome, launch } from './lib/cdp.mjs';

const major = Number(process.versions.node.split('.')[0]);
console.log(`node      ${process.version} ${major >= 22 ? 'ok' : 'NEED >= 22 (global WebSocket)'}`);
let exe = null;
try {
  exe = findChrome();
  console.log(`browser   ${exe}${process.env.CHROME_PATH ? ' (CHROME_PATH)' : ' (auto)'}`);
} catch (e) {
  console.log(`browser   NOT FOUND: ${e.message} Install chromium or set CHROME_PATH to any Chromium-based browser.`);
}
console.log(`tmpdir    ${tmpdir()} (Chrome profiles go here; set TMPDIR to move them)`);
if (exe) {
  const t0 = Date.now();
  try {
    const page = await launch();
    const v = await page.eval('1 + 1');
    await page.close();
    console.log(`smoke     ${v === 2 ? 'ok' : 'unexpected'} (${Date.now() - t0} ms)`);
  } catch (e) {
    console.log(`smoke     FAILED: ${e.message}`);
    process.exitCode = 1;
  }
}
