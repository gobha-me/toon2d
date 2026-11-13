#!/usr/bin/env python3
"""Bake scenes in a disposable project without importing the test-lane tree.
Invoke through heavy-run; Godot processes run sequentially with two workers.
"""
import argparse
from datetime import datetime, timezone
import hashlib
import json
import os
from pathlib import Path
import re
import shutil
import signal
import subprocess
import sys
import tempfile

PROJECT = Path(__file__).resolve().parents[1]


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def core_dumps(work):
    return [path for path in work.rglob('*') if path.is_file() and
            (re.fullmatch(r'core(?:\.\d+)?', path.name) or path.suffix == '.core')]


def public_log(text, work):
    for path, label in ((str(work / 'prototype'), '<PROJECT>'), (str(work), '<TMPDIR>'),
                        (str(PROJECT), '<PROJECT>'), (os.environ['TMPDIR'], '<TMPDIR>')):
        text = text.replace(path, label)
    hostname = os.environ.get('HOSTNAME')
    if hostname:
        text = text.replace(hostname, '<HOST>')
    return '\n'.join(line for line in text.splitlines()
                     if not line.startswith('heavy-run: holding slot')) + '\n'


def stop_child(process):
    """Stop only the process group created and recorded by this build."""
    try:
        os.killpg(process.pid, signal.SIGTERM)
    except ProcessLookupError:
        pass
    try:
        output, _ = process.communicate(timeout=10)
    except subprocess.TimeoutExpired:
        try:
            os.killpg(process.pid, signal.SIGKILL)
        except ProcessLookupError:
            pass
        output, _ = process.communicate()
    return output


def run_godot(command, env, work, logs, log_path):
    process = subprocess.Popen(command, cwd=work/'prototype', env=env, stdout=subprocess.PIPE,
                               stderr=subprocess.STDOUT, text=True, start_new_session=True)
    output, outcome = '', 'not completed'

    def interrupted(signum, frame):
        raise SystemExit(128 + signum)

    previous = {sig: signal.signal(sig, interrupted) for sig in (signal.SIGINT, signal.SIGTERM)}
    try:
        try:
            output, _ = process.communicate(timeout=600)
            outcome = str(process.returncode)
        except subprocess.TimeoutExpired:
            output = stop_child(process)
            outcome = 'TIMEOUT after 600 seconds; child group stopped'
            raise RuntimeError('Godot exceeded its 600-second child deadline; see build.txt')
        except BaseException:
            output = stop_child(process)
            outcome = 'INTERRUPTED; child group exit ' + str(process.returncode)
            raise
    finally:
        for sig, handler in previous.items():
            signal.signal(sig, handler)
        logs.append(public_log('COMMAND ' + repr(command) + '\n' + output + '\nEXIT ' + outcome, work))
        log_path.write_text('\n'.join(logs))
    if process.returncode or 'SCRIPT ERROR:' in output or 'Parse Error:' in output:
        raise RuntimeError('Godot failed; see sanitized build.txt')


def capture_lineage(project, config):
    """Trace a rendered assembly to actual textures and their source records."""
    subject = project / config['subject']
    parts = json.loads(subject.read_text())['parts']
    components, references, posts, fallbacks = [], {}, {}, []
    source_directory = subject.parent / 'imagine-source'
    for part in parts:
        texture = project / part['texture_hd']
        metadata = json.loads(texture.with_suffix('.gen.json').read_text())
        texture_hash = digest(texture)
        if metadata['output_sha256'] != texture_hash:
            raise ValueError('capture input texture differs from its sidecar: ' + part['id'])
        component = dict(part=part['id'], texture=part['texture_hd'], sha256=texture_hash,
                         classification=part['classification'], scripted_fallback=part['scripted_fallback'])
        if part['scripted_fallback']:
            component['fallback_reason'] = part['fallback_reason']
            fallbacks.append(part['id'])
        components.append(component)
        for reference in metadata['imagine_sources']:
            name = reference['file']
            if Path(name).name != name:
                raise ValueError('capture source reference must be a file name')
            image = source_directory / name
            if reference['sha256'] != digest(image):
                raise ValueError('capture input Imagine source hash differs: ' + name)
            if name in references and references[name] != reference:
                raise ValueError('conflicting capture source records: ' + name)
            references[name] = reference
            source = json.loads(image.with_suffix('.gen.json').read_text())
            posts[source['post_id']] = dict(post_id=source['post_id'], post_url=source['post_url'])
    inputs = {key: dict(file=config[key], sha256=digest(project / config[key]))
              for key in ('scene', 'subject', 'manifest')}
    inputs['capture_script'] = dict(file='scripts/capture_v2.gd', sha256=digest(project / 'scripts/capture_v2.gd'))
    inputs['flash_script'] = dict(file='scripts/muzzle_flash.gd', sha256=digest(project / 'scripts/muzzle_flash.gd'))
    return dict(artifact_kind='rendered assembly',
                derived_from='Godot capture of ' + config['scene'] + '; textures declared in ' + config['subject'] +
                             '; Imagine-derived cutouts plus the explicitly listed scripted fallback parts.',
                imagine_sources=[references[name] for name in sorted(references)],
                source_posts=[posts[name] for name in sorted(posts)], rendered_parts=components,
                scripted_fallback_parts=sorted(fallbacks),
                scripted_effects=[dict(name='MuzzleFlash',
                    description='Existing procedural compatibility-clip flash effect; tracked separately from body-part slots.')],
                inputs=inputs)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--capture', action='store_true', help='also capture HD review poses')
    parser.add_argument('--character', default='trenchcoat', help='character id from characters.yml')
    options = parser.parse_args()
    config = json.loads((PROJECT/'characters.yml').read_text())['characters'][options.character]
    dest = PROJECT / ('validation/v2' if options.character == 'trenchcoat' else 'validation/char2-imagine/build')
    dest.mkdir(parents=True, exist_ok=True)
    work = Path(tempfile.mkdtemp(prefix='bake-', dir=os.environ['TMPDIR']))
    project = work / 'prototype'
    logs = ['BUILD ' + datetime.now(timezone.utc).isoformat() + ' character=' + options.character]
    log_path = dest / 'build.txt'
    try:
        shutil.copytree(PROJECT, project, ignore=shutil.ignore_patterns(
            'tests', 'validation', 'renders', 'comparisons', 'diagnostics', 'provenance', '.godot', '__pycache__'))
        # Char2's frozen manifest is test-owned. Copy that single input into
        # scratch without importing or modifying the test-lane checkout.
        manifest = project / config['manifest']
        manifest.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(PROJECT / config['manifest'], manifest)
        env = dict(os.environ, TMPDIR=str(work), XDG_DATA_HOME=str(work/'xdg-data'),
                   XDG_CONFIG_HOME=str(work/'xdg-config'), XDG_CACHE_HOME=str(work/'xdg-cache'),
                   OMP_NUM_THREADS='2', OPENBLAS_NUM_THREADS='2', LP_NUM_THREADS='2', MAKEFLAGS='-j2')
        commands = [
            ['--headless', '--editor', '--import', '--quit'],
            ['--headless', '--script', 'res://scripts/build_rig.gd', '--', options.character],
        ]
        if options.capture:
            commands.append(['--script', 'res://scripts/capture_v2.gd', '--', options.character])
        for args in commands:
            command = ['/usr/local/bin/godot', '--single-threaded-scene', '--path', str(project), *args]
            if 'res://scripts/capture_v2.gd' in command:
                command = ['xvfb-run', '-a', *command, '--audio-driver', 'Dummy']
            run_godot(command, env, work, logs, log_path)
            if core_dumps(work):
                raise RuntimeError('core dump requires investigation; build scratch retained')
        for scene in config['legacy_scenes'].values():
            shutil.copy2(project/scene, PROJECT/scene)
        texture_dir = Path('parts/hd') if options.character == 'trenchcoat' else Path('characters')/options.character/'parts'
        for stub in (project/texture_dir).glob('*.import'):
            shutil.copy2(stub, PROJECT/texture_dir/stub.name)
        if (project/'review').is_dir():
            from prep_parts import sidecar
            from prep_char2 import provenance
            from PIL import Image, ImageDraw
            review = dest/'review-final'
            shutil.copytree(project/'review', review, dirs_exist_ok=True)
            contact = Image.new('RGB', (4*384, 474), '#18202b')
            draw = ImageDraw.Draw(contact)
            lineage = capture_lineage(project, config) if options.character != 'trenchcoat' else {}
            capture_inputs = []
            for index, pose in enumerate(('rest', 'aim', 'fire', 'knees')):
                path = review/(pose+'.png')
                image = Image.open(path)
                contact.paste(image.resize((384,448), Image.Resampling.LANCZOS), (384*index,26))
                draw.text((384*index+12,8), pose, fill='white')
                capture_inputs.append(dict(file=path.name, sha256=digest(path)))
                if options.character == 'trenchcoat':
                    sidecar(path, 'Godot HD v2 review capture: '+pose)
                else:
                    provenance(path, datetime.now(timezone.utc).isoformat().replace('+00:00', 'Z'),
                               source='prototypes/imagine-cutout/scripts/capture_v2.gd',
                               tool='Godot scripted scene capture', description='Unretouched Imagine courier review pose: '+pose,
                               pose=pose, **lineage)
            contact.save(review/'contact.png')
            if options.character == 'trenchcoat':
                sidecar(review/'contact.png', 'HD v2 review contact of unretouched Godot captures, reduced 2x for display')
            else:
                contact_lineage = dict(lineage, artifact_kind='contact sheet', capture_inputs=capture_inputs,
                                       derived_from='Half-size LANCZOS contact sheet of the four unretouched Godot capture PNGs; '
                                                    'captured component and source hashes are retained below.')
                provenance(review/'contact.png', datetime.now(timezone.utc).isoformat().replace('+00:00', 'Z'),
                           source='prototypes/imagine-cutout/tools/build_v2.py',
                           tool='Python/Pillow contact sheet', description='Imagine courier Godot review poses reduced to half size',
                           **contact_lineage)
        print(f'Baked {options.character} manifest scenes in scratch')
    except BaseException as exc:
        logs.append(public_log('BUILD FAILED: ' + type(exc).__name__ + ': ' + str(exc), work))
        log_path.write_text('\n'.join(logs))
        with (dest/'build-failures.txt').open('a') as stream:
            stream.write('\n'.join(logs) + '\n')
        raise
    finally:
        dumps = core_dumps(work)
        if dumps:
            logs.append('CORE INVESTIGATION REQUIRED: ' + ', '.join(
                path.relative_to(work).as_posix() + ' (' + str(path.stat().st_size) + ' bytes)' for path in dumps))
            log_path.write_text('\n'.join(logs))
            print('Core dump found; private scratch retained for investigation: ' + str(work), file=sys.stderr)
        else:
            shutil.rmtree(work)


if __name__ == '__main__':
    main()
