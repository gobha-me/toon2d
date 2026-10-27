// Probe: coat lag/settle per event and the pickup take curve. Usage: node out/tools/probe.mjs <skillDir> <projectDir> [query]
import { resolve } from 'node:path';
const [skill, proj, query = 'mode=smooth'] = process.argv.slice(2);
const { open } = await import(resolve(skill, 'scripts/lib/drive.mjs'));
const sess = await open(resolve(proj), query);
const { page } = sess;
await page.eval(`globalThis.PICK_AT = ${Number(process.env.PICK_AT || 150)}`);
const res = await page.eval(`(() => {
  const T = window.__toon;
  T.reset({ seed: 1 });
  const tipRel = () => {
    const s = T.state();
    const j = Object.fromEntries(s.joints.map((q) => [q.name, q]));
    const c0 = j.coat0, c2 = j.coat2;
    return { dx: +((c2.ex - c0.x) * s.facing).toFixed(2), dy: +(c2.ey - c0.y).toFixed(2), state: s.state };
  };
  const seg = (name, input, ticks, release) => {
    T.setInput(input);
    const out = [];
    for (let i = 0; i < ticks; i++) {
      if (release != null && i === release) T.setInput({ ...input, jump: false });
      T.tick(1);
      out.push(tipRel());
    }
    return { name, out };
  };
  const segs = [seg('idle', {}, 120), seg('start', { right: true }, 90), seg('stop', {}, 90), seg('turnL', { left: true }, 60), seg('stopL', {}, 90),
    seg('jump', { jump: true }, 80, 12), seg('settle', {}, 90)];
  const rest = segs[0].out.at(-1);
  const summary = segs.map(({ name, out }) => {
    const dev = out.map((p) => Math.hypot(p.dx - rest.dx, p.dy - rest.dy));
    const peak = Math.max(...dev);
    let settle = out.length;
    for (let i = out.length - 1; i > 0; i--) { if (Math.hypot(out[i].dx - out[i - 1].dx, out[i].dy - out[i - 1].dy) > 0.05) { settle = i + 1; break; } if (i === 1) settle = 0; }
    return { name, peakDevFromRest: +peak.toFixed(2), peakAtTick: dev.indexOf(peak), stillAfterTick: settle, end: out.at(-1) };
  });
  // pickup take
  T.reset({ seed: 1 });
  T.tick(Number(globalThis.PICK_AT || 150));
  T.trigger('pickup');
  const face = [];
  for (let i = 0; i < 150; i++) { T.tick(1); const f = T.state().face; face.push([i + 1, +f.eyeOpenL.toFixed(2), +f.browHeight.toFixed(2), +f.mouthSmirk.toFixed(2), +f.pupilX.toFixed(2)]); }
  return { rest, summary, face: face.filter((r) => r[0] <= 30 || r[0] % 10 === 0) };
})()`);
console.log(JSON.stringify(res.rest));
for (const s of res.summary) console.log(JSON.stringify(s));
console.log('tick eyeOpenL browHeight mouthSmirk pupilX');
for (const r of res.face) console.log(r.join(' '));
await sess.close();
