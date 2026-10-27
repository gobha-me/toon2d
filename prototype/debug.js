// Debug panel: face parameter sliders, expression buttons, say-line box.
// DOM only; it talks to the game through the small `api` object.
import { EXPRESSION_NAMES, FACE_PARAMS } from './face.js';

export function createDebugPanel(root, api) {
  root.innerHTML = '';
  const h = (tag, props = {}, children = []) => {
    const el = document.createElement(tag);
    Object.assign(el, props);
    for (const c of children) el.append(c);
    return el;
  };

  const exprRow = h('div', { className: 'row buttons' });
  const autoBtn = h('button', { textContent: 'auto', title: 'Gameplay drives the face' });
  autoBtn.addEventListener('click', () => api.pin(null));
  exprRow.append(autoBtn);
  const exprButtons = new Map();
  for (const name of EXPRESSION_NAMES) {
    const b = h('button', { textContent: name });
    b.addEventListener('click', () => api.pin(name));
    exprButtons.set(name, b);
    exprRow.append(b);
  }

  const sayInput = h('input', { type: 'text', value: 'Hello! I am a toon rig.', className: 'say' });
  const sayBtn = h('button', { textContent: 'say' });
  sayBtn.addEventListener('click', () => api.say(sayInput.value));
  sayInput.addEventListener('keydown', (e) => {
    e.stopPropagation();
    if (e.key === 'Enter') api.say(sayInput.value);
  });

  const release = h('button', { textContent: 'release sliders' });
  release.addEventListener('click', () => {
    api.clearOverrides();
    for (const s of sliders.values()) s.row.classList.remove('overridden');
  });

  const sliders = new Map();
  const list = h('div', { className: 'sliders' });
  for (const p of FACE_PARAMS) {
    const input = h('input', { type: 'range', min: p.min, max: p.max, step: 0.01, value: p.def });
    const val = h('span', { className: 'val', textContent: p.def.toFixed(2) });
    const row = h('label', { className: 'slider' }, [h('span', { className: 'name', textContent: p.name }), input, val]);
    input.addEventListener('input', () => {
      api.override(p.name, Number(input.value));
      row.classList.add('overridden');
    });
    sliders.set(p.name, { input, val, row });
    list.append(row);
  }

  root.append(
    h('h3', { textContent: 'Expression' }),
    exprRow,
    h('div', { className: 'row' }, [sayInput, sayBtn]),
    h('h3', { textContent: 'Face parameters' }),
    h('p', { className: 'hint', textContent: 'Drag to override a parameter (highlighted). Live values shown otherwise.' }),
    release,
    list,
  );

  return {
    /** Refresh live values (cheap; call a few times per second). */
    sync(face, overrides, pinned) {
      for (const [name, s] of sliders) {
        if (name in overrides) continue;
        s.input.value = face[name];
        s.val.textContent = Number(face[name]).toFixed(2);
      }
      for (const [name, s] of sliders) if (name in overrides) s.val.textContent = Number(overrides[name]).toFixed(2);
      autoBtn.classList.toggle('active', !pinned);
      for (const [name, b] of exprButtons) b.classList.toggle('active', pinned === name);
    },
  };
}
