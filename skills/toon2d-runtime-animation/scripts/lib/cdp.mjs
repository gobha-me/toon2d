// Minimal Chrome DevTools Protocol driver. Zero deps: uses Node >= 22 global WebSocket + fetch.
// launch() finds Chrome/Chromium (CHROME_PATH, system, or a Playwright cache), starts it headless and
// returns a page session with eval(), screenshot(), close(). Console errors are collected in page.errors.
import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { homedir, tmpdir } from 'node:os';
import { join } from 'node:path';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export function findChrome() {
  // Any Chromium-based browser that speaks CDP works (Chrome, Chromium, Edge, Brave, headless shell).
  const fixed = [process.env.CHROME_PATH, '/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium', '/usr/bin/chromium-browser',
    '/snap/bin/chromium', '/opt/google/chrome/chrome', '/usr/bin/microsoft-edge', '/opt/brave.com/brave/brave', '/usr/bin/brave-browser',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/Applications/Chromium.app/Contents/MacOS/Chromium'];
  for (const p of fixed) if (p && existsSync(p)) return p;
  const pw = process.env.PLAYWRIGHT_BROWSERS_PATH || join(homedir(), '.cache/ms-playwright');
  if (existsSync(pw)) {
    const dirs = readdirSync(pw).filter((d) => d.startsWith('chromium')).sort().reverse();
    for (const d of dirs) {
      for (const sub of ['chrome-linux64/chrome', 'chrome-linux/chrome', 'chrome-headless-shell-linux64/chrome-headless-shell']) {
        const p = join(pw, d, sub);
        if (existsSync(p)) return p;
      }
    }
  }
  throw new Error('No Chrome/Chromium found. Set CHROME_PATH.');
}

export async function launch({ width = 1280, height = 720 } = {}) {
  const exe = findChrome();
  const profile = mkdtempSync(join(tmpdir(), 'toon2d-cdp-'));
  const proc = spawn(exe, ['--headless=new', '--no-sandbox', '--disable-gpu', '--hide-scrollbars', '--mute-audio', '--no-first-run',
    '--disable-background-timer-throttling', '--disable-renderer-backgrounding', `--window-size=${width},${height}`,
    '--force-device-scale-factor=1', '--remote-debugging-port=0', `--user-data-dir=${profile}`, 'about:blank'], { stdio: 'ignore' });
  let port = null;
  for (let i = 0; i < 100 && !port; i++) {
    await sleep(100);
    const f = join(profile, 'DevToolsActivePort');
    if (existsSync(f)) port = readFileSync(f, 'utf8').split('\n')[0].trim() || null;
  }
  if (!port) throw new Error('Chrome did not open a DevTools port');
  let target = null;
  for (let i = 0; i < 50 && !target; i++) {
    const list = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
    target = list.find((t) => t.type === 'page');
    if (!target) await sleep(100);
  }
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((ok, bad) => {
    ws.onopen = ok;
    ws.onerror = bad;
  });
  let id = 0;
  const waiting = new Map();
  const listeners = [];
  ws.onmessage = (m) => {
    const msg = JSON.parse(m.data);
    if (msg.id && waiting.has(msg.id)) {
      const { ok, bad } = waiting.get(msg.id);
      waiting.delete(msg.id);
      if (msg.error) bad(new Error(msg.error.message));
      else ok(msg.result);
    } else if (msg.method) for (const l of listeners) l(msg);
  };
  const send = (method, params = {}) => new Promise((ok, bad) => {
    const i = ++id;
    waiting.set(i, { ok, bad });
    ws.send(JSON.stringify({ id: i, method, params }));
  });
  const page = { errors: [], send };
  listeners.push((msg) => {
    if (msg.method === 'Runtime.exceptionThrown') page.errors.push(`exception: ${msg.params.exceptionDetails?.exception?.description || msg.params.exceptionDetails?.text}`);
    if (msg.method === 'Runtime.consoleAPICalled' && (msg.params.type === 'error' || msg.params.type === 'assert')) {
      page.errors.push(`console.${msg.params.type}: ${msg.params.args.map((a) => a.value ?? a.description).join(' ')}`);
    }
    if (msg.method === 'Log.entryAdded' && msg.params.entry.level === 'error') page.errors.push(`log: ${msg.params.entry.text} ${msg.params.entry.url || ''}`);
  });
  await send('Runtime.enable');
  await send('Log.enable');
  await send('Page.enable');
  await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false });

  page.goto = async (url) => {
    await send('Page.navigate', { url });
    for (let i = 0; i < 150; i++) {
      await sleep(100);
      const r = await page.eval('window.__toonReady === true || (window.__toon && typeof window.__toon.tick === "function")').catch(() => false);
      if (r) return true;
    }
    return false;
  };
  /** Evaluate an expression (string) in the page; awaits promises; returns the JSON value. */
  page.eval = async (expr) => {
    const r = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true });
    if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text);
    return r.result.value;
  };
  /** PNG screenshot (Buffer) of a clip {x,y,width,height} in CSS px, or the viewport. */
  page.screenshot = async (clip) => {
    const r = await send('Page.captureScreenshot', { format: 'png', ...(clip ? { clip: { ...clip, scale: 1 } } : {}), captureBeyondViewport: false });
    return Buffer.from(r.data, 'base64');
  };
  page.close = async () => {
    try {
      ws.close();
    } catch {
      /* ignore */
    }
    // wait for Chrome (and its children) to exit before deleting the profile; network/overlay filesystems
    // (cephfs, NFS) return ENOTEMPTY while late writes land, so retry and never let cleanup fail a run.
    const exited = new Promise((r) => (proc.exitCode !== null ? r() : proc.once('exit', r)));
    proc.kill('SIGKILL');
    await Promise.race([exited, sleep(2000)]);
    await sleep(150);
    try {
      rmSync(profile, { recursive: true, force: true, maxRetries: 10, retryDelay: 150 });
    } catch (e) {
      console.warn(`[cdp] could not remove temp profile ${profile}: ${e.code || e.message}`);
    }
  };
  return page;
}
