"""Render deploy/lifelike.yaml: ConfigMap (dist/ files) + Deployment + Service + Middlewares + Ingress.
All objects live in namespace demo and are named lifelike-* / lifelike. Applies nothing."""
import base64
import hashlib
import json
import os

NS, APP, PATH = 'demo', 'lifelike', '/demo/lifelike'
TEXT = ('.html', '.js', '.json', '.css', '.svg')
data, binary = {}, {}
h = hashlib.sha256()
for f in sorted(os.listdir('dist')):
    b = open(f'dist/{f}', 'rb').read()
    h.update(f.encode() + b)
    if f.endswith(TEXT):
        data[f] = b.decode('utf-8')
    else:
        binary[f] = base64.b64encode(b).decode()
digest = h.hexdigest()[:16]
docs = [
    {'apiVersion': 'v1', 'kind': 'ConfigMap', 'metadata': {'name': f'{APP}-site', 'namespace': NS, 'labels': {'app': APP}},
     'data': data, 'binaryData': binary},
    {'apiVersion': 'apps/v1', 'kind': 'Deployment', 'metadata': {'name': APP, 'namespace': NS, 'labels': {'app': APP}},
     'spec': {'replicas': 1, 'selector': {'matchLabels': {'app': APP}}, 'template': {
         'metadata': {'labels': {'app': APP}, 'annotations': {'lifelike/site-sha': digest}},
         'spec': {'automountServiceAccountToken': False, 'containers': [{
             'name': 'nginx', 'image': 'nginx:alpine', 'ports': [{'containerPort': 80, 'name': 'http'}],
             'resources': {'requests': {'cpu': '10m', 'memory': '16Mi'}, 'limits': {'cpu': '100m', 'memory': '64Mi'}},
             'readinessProbe': {'httpGet': {'path': '/index.html', 'port': 'http'}, 'periodSeconds': 10},
             'volumeMounts': [{'name': 'site', 'mountPath': '/usr/share/nginx/html', 'readOnly': True}]}],
             'volumes': [{'name': 'site', 'configMap': {'name': f'{APP}-site'}}]}}}},
    {'apiVersion': 'v1', 'kind': 'Service', 'metadata': {'name': APP, 'namespace': NS, 'labels': {'app': APP}},
     'spec': {'type': 'ClusterIP', 'selector': {'app': APP}, 'ports': [{'name': 'http', 'port': 80, 'targetPort': 'http'}]}},
    {'apiVersion': 'traefik.io/v1alpha1', 'kind': 'Middleware', 'metadata': {'name': f'{APP}-slash', 'namespace': NS},
     'spec': {'redirectRegex': {'regex': f'^(https?://[^/]+{PATH})$', 'replacement': '${1}/', 'permanent': True}}},
    {'apiVersion': 'traefik.io/v1alpha1', 'kind': 'Middleware', 'metadata': {'name': f'{APP}-strip', 'namespace': NS},
     'spec': {'stripPrefix': {'prefixes': [PATH]}}},
    {'apiVersion': 'networking.k8s.io/v1', 'kind': 'Ingress', 'metadata': {'name': APP, 'namespace': NS, 'annotations': {
        'traefik.ingress.kubernetes.io/router.middlewares': f'{NS}-{APP}-slash@kubernetescrd,{NS}-{APP}-strip@kubernetescrd'}},
     'spec': {'ingressClassName': 'traefik', 'rules': [{'host': 'EXAMPLE_HOST', 'http': {'paths': [{
         'path': PATH, 'pathType': 'Prefix', 'backend': {'service': {'name': APP, 'port': {'number': 80}}}}]}}]}},
]
# JSON is valid YAML; one document per '---'
with open('deploy/lifelike.yaml', 'w') as fh:
    fh.write('\n---\n'.join(json.dumps(d, indent=1) for d in docs) + '\n')
for d in docs:
    assert d['metadata']['namespace'] == NS
print('wrote deploy/lifelike.yaml', os.path.getsize('deploy/lifelike.yaml') // 1024, 'KiB; site sha', digest,
      [f"{d['kind']}/{d['metadata']['name']}" for d in docs])
