#!/usr/bin/env python3
"""Bake scenes in a disposable project without importing the test-lane tree.
Invoke through heavy-run; Godot processes run sequentially with two workers.
"""
import os
from pathlib import Path
import shutil
import subprocess
import tempfile
import argparse
import json

PROJECT = Path(__file__).resolve().parents[1]


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--capture', action='store_true', help='also capture HD review poses')
    parser.add_argument('--character', default='trenchcoat', help='character id from characters.yml')
    options = parser.parse_args()
    config = json.loads((PROJECT/'characters.yml').read_text())['characters'][options.character]
    with tempfile.TemporaryDirectory(prefix='bake-', dir=os.environ['TMPDIR']) as tmp:
        project = Path(tmp) / 'prototype'
        shutil.copytree(PROJECT, project, ignore=shutil.ignore_patterns(
            'tests', 'validation', 'renders', 'comparisons', 'diagnostics', 'provenance', '.godot', '__pycache__'))
        # Char2's frozen manifest is test-owned. Copy that single input into
        # scratch without importing or modifying the test-lane checkout.
        manifest = project / config['manifest']
        manifest.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(PROJECT / config['manifest'], manifest)
        env = dict(os.environ, XDG_DATA_HOME=tmp+'/xdg-data', XDG_CONFIG_HOME=tmp+'/xdg-config', XDG_CACHE_HOME=tmp+'/xdg-cache',
                   OMP_NUM_THREADS='2', OPENBLAS_NUM_THREADS='2', LP_NUM_THREADS='2', MAKEFLAGS='-j2')
        commands = [
            ['--headless', '--editor', '--import', '--quit'],
            ['--headless', '--script', 'res://scripts/build_rig.gd', '--', options.character],
        ]
        if options.capture:
            commands.append(['--script', 'res://scripts/capture_v2.gd', '--', options.character])
        logs = []
        for args in commands:
            command = ['/usr/local/bin/godot', '--single-threaded-scene', '--path', str(project), *args]
            if 'res://scripts/capture_v2.gd' in command:
                command = ['xvfb-run', '-a', *command, '--audio-driver', 'Dummy']
            result = subprocess.run(command, env=env, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)
            log = result.stdout.replace(str(project), '<PROJECT>').replace(tmp, '<TMPDIR>')
            logs.append(log)
            if result.returncode or 'SCRIPT ERROR:' in log or 'Parse Error:' in log:
                raise RuntimeError(log)
        for scene in config['legacy_scenes'].values():
            shutil.copy2(project/scene, PROJECT/scene)
        texture_dir = Path('parts/hd') if options.character == 'trenchcoat' else Path('characters')/options.character/'parts'
        for stub in (project/texture_dir).glob('*.import'):
            shutil.copy2(stub, PROJECT/texture_dir/stub.name)
        dest = PROJECT / ('validation/v2' if options.character == 'trenchcoat' else 'validation/char2-rig')
        dest.mkdir(parents=True, exist_ok=True)
        (dest/'build.txt').write_text('\n'.join(logs))
        if (project/'review').is_dir():
            from prep_parts import sidecar
            from prep_char2 import provenance
            from datetime import datetime, timezone
            from PIL import Image, ImageDraw
            review = dest/'review-final'
            shutil.copytree(project/'review', review, dirs_exist_ok=True)
            contact = Image.new('RGB', (4*384, 474), '#18202b')
            draw = ImageDraw.Draw(contact)
            for index, pose in enumerate(('rest', 'aim', 'fire', 'knees')):
                image = Image.open(review/(pose+'.png'))
                contact.paste(image.resize((384,448), Image.Resampling.LANCZOS), (384*index,26))
                draw.text((384*index+12,8), pose, fill='white')
                if options.character == 'trenchcoat':
                    sidecar(review/(pose+'.png'), 'Godot HD v2 review capture: '+pose)
                else:
                    provenance(review/(pose+'.png'), datetime.now(timezone.utc).isoformat().replace('+00:00', 'Z'),
                               source='prototypes/imagine-cutout/scripts/capture_v2.gd',
                               tool='Godot scripted scene capture', description='Unretouched courier review pose: '+pose)
            contact.save(review/'contact.png')
            if options.character == 'trenchcoat':
                sidecar(review/'contact.png', 'HD v2 review contact of unretouched Godot captures, reduced 2x for display')
            else:
                provenance(review/'contact.png', datetime.now(timezone.utc).isoformat().replace('+00:00', 'Z'),
                           source='prototypes/imagine-cutout/tools/build_v2.py',
                           tool='Python/Pillow contact sheet', description='Courier Godot review poses reduced to half size')
        print(f'Baked {options.character} manifest scenes in scratch')


if __name__ == '__main__':
    main()
