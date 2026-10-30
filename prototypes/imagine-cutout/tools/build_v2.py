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

PROJECT = Path(__file__).resolve().parents[1]


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--capture', action='store_true', help='also capture HD review poses')
    options = parser.parse_args()
    with tempfile.TemporaryDirectory(prefix='bake-', dir=os.environ['TMPDIR']) as tmp:
        project = Path(tmp) / 'prototype'
        shutil.copytree(PROJECT, project, ignore=shutil.ignore_patterns(
            'tests', 'validation', 'renders', 'comparisons', 'diagnostics', 'provenance', '.godot', '__pycache__'))
        env = dict(os.environ, XDG_DATA_HOME=tmp+'/xdg-data', XDG_CONFIG_HOME=tmp+'/xdg-config', XDG_CACHE_HOME=tmp+'/xdg-cache',
                   OMP_NUM_THREADS='2', OPENBLAS_NUM_THREADS='2', LP_NUM_THREADS='2', MAKEFLAGS='-j2')
        commands = [
            ['--headless', '--editor', '--import', '--quit'],
            ['--headless', '--script', 'res://scripts/build_rig.gd'],
        ]
        if options.capture:
            commands.append(['--script', 'res://scripts/capture_v2.gd'])
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
        for mode in ('hd', 'pixel'):
            shutil.copy2(project / 'scenes' / (mode+'.tscn'), PROJECT / 'scenes' / (mode+'.tscn'))
        for stub in (project / 'parts/hd').glob('*.import'):
            shutil.copy2(stub, PROJECT / 'parts/hd' / stub.name)
        dest = PROJECT / 'validation/v2'
        dest.mkdir(parents=True, exist_ok=True)
        (dest/'build.txt').write_text('\n'.join(logs))
        if (project/'review').is_dir():
            from prep_parts import sidecar
            from PIL import Image, ImageDraw
            review = dest/'review-final'
            shutil.copytree(project/'review', review, dirs_exist_ok=True)
            contact = Image.new('RGB', (4*384, 474), '#18202b')
            draw = ImageDraw.Draw(contact)
            for index, pose in enumerate(('rest', 'aim', 'fire', 'knees')):
                image = Image.open(review/(pose+'.png'))
                contact.paste(image.resize((384,448), Image.Resampling.LANCZOS), (384*index,26))
                draw.text((384*index+12,8), pose, fill='white')
                sidecar(review/(pose+'.png'), 'Godot HD v2 review capture: '+pose)
            contact.save(review/'contact.png')
            sidecar(review/'contact.png', 'HD v2 review contact of unretouched Godot captures, reduced 2x for display')
        print('Baked HD v2 and pixel compatibility scenes in scratch')


if __name__ == '__main__':
    main()
