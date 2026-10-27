// Headless capture for the review: serves the repo root (page loads from the /prototype/ SUB-PATH),
// pauses the loop and steps window.lifelike.advance() deterministically. Writes PNG frames.
// Usage: node scripts/shots.mjs <outDir>
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import { chromium } from 'playwright-core';

const out = process.argv[2] || 'work/raw';
mkdirSync(out, { recursive: true });
const port = 8197 + Math.floor(Math.random() * 100);
const server = spawn(process.execPath, ['scripts/serve.mjs', '.', String(port)], { stdio: 'ignore' });
const exe = [process.env.CHROME_PATH, '/usr/bin/google-chrome', '/usr/bin/chromium'].find((p) => p && existsSync(p));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const problems = [];
const pad = (i) => String(i).padStart(3, '0');
let browser;
try {
  await sleep(400);
  browser = await chromium.launch({ executablePath: exe, headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 1400 } });
  page.on('console', (m) => {
    if (m.type() === 'error' || m.type() === 'warning') problems.push(`${m.type()}: ${m.text()}`);
  });
  page.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`));
  page.on('requestfailed', (r) => problems.push(`requestfailed: ${r.url()}`));
  await page.goto(`http://localhost:${port}/prototype/index.html`);
  await page.waitForFunction(() => window.lifelike);
  await page.evaluate(() => {
    window.lifelike.settings.paused = true;
    // the older sets compare the rejected head-turn methods; the talk/speech sets switch view themselves
    window.lifelike.setFace(null, { view: 'turn' });
  });
  const body = page.locator('#bodyStage'), face = page.locator('#faceStage');
  const seq = async (loc, name, n, every, setup) => {
    await page.evaluate(setup);
    for (let i = 0; i < n; i++) {
      await page.evaluate((k) => window.lifelike.advance(k), every);
      await loc.screenshot({ path: `${out}/${name}-${pad(i)}.png` });
    }
  };
  const sets = (process.env.SETS || 'idle,walk,run,gambit,distract,breath,blend,lips,gstill,talk,speech,sstill,pain,debug').split(',');
  // idle: one breath cycle 3.6 s = 216 ticks, every 4 ticks
  if (sets.includes('idle')) await seq(body, 'idle', 54, 4, () => window.lifelike.reset('idle'));
  // walk: 2 cycles (2.2 s) at 30 fps
  if (sets.includes('walk')) await seq(body, 'walk', 66, 2, () => window.lifelike.reset('walk'));
  if (sets.includes('run')) await seq(body, 'run', 44, 2, () => window.lifelike.reset('run'));
  const shot = (name) => face.screenshot({ path: `${out}/${name}.png` });
  const ev = (fn, arg) => page.evaluate(fn, arg);
  // gambit: the whole scripted reel (~53 s) at 10 fps
  if (sets.includes('gambit')) {
    await seq(face, 'gambit', 530, 6, () => {
      window.lifelike.reset('idle');
      window.lifelike.setFace(null);
    });
  }
  // distracted: glance left, linger, snap back, glance right - all three turn methods side by side
  if (sets.includes('distract')) {
    await ev(() => {
      window.lifelike.reset('idle');
      window.lifelike.setFace('neutral', { distract: 0 });
      window.lifelike.advance(20);
      window.lifelike.face.glance(-1, 1.3);
    });
    for (let i = 0; i < 110; i++) {
      if (i === 52) await ev(() => window.lifelike.face.glance(1, 1.3));
      await ev(() => window.lifelike.advance(3));
      await shot(`distract-${pad(i)}`);
    }
  }
  // breathing: calm -> winded over 6 s, hold, at 12 fps
  if (sets.includes('breath')) {
    await seq(face, 'breath', 110, 5, () => {
      window.lifelike.reset('idle');
      window.lifelike.setFace('neutral', { breath: 0 });
      window.lifelike.advance(30);
      window.lifelike.setFace('neutral', { breath: 1, ramp: 6 });
    });
  }
  if (sets.includes('blend')) {
    const segs = [
      [{ distressed: 1 }, { breath: 1, ramp: 1.2, distract: 0 }, 36],
      [{ happy: 1 }, { breath: 0, ramp: 0.6, glance: [1, 1.4] }, 36],
      [{ sad: 0.6, surprised: 0.5 }, { breath: 0 }, 28],
      [{ angry: 0.8 }, { breath: 0.8, ramp: 1 }, 28],
    ];
    await ev(() => {
      window.lifelike.reset('idle');
      window.lifelike.setFace('neutral');
      window.lifelike.advance(10);
    });
    let i = 0;
    for (const [w, o, n] of segs) {
      await ev(([a, b]) => window.lifelike.setFace(a, b), [w, o]);
      for (let k = 0; k < n; k++) {
        await ev(() => window.lifelike.advance(5));
        await shot(`blend-${pad(i++)}`);
      }
    }
  }
  // lip doubling: the same mid-transition frame with the v1 morph, the fixed flow, fixed + short mouth dissolve
  if (sets.includes('lips')) {
    for (const ex of ['happy', 'surprised', 'winded']) {
      for (const fix of [0, 1, 2]) {
        await ev(([e, f]) => {
          window.lifelike.reset('idle');
          window.lifelike.face.takes = false;
          window.lifelike.setFace('neutral', { fix: f });
          window.lifelike.advance(60);
          if (e === 'winded') window.lifelike.setFace('neutral', { breath: 1, ramp: 0.01 });
          else window.lifelike.setFace(e);
          window.lifelike.advance(e === 'winded' ? 1 : 4);
        }, [ex, fix]);
        await shot(`lips-${ex}-${fix}`);
      }
    }
  }
  if (sets.includes('gstill')) {
    for (const e of ['neutral', 'happy', 'angry', 'sad', 'surprised', 'distressed']) {
      await ev((x) => {
        window.lifelike.reset('idle');
        window.lifelike.face.takes = false;
        window.lifelike.setFace(x);
        window.lifelike.advance(40);
      }, e);
      await shot(`gstill-${e}`);
    }
    await ev(() => {
      window.lifelike.reset('idle');
      window.lifelike.setFace('neutral', { breath: 1, ramp: 0.01 });
      window.lifelike.advance(100);
    });
    await shot('gstill-winded');
    for (const side of [-1, 1]) {
      await ev((sd) => {
        window.lifelike.reset('idle');
        window.lifelike.setFace('neutral', { glance: [sd, 3] });
        window.lifelike.advance(60);
      }, side);
      await shot(`gstill-turn${side < 0 ? 'L' : 'R'}`);
    }
    for (const [e, side] of [['happy', 1], ['distressed', -1], ['surprised', 1]]) {
      await ev(([x, sd]) => {
        window.lifelike.reset('idle');
        window.lifelike.face.takes = false;
        window.lifelike.setFace(x, { glance: [sd, 3] });
        window.lifelike.advance(60);
      }, [e, side]);
      await shot(`gstill-${e}-turn`);
    }
  }
  // talking: the same happy face talking, F1 | F2 | F4 (12 fps), then neutral and angry talking
  if (sets.includes('talk')) {
    let i = 0;
    for (const e of ['happy', 'neutral', 'angry']) {
      await ev((x) => {
        window.lifelike.reset('idle');
        window.lifelike.face.takes = false;
        window.lifelike.setFace(x, { view: 'talk', speech: 'off', volume: 0.8 });
        window.lifelike.advance(30);
        window.lifelike.setFace(x, { speech: 'talk' });
      }, e);
      for (let k = 0; k < 36; k++) {
        await ev(() => window.lifelike.advance(5));
        await shot(`talk-${pad(i++)}`);
      }
    }
  }
  // speech intents, each from rest for 4 s at 12 fps (composited side by side later)
  if (sets.includes('speech')) {
    for (const [intent, e] of [['talk', 'neutral'], ['yell', 'angry'], ['project', 'neutral'], ['interject', 'neutral']]) {
      await ev(([x, ex]) => {
        window.lifelike.reset('idle');
        window.lifelike.face.takes = false;
        window.lifelike.setFace('neutral', { view: 'f4', speech: 'off', volume: 0.85 });
        window.lifelike.advance(30);
        window.lifelike.setFace(ex, { speech: x });
      }, [intent, e]);
      for (let k = 0; k < 48; k++) {
        await ev(() => window.lifelike.advance(5));
        await shot(`speech-${intent}-${pad(k)}`);
      }
    }
  }
  // speech stills: widest open frame per intent, found by scanning the sim's open amount
  if (sets.includes('sstill')) {
    for (const [intent, e] of [['talk', 'neutral'], ['yell', 'angry'], ['project', 'neutral'], ['interject', 'neutral']]) {
      await ev(([x, ex]) => {
        window.lifelike.reset('idle');
        window.lifelike.face.takes = false;
        window.lifelike.setFace('neutral', { view: 'talk', speech: 'off', volume: 0.85 });
        window.lifelike.advance(30);
        window.lifelike.setFace(ex, { speech: x });
        let best = 0, at = 0;
        const f = window.lifelike.face;
        for (let k = 0; k < 150; k++) {
          window.lifelike.advance(1);
          if (f.sp.open > best) {
            best = f.sp.open;
            at = k;
          }
        }
        window.lifelike.setFace(ex, { speech: 'off' });
        window.lifelike.reset('idle');
        window.lifelike.face.takes = false;
        window.lifelike.setFace('neutral', { view: 'talk', speech: 'off', volume: 0.85 });
        window.lifelike.advance(30);
        window.lifelike.setFace(ex, { speech: x });
        window.lifelike.advance(at + 1);
      }, [intent, e]);
      await shot(`sstill-${intent}`);
    }
    await ev(() => window.lifelike.setFace(null, { view: 'turn', speech: 'off' }));
  }
  // pain: light hit, heavy hit at 30 fps (every 2 ticks), then sustained hurting + labored breath at 15 fps
  if (sets.includes('pain')) {
    let i = 0;
    for (const [I, n] of [[0.35, 30], [1, 40]]) {
      await ev((x) => {
        window.lifelike.reset('idle');
        window.lifelike.setFace('neutral', { view: 'turn', speech: 'off' });
        window.lifelike.advance(40);
        window.lifelike.setFace('neutral', { hit: x, side: 1 });
      }, I);
      for (let k = 0; k < n; k++) {
        await ev(() => window.lifelike.advance(2));
        await shot(`pain-${pad(i++)}`);
      }
    }
    await ev(() => {
      window.lifelike.reset('idle');
      window.lifelike.setFace('neutral', { view: 'turn', hurt: 0.85, breath: 0.6, ramp: 1.5 });
    });
    for (let k = 0; k < 60; k++) {
      await ev(() => window.lifelike.advance(4));
      await shot(`pain-${pad(i++)}`);
    }
  }
  // eyes-only distracted (the default since the user rejected head turns): F2 | F1 | F4, ~9 s at 15 fps
  if (sets.includes('eyes')) {
    await ev(() => {
      window.lifelike.reset('idle');
      window.lifelike.setFace('neutral', { view: 'f2', speech: 'off', distract: 0.9 });
      window.lifelike.advance(30);
    });
    for (let i = 0; i < 136; i++) {
      if (i === 96) await ev(() => window.lifelike.face.glance(-1, 1.4));
      await ev(() => window.lifelike.advance(4));
      await shot(`eyes-${pad(i)}`);
    }
  }
  if (sets.includes('debug')) {
    await page.evaluate(() => {
      window.lifelike.settings.debug = true;
      window.lifelike.reset('walk');
      window.lifelike.advance(20);
    });
    await body.screenshot({ path: `${out}/debug-walk.png` });
    await face.screenshot({ path: `${out}/debug-face.png` });
    await page.evaluate(() => {
      window.lifelike.settings.debug = false;
      window.lifelike.settings.paused = false;
    });
    await sleep(800);
    await page.screenshot({ path: `${out}/page.png`, fullPage: true });
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
} else console.log(`OK: no console errors; frames in ${out}/`);
