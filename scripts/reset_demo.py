"""Reset only the explicit local demo target. Stop running services first."""

import argparse, os, shutil
from pathlib import Path

p = argparse.ArgumentParser()
p.add_argument("--target", choices=["local-demo"], required=True)
p.add_argument("--confirm", action="store_true", required=True)
p.parse_args()
if os.getenv("APP_MODE", "demo") != "demo":
    raise SystemExit("Refusing reset outside demo mode")
root = Path(__file__).resolve().parents[1] / ".data"
if root.is_symlink():
    raise SystemExit("Refusing symlink target")
if root.exists():
    shutil.rmtree(root)
print(
    "Local demo removed. Next API startup seeds 16 synthetic cases. Existing PNGs cannot be decoded with the newly generated key."
)
