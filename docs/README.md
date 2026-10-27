# Demo site (static)

Pages-ready static demo for the v0.1 candidate. No external network dependencies.

| Path | Contents |
|---|---|
| `index.html` | Hub |
| `guide.html` | Styles & techniques field guide (clips in `media/`) |
| `play/` | Playable starter character (skill template) |
| `lifelike/` | Embeddable F2 bust widget |

Serve locally from the repo root:

```bash
./scripts/serve          # http://127.0.0.1:8080/
# or
npm run serve:docs
```

GitHub Pages: see `.github/workflows/pages.yml` (manual `workflow_dispatch` only; do not enable Pages while the repo is private).
