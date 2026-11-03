import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';

const driveURL = new URL('../skills/toon2d-runtime-animation/scripts/lib/drive.mjs', import.meta.url).href;
const browser = `
  export async function launch() {
    const { scenario, events } = globalThis;
    if (scenario.stage === 'launch') throw new Error('launch failed');
    return {
      errors: ['boot failed'],
      async goto() {
        if (scenario.stage === 'navigate') throw new Error('navigate failed');
        return scenario.stage !== 'contract';
      },
      async eval(expression) {
        const stage = expression.includes('view()') ? 'view' : 'manual';
        if (scenario.stage === stage) throw new Error(stage + ' failed');
        return { width: 320 };
      },
      async close() {
        events.push('page');
        if (scenario.closeFails) throw new Error('close failed');
      },
    };
  }
`;
const server = `
  export async function startServer() {
    return { url: 'http://127.0.0.1/', close() { globalThis.events.push('server'); } };
  }
`;

function run(scenario, realServer = false) {
  const script = `
    import { registerHooks } from 'node:module';
    globalThis.events = [];
    globalThis.scenario = ${JSON.stringify(scenario)};
    const modules = ${JSON.stringify({ './cdp.mjs': browser, ...(!realServer && { './serve.mjs': server }) })};
    registerHooks({
      resolve(specifier, context, nextResolve) {
        if (context.parentURL === ${JSON.stringify(driveURL)} && Object.hasOwn(modules, specifier)) {
          return { url: 'data:text/javascript,' + encodeURIComponent(modules[specifier]), shortCircuit: true };
        }
        return nextResolve(specifier, context);
      },
    });
    const { open } = await import(${JSON.stringify(driveURL)});
    let error = null;
    try {
      const session = await open('.');
      await session.close();
    } catch (failure) { error = failure.message; }
    console.log(JSON.stringify({ error, events: globalThis.events }));
  `;
  const child = spawnSync(process.execPath, ['--input-type=module', '--eval', script], {
    encoding: 'utf8', timeout: 5000,
  });
  assert.equal(child.status, 0, `${child.error?.message || ''}\n${child.stderr}`);
  return JSON.parse(child.stdout);
}

for (const stage of ['launch', 'navigate', 'manual', 'view']) {
  test(`capture session releases acquired resources after ${stage} failure`, () => {
    const result = run({ stage });
    assert.equal(result.error, `${stage} failed`);
    assert.deepEqual(result.events, stage === 'launch' ? ['server'] : ['page', 'server']);
  });
}

test('missing capture contract closes the page and server once', () => {
  const result = run({ stage: 'contract' });
  assert.match(result.error, /contract missing or boot error.*\nboot failed/);
  assert.deepEqual(result.events, ['page', 'server']);
});

test('cleanup failure preserves the original capture setup error', () => {
  const result = run({ stage: 'navigate', closeFails: true });
  assert.equal(result.error, 'navigate failed');
  assert.deepEqual(result.events, ['page', 'server']);
});

test('closing a working capture session releases its server even if page cleanup fails', () => {
  const result = run({ closeFails: true });
  assert.equal(result.error, 'close failed');
  assert.deepEqual(result.events, ['page', 'server']);
});

test('a successful capture session retains resources until it is closed', () => {
  const result = run({});
  assert.equal(result.error, null);
  assert.deepEqual(result.events, ['page', 'server']);
});

test('failed browser launch leaves no real HTTP listener keeping the command alive', () => {
  const result = run({ stage: 'launch' }, true);
  assert.equal(result.error, 'launch failed');
});
