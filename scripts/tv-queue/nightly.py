#!/usr/bin/env python3
"""Nightly "Around the internet" edition for /tv (Mini LaunchAgent dev.stanwood.tv-listings).

Builds the edition from origin/main in a temporary detached worktree, validates
it, and publishes public/yt/broader.json straight to main. The shared Mini
checkout is only fetched, never checked out, reset, or committed in. Success
is silent; a failure or a dead ✓/× mark server posts one line to #tasks. Every
run leaves ~/.local/state/tv-listings/latest-run.json.

Installed copy: ~/.local/share/tv-listings/nightly.py (see README.md). The
builder itself always runs from the fetched origin/main, so only this file is
installed.
"""

from __future__ import annotations

import fcntl
import json
import os
import shutil
import subprocess
import sys
import tempfile
import traceback
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

HOME = Path.home()
REPO = Path(os.environ.get("STANWOOD_REPO", HOME / "Projects" / "stanwood.dev"))
STATE_DIR = Path(os.environ.get("TV_QUEUE_STATE_DIR", HOME / ".claude" / "scheduled-tasks" / "stanford-queue"))
RUN_DIR = HOME / ".local" / "state" / "tv-listings"
LOG_PATH = RUN_DIR / "run.log"
RECEIPT_PATH = RUN_DIR / "latest-run.json"
TARGET = "public/yt/broader.json"
BUILD_TIMEOUT_SECONDS = 40 * 60
MIN_PICKS = 8
MAX_BUILD_AGE_SECONDS = 30 * 60
PUSH_ATTEMPTS = 3
MARK_SERVER = "http://127.0.0.1:8788/api/mark"
POST_TO_TASKS = HOME / ".claude" / "scripts" / "post-to-tasks.sh"


def log(message: str) -> None:
    RUN_DIR.mkdir(parents=True, exist_ok=True)
    with LOG_PATH.open("a") as handle:
        handle.write(message.rstrip("\n") + "\n")


def git(repo: Path, *args: str) -> str:
    result = subprocess.run(["git", "-C", str(repo), *args], capture_output=True, text=True, check=False)
    if result.returncode != 0:
        raise RuntimeError(f"git {' '.join(args)}: {(result.stderr or result.stdout).strip()[-400:]}")
    return result.stdout.strip()


def validate(path: Path) -> dict:
    """Refuse to publish a stale, thin, or non-English edition."""
    edition = json.loads(path.read_text())
    age = (datetime.now(timezone.utc) - datetime.fromisoformat(edition["built_at"])).total_seconds()
    if age > MAX_BUILD_AGE_SECONDS:
        raise RuntimeError(f"stale build output ({age:.0f}s old)")
    queue, pool = edition.get("queue", []), edition.get("pool", [])
    if len(queue) < MIN_PICKS:
        raise RuntimeError(f"only {len(queue)} picks; previous edition kept")
    non_english = [v.get("id") for v in queue + pool if v.get("language") != "en"]
    if non_english:
        raise RuntimeError(f"non-English inventory: {non_english[:5]}")
    unheadlined = [v.get("id") for v in queue if not v.get("headline")]
    if len(unheadlined) > len(queue) // 2:
        raise RuntimeError(f"editor headlines missing for {len(unheadlined)} of {len(queue)} picks")
    return edition


def publish(checkout: Path, picks: int) -> str:
    git(checkout, "add", "--", TARGET)
    git(checkout, "commit", "-m", f"tv: around the internet edition ({picks} picks)", "--", TARGET)
    for attempt in range(1, PUSH_ATTEMPTS + 1):
        try:
            git(checkout, "push", "origin", "HEAD:refs/heads/main")
            return git(checkout, "rev-parse", "--short", "HEAD")
        except RuntimeError as error:
            if attempt == PUSH_ATTEMPTS:
                raise
            # Other bots push to main all day. Only this one file changes, so
            # replaying the commit on the new tip is safe; never force.
            log(f"push attempt {attempt} rejected, replaying on the new main: {error}")
            git(checkout, "fetch", "origin", "main")
            git(checkout, "rebase", "origin/main")
    raise RuntimeError("unreachable")


def mark_server_up() -> bool:
    request = urllib.request.Request(MARK_SERVER, method="OPTIONS")
    try:
        with urllib.request.urlopen(request, timeout=5) as response:
            return response.status == 204
    except Exception:
        return False


def alert(message: str) -> None:
    if POST_TO_TASKS.exists():
        subprocess.run([str(POST_TO_TASKS), message], capture_output=True, check=False, timeout=30)


def run(receipt: dict) -> None:
    git(REPO, "fetch", "origin", "main")
    base = git(REPO, "rev-parse", "origin/main")
    receipt["base"] = base[:12]
    temporary = Path(tempfile.mkdtemp(prefix="tv-listings-"))
    checkout = temporary / "checkout"
    git(REPO, "worktree", "add", "--detach", str(checkout), base)
    try:
        env = {**os.environ, "TV_QUEUE_STATE_DIR": str(STATE_DIR), "STANWOOD_REPO": str(checkout)}
        build = subprocess.run([sys.executable, str(checkout / "scripts" / "tv-queue" / "build_broader.py")],
                               cwd=checkout, env=env, capture_output=True, text=True,
                               timeout=BUILD_TIMEOUT_SECONDS, check=False)
        log((build.stdout + build.stderr).strip())
        receipt["builder"] = [line for line in build.stderr.splitlines()
                              if line.startswith(("editor:", "sponsorblock:"))]
        if build.returncode != 0:
            tail = (build.stderr.strip().splitlines() or ["no output"])[-1]
            raise RuntimeError(f"builder exited {build.returncode}: {tail[:300]}")
        edition = validate(checkout / TARGET)
        receipt.update(picks=len(edition["queue"]), reserve=len(edition["pool"]),
                       editorial_failed_batches=edition.get("editorial_failed_batches"))
        if not git(checkout, "status", "--porcelain", "--", TARGET):
            receipt["outcome"] = "unchanged"
            return
        receipt["commit"] = publish(checkout, len(edition["queue"]))
        receipt["outcome"] = "published"
    except BaseException:
        # Keep a rejected edition for inspection, never the worktree itself.
        if (checkout / TARGET).exists():
            shutil.copy2(checkout / TARGET, RUN_DIR / "rejected-broader.json")
        raise
    finally:
        subprocess.run(["git", "-C", str(REPO), "worktree", "remove", "--force", str(checkout)],
                       capture_output=True, check=False)
        shutil.rmtree(temporary, ignore_errors=True)


def main() -> int:
    RUN_DIR.mkdir(parents=True, exist_ok=True)
    lock = (RUN_DIR / ".lock").open("w")
    try:
        fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
    except BlockingIOError:
        print("another tv-listings run is in progress", file=sys.stderr)
        return 1
    started = datetime.now(timezone.utc)
    log(f"=== {started.isoformat()} ===")
    receipt: dict = {"started_at": started.isoformat(), "outcome": "failed"}
    status = 0
    try:
        run(receipt)
    except Exception as error:
        status = 1
        receipt["error"] = str(error)[:500]
        log(traceback.format_exc())
        alert(f"🔴 tv listings: tonight's Around the Internet edition failed — {str(error)[:300]}. "
              f"The previous edition stays up. Log: ~/.local/state/tv-listings/run.log")
    receipt["mark_server_up"] = mark_server_up()
    if not receipt["mark_server_up"]:
        alert("⚠️ tv listings: the ✓/× mark server on :8788 is down, so /tv marks queue in the browser "
              "and taste stops learning. Check `launchctl list | grep hide-server`.")
    receipt["finished_at"] = datetime.now(timezone.utc).isoformat()
    RECEIPT_PATH.write_text(json.dumps(receipt, indent=2) + "\n")
    log(f"=== {receipt['outcome']} {json.dumps({k: v for k, v in receipt.items() if k != 'builder'})} ===")
    return status


if __name__ == "__main__":
    sys.exit(main())
