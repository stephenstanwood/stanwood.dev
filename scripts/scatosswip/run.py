#!/usr/bin/env python3
"""Mini entrypoint: non-overlapping runs, atomic receipts, bounded source work."""
import fcntl
import json
import os
import re
import shutil
import subprocess
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

root = Path(__file__).resolve().parent
state = Path(os.environ.get('SCATOS_STATE_DIR', str(Path.home() / '.local/state/scatosswip')))
state.mkdir(parents=True, exist_ok=True, mode=0o700)
lock = (state / 'run.lock').open('w')
try:
    fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
except BlockingIOError:
    print('ScatosSwip refresh already running.')
    sys.exit(0)
now = datetime.now(timezone.utc)
run_id = now.strftime('%Y%m%dT%H%M%SZ')
receipts = state / 'runs' / run_id
receipts.mkdir(parents=True, mode=0o700)
node = os.environ.get('SCATOS_NODE', '/opt/homebrew/bin/node')
env_path = root / '.env'
if not env_path.is_file():
    raise SystemExit('ScatosSwip .env is missing beside run.py')
env_path.chmod(0o600)
status = {'startedAt': now.isoformat(), 'runId': run_id, 'status': 'failed'}
try:
    with (receipts / 'run.log').open('w') as log:
        subprocess.run([sys.executable, str(root / 'collect.py'), '--output', str(state / 'feed.json'),
                        '--receipts', str(receipts)], stdout=log, stderr=log, timeout=1500, check=True)
        subprocess.run([node, '--env-file=' + str(env_path), str(root / 'publish.mjs'), str(state / 'feed.json'),
                        str(receipts / 'publish.json')], stdout=log, stderr=log, timeout=120, check=True)
    published = json.loads((receipts / 'publish.json').read_text())
    status.update(published)
    status['status'] = 'ok' if published['complete'] else 'partial'
except (subprocess.SubprocessError, OSError, ValueError) as error:
    status['error'] = type(error).__name__ + ': see the private run log'
    subprocess.run([node, '--env-file=' + str(env_path), str(root / 'publish.mjs'), '--failure'],
                   stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, timeout=90, check=False)
finally:
    status['finishedAt'] = datetime.now(timezone.utc).isoformat()
    temporary = state / 'latest-run.tmp'
    temporary.write_text(json.dumps(status, indent=2) + '\n')
    temporary.replace(state / 'latest-run.json')
    print(json.dumps(status))
    # Only this task's old raw receipts are pruned. Saved homes and price history
    # live in the database; the latest feed and last-run receipt remain on disk.
    cutoff = now - timedelta(days=14)
    for directory in (state / 'runs').iterdir():
        if directory.is_dir() and re.fullmatch(r'\d{8}T\d{6}Z', directory.name):
            dated = datetime.strptime(directory.name, '%Y%m%dT%H%M%SZ').replace(tzinfo=timezone.utc)
            if dated < cutoff:
                shutil.rmtree(directory)
sys.exit(0 if status['status'] == 'ok' else 2 if status['status'] == 'partial' else 1)
