# Deploy notes (generic)

These manifests are **examples** for hosting a static `dist/` build behind any
ingress controller. They are not tied to a specific cluster, host, or namespace.

Suggested placeholders when you adapt them:

| Placeholder | Meaning |
|---|---|
| `NAMESPACE` | Kubernetes namespace for the demo |
| `APP_NAME` | Deployment / Service / ConfigMap name |
| `EXAMPLE_HOST` | Public hostname |
| `EXAMPLE_PATH` | URL path prefix (e.g. `/demo/toon/`) |
| `SSH_HOST` | Optional bastion used only if you wrap apply in SSH |

Do **not** commit real cluster names, kubeconfigs, or credentials.
Prefer GitHub Pages (`docs/` or `site/` + the Pages workflow) for the public demo.
