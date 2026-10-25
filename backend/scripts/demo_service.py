"""Run the local demo independently of the terminal and restart crashed services."""
import argparse
import json
import os
import signal
import subprocess
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
STATE = ROOT / '.data/demo-service.json'
LOGS = ROOT / '.data/demo-logs'


def alive(pid):
    try:
        os.kill(pid, 0)
        return True
    except ProcessLookupError:
        return False


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('action', choices=['start', 'stop', 'status', 'supervise'])
    args = parser.parse_args()
    if args.action != 'supervise':
        state = json.loads(STATE.read_text()) if STATE.exists() else {}
        running = bool(state.get('supervisor') and alive(state['supervisor']))
        if args.action == 'status':
            print(json.dumps({'running': running, **state}, indent=2))
        elif args.action == 'stop':
            if running:
                os.kill(state['supervisor'], signal.SIGTERM)
            print('Stop requested')
        elif running:
            print('HerVoice supervisor is already running')
        else:
            LOGS.mkdir(parents=True, exist_ok=True)
            with (LOGS / 'supervisor.log').open('a') as log:
                process = subprocess.Popen([sys.executable, str(Path(__file__).resolve()), 'supervise'], cwd=ROOT, stdin=subprocess.DEVNULL, stdout=log, stderr=log, start_new_session=True)
            print(f'Started detached supervisor {process.pid}')
        return
    from dotenv import load_dotenv
    load_dotenv(ROOT / '.env')
    children = {}
    stopping = False
    def stop(*_):
        nonlocal stopping
        stopping = True
    signal.signal(signal.SIGTERM, stop)
    signal.signal(signal.SIGINT, stop)
    commands = {
        'api': [sys.executable, '-m', 'uvicorn', 'backend.api.main:app', '--host', '127.0.0.1', '--port', '8000'],
        'web': ['npm', 'run', 'dev'],
    }
    try:
        while not stopping:
            for name, command in commands.items():
                if name not in children or children[name].poll() is not None:
                    with (LOGS / f'{name}.log').open('a') as log:
                        children[name] = subprocess.Popen(command, cwd=ROOT, stdin=subprocess.DEVNULL, stdout=log, stderr=log, start_new_session=True)
                    STATE.write_text(json.dumps({'supervisor': os.getpid(), **{k: v.pid for k, v in children.items()}}))
            time.sleep(3)
    finally:
        for child in children.values():
            if child.poll() is None:
                os.killpg(child.pid, signal.SIGTERM)
        STATE.unlink(missing_ok=True)


if __name__ == '__main__':
    main()
