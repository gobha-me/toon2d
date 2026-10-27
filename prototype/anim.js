// Keyframed pose clips, sampling and blending. Pure.
//
// A pose is { [bone]: { rot, x, y, sx, sy } } (any channel may be omitted).
// A clip is { name, duration, loop, keys: [{ t, pose }] } with keys sorted by t
// inside [0, duration]. Channels are interpolated with Catmull-Rom so motion
// stays smooth through keys (cyclic neighbours when looping).
import { catmullRom, clamp, lerp } from './mathx.js';

export const CHANNELS = ['rot', 'x', 'y', 'sx', 'sy'];
export const CHANNEL_DEFAULTS = { rot: 0, x: 0, y: 0, sx: 1, sy: 1 };

export function channelValue(pose, bone, ch) {
  const b = pose && pose[bone];
  const v = b ? b[ch] : undefined;
  return v === undefined ? CHANNEL_DEFAULTS[ch] : v;
}

function bonesOf(...poses) {
  const s = new Set();
  for (const p of poses) if (p) for (const k of Object.keys(p)) s.add(k);
  return s;
}

/** Wrap or clamp clip time. */
export function clipTime(clip, time) {
  if (clip.duration <= 0) return 0;
  if (clip.loop) {
    const t = time % clip.duration;
    return t < 0 ? t + clip.duration : t;
  }
  return clamp(time, 0, clip.duration);
}

/** Sample a clip at a time (seconds). */
export function samplePose(clip, time) {
  const keys = clip.keys;
  if (!keys || keys.length === 0) return {};
  if (keys.length === 1) return clonePose(keys[0].pose);
  const t = clipTime(clip, time);
  const n = keys.length;
  // find segment i..i+1 (with wrap segment for loops)
  if (t < keys[0].t && !clip.loop) return clonePose(keys[0].pose);
  let i = n - 1;
  if (t >= keys[0].t) {
    for (let k = 0; k < n - 1; k++) {
      if (t < keys[k + 1].t) {
        i = k;
        break;
      }
    }
  }
  let j;
  let segStart;
  let segEnd;
  if (i < n - 1) {
    j = i + 1;
    segStart = keys[i].t;
    segEnd = keys[j].t;
  } else if (clip.loop) {
    j = 0;
    segStart = keys[i].t;
    segEnd = clip.duration + keys[0].t;
  } else {
    return clonePose(keys[n - 1].pose);
  }
  const span = segEnd - segStart;
  let local = t;
  if (clip.loop && t < keys[0].t) local = t + clip.duration; // inside the wrap segment
  const u = span > 0 ? clamp((local - segStart) / span, 0, 1) : 0;
  const idx = (k) => (clip.loop ? ((k % n) + n) % n : clamp(k, 0, n - 1));
  const p0 = keys[idx(i - 1)].pose;
  const p1 = keys[i].pose;
  const p2 = keys[j].pose;
  const p3 = keys[idx(clip.loop ? i + 2 : j + 1)].pose;
  const out = {};
  for (const bone of bonesOf(p0, p1, p2, p3)) {
    const o = {};
    for (const ch of CHANNELS) {
      const v1 = channelValue(p1, bone, ch);
      const v2 = channelValue(p2, bone, ch);
      const v0 = channelValue(p0, bone, ch);
      const v3 = channelValue(p3, bone, ch);
      const v = catmullRom(v0, v1, v2, v3, u);
      if (v !== CHANNEL_DEFAULTS[ch] || hasChannel(p1, bone, ch) || hasChannel(p2, bone, ch)) o[ch] = v;
    }
    out[bone] = o;
  }
  return out;
}

function hasChannel(pose, bone, ch) {
  return !!(pose && pose[bone] && pose[bone][ch] !== undefined);
}

export function clonePose(pose) {
  const out = {};
  for (const [k, v] of Object.entries(pose || {})) out[k] = { ...v };
  return out;
}

/** Linear blend a -> b by w in [0,1]. Missing channels use their defaults. */
export function blendPose(a, b, w) {
  const t = clamp(w, 0, 1);
  const out = {};
  for (const bone of bonesOf(a, b)) {
    const o = {};
    for (const ch of CHANNELS) {
      if (hasChannel(a, bone, ch) || hasChannel(b, bone, ch)) {
        o[ch] = lerp(channelValue(a, bone, ch), channelValue(b, bone, ch), t);
      }
    }
    out[bone] = o;
  }
  return out;
}

/**
 * Weighted mix of many poses: [{ pose, weight }]. Weights are normalised;
 * an all-zero list returns an empty (rest) pose.
 */
export function mixPoses(entries) {
  const total = entries.reduce((s, e) => s + Math.max(0, e.weight), 0);
  if (total <= 0) return {};
  const out = {};
  const bones = bonesOf(...entries.map((e) => e.pose));
  for (const bone of bones) {
    const o = {};
    for (const ch of CHANNELS) {
      if (!entries.some((e) => hasChannel(e.pose, bone, ch))) continue;
      let v = 0;
      for (const e of entries) v += channelValue(e.pose, bone, ch) * (Math.max(0, e.weight) / total);
      o[ch] = v;
    }
    out[bone] = o;
  }
  return out;
}

/** Additive layer: rot/x/y are added (scaled by w), sx/sy multiply toward the layer. */
export function addPose(base, layer, w = 1) {
  const out = clonePose(base);
  for (const [bone, ch] of Object.entries(layer || {})) {
    const o = out[bone] || (out[bone] = {});
    for (const c of ['rot', 'x', 'y']) if (ch[c] !== undefined) o[c] = (o[c] ?? 0) + ch[c] * w;
    for (const c of ['sx', 'sy']) if (ch[c] !== undefined) o[c] = (o[c] ?? 1) * lerp(1, ch[c], w);
  }
  return out;
}
