// Headless smoke test + screenshots. Serves the repo root so the page loads
// from a SUB-PATH (/prototype/), proving relative asset paths work.
// Usage: node scripts/shots.mjs [outDir]   (needs playwright-core + a Chrome/Chromium)
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import { chromium } from 'playwright-core';

const out = process.argv[2] || 'shots';
mkdirSync(out, { recursive: true });
const port = 8093;
const server = spawn(process.execPath, ['scripts/serve.mjs', '.', String(port)], { stdio: 'ignore' });
const base = `http://localhost:${port}/prototype/index.html`;
const exe = [process.env.CHROME_PATH, '/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser'].find((p) => p && existsSync(p));

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const problems = [];
let browser;
try {
  await sleep(400);
  browser = await chromium.launch({ executablePath: exe, headless: true });
  const page = await browser.newPage({ viewport: { width: 1300, height: 600 } });
  page.on('console', (m) => {
    if (m.type() === 'error' || m.type() === 'warning') problems.push(`${m.type()}: ${m.text()}`);
  });
  page.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`));
  page.on('requestfailed', (r) => problems.push(`requestfailed: ${r.url()}`));
  const canvas = () => page.locator('#game');

  // 1. idle, neutral
  await page.goto(base);
  await page.waitForFunction(() => window.toon && window.toon.game.time > 1.5);
  await canvas().screenshot({ path: `${out}/01-idle-neutral.png` });

  // 2. running, happy (mood kicks in after ~0.35 s of running)
  await page.keyboard.down('ArrowRight');
  await sleep(1300);
  await canvas().screenshot({ path: `${out}/02-running-happy.png` });
  await page.keyboard.up('ArrowRight');
  await sleep(600);

  // 3. run off the high platform -> big drop -> surprised
  await page.evaluate(() => window.toon.teleport(985, 300));
  await sleep(700);
  await page.keyboard.down('ArrowRight');
  await page.waitForFunction(() => !window.toon.game.body.grounded && window.toon.game.body.x > 1032, null, { timeout: 3000 });
  await sleep(260);
  await canvas().screenshot({ path: `${out}/03-midjump-surprised.png` });
  await page.keyboard.up('ArrowRight');
  await sleep(800);

  // 4. debug overlay + face panel, smug pinned
  await page.goto(`${base}?debug=1`);
  await page.waitForFunction(() => window.toon && window.toon.game.time > 0.5);
  await page.getByRole('button', { name: 'smug', exact: true }).click();
  await sleep(1200);
  await page.screenshot({ path: `${out}/04-debug-face-sliders.png` });

  if (process.env.EXTRA) {
    // extra self-check frames (not part of the deliverable)
    await page.goto(base);
    await page.waitForFunction(() => window.toon && window.toon.game.time > 0.5);
    for (const e of ['happy', 'angry', 'sad', 'surprised', 'smug', 'hurt', 'determined', 'neutral']) {
      await page.evaluate((x) => window.toon.pin(x), e);
      await sleep(700);
      await canvas().screenshot({ path: `${process.env.EXTRA}/expr-${e}.png`, clip: undefined });
    }
    await page.evaluate(() => window.toon.pin(null));
    // charge
    await page.keyboard.down('Space');
    await sleep(500);
    await canvas().screenshot({ path: `${process.env.EXTRA}/charge.png` });
    await page.keyboard.up('Space');
    await sleep(250);
    await canvas().screenshot({ path: `${process.env.EXTRA}/jump.png` });
    await sleep(1500);
    // slope idle
    await page.evaluate(() => window.toon.teleport(800, 600));
    await sleep(1500);
    await canvas().screenshot({ path: `${process.env.EXTRA}/slope-idle.png` });
    await page.evaluate(() => window.toon.teleport(1420, 640));
    await sleep(1200);
    await canvas().screenshot({ path: `${process.env.EXTRA}/slope-down-idle.png` });
    // spikes
    await page.evaluate(() => window.toon.teleport(1600, 700));
    await sleep(500);
    await page.keyboard.down('ArrowRight');
    await page.waitForFunction(() => window.toon.game.body.hurtTime > 0, null, { timeout: 3000 });
    await page.keyboard.up('ArrowRight');
    await sleep(150);
    await canvas().screenshot({ path: `${process.env.EXTRA}/hurt.png` });
    await page.evaluate(() => window.toon.say('Mama mia, papa pia!'));
    await sleep(1500);
    await canvas().screenshot({ path: `${process.env.EXTRA}/talk.png` });
  }
} catch (e) {
  problems.push(`script: ${e.stack || e}`);
} finally {
  if (browser) await browser.close();
  server.kill();
}
if (problems.length) {
  console.error(`PROBLEMS (${problems.length}):\n${problems.join('\n')}`);
  process.exitCode = 1;
} else {
  console.log(`OK: no console errors; screenshots in ${out}/`);
}
