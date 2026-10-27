# Deploy notes (static web build)

- The starter is flat static files (ES modules, JSON, PNG). Any static server works; `scripts/serve.mjs <dir>` for local.
- Single-ConfigMap deploys (Kubernetes, files in `binaryData`): ConfigMaps are capped at ~1 MiB total. Check the size
  of the bundle before rendering the manifest.
- **ConfigMaps over 256 KB need `kubectl apply --server-side`** (e.g. `--server-side --field-manager=<app>`):
  client-side apply stores the whole object in the `last-applied-configuration` annotation, which is capped at 256 KB.
- Serve `.js`/`.mjs` as `text/javascript` (module scripts refuse other MIME types) and `.json` as `application/json`.
- Keep `?harness=1` working in production builds so deployed versions can be scored and captured too.
