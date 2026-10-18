"""Explicit offline administrator operation; never fetch arbitrary user URLs."""

import argparse, json, sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from services.api.legal import ingest_pdf, REGISTRY, registry

p = argparse.ArgumentParser()
p.add_argument("--pdf", required=True)
p.add_argument("--metadata", required=True)
p.add_argument("--target", choices=["demo-registry"], required=True)
a = p.parse_args()
doc = ingest_pdf(Path(a.pdf).read_bytes(), json.loads(Path(a.metadata).read_text()))
rows = [d for d in registry() if d["id"] != doc["id"]] + [doc]
REGISTRY.write_text(json.dumps(rows, indent=2, ensure_ascii=False) + "\n")
print("Ingested reviewed document", doc["id"], len(doc["chunks"]), "chunks")
