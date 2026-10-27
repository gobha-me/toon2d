#!/usr/bin/env node
// Smoke-check local static serve (no remote hosts).
const base = process.env.LIFELIKE_BASE || 'http://127.0.0.1:8080';
for (const u of [`${base}/`, `${base}/bust.html`]) {
  const r = await fetch(u);
  console.log(r.status, u);
  if (!r.ok) process.exitCode = 1;
}
