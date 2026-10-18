"""Explicit admin operation: embed authorized cases into the configured Atlas index.
Run only with approved live credentials and organization ID: python -m scripts.index_cases ORG
"""

import json
import sys
from services.api.main import MODE, store
from services.api.matching import index_case, DIMENSIONS

if __name__ == "__main__":
    if MODE != "live" or len(sys.argv) != 2:
        raise SystemExit("Live mode and one approved organization ID are required")
    org = sys.argv[1]
    from pymongo.operations import SearchIndexModel

    name = "case_similarity"
    import os

    name = os.getenv("ATLAS_CASE_VECTOR_INDEX", name)
    existing = list(store.mongo.case_vectors.list_search_indexes(name))
    if not existing:
        store.mongo.case_vectors.create_search_index(
            SearchIndexModel(
                name=name,
                type="vectorSearch",
                definition={
                    "fields": [
                        {
                            "type": "vector",
                            "path": "vector",
                            "numDimensions": DIMENSIONS,
                            "similarity": "cosine",
                        },
                        {"type": "filter", "path": "org"},
                        {"type": "filter", "path": "model"},
                    ]
                },
            )
        )
    for row in store.all(org=org):
        index_case(store, json.loads(row["data"]))
    print("Authorized cases indexed. Wait for Atlas index readiness before searching.")
