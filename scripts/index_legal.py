"""Explicit operator action: embed reviewed U.S. documents into MongoDB Atlas."""
import argparse
import json
import os
from pathlib import Path
from dotenv import load_dotenv
from pymongo import MongoClient
from pymongo.operations import SearchIndexModel
from services.api.legal import registry, ingest_pdf
from services.api.legal_atlas import index_document, index_definition


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--registry", action="store_true")
    group.add_argument("--pdf")
    parser.add_argument("--metadata")
    args = parser.parse_args()
    load_dotenv()
    if os.getenv("EMBEDDING_PROVIDER") != "openai":
        parser.error("Set EMBEDDING_PROVIDER=openai and configure your OpenAI key")
    if args.pdf and not args.metadata:
        parser.error("--pdf requires --metadata")
    docs = registry() if args.registry else [ingest_pdf(Path(args.pdf).read_bytes(), json.loads(Path(args.metadata).read_text()))]
    db = MongoClient(os.environ["MONGODB_URI"], serverSelectionTimeoutMS=5000)[os.environ["MONGODB_DATABASE"]]
    db.command("ping")
    db.legal_documents.create_index("id", unique=True)
    collection = db.legal_chunks
    collection.create_index([("documentId", 1), ("chunkId", 1)], unique=True)
    name = os.getenv("ATLAS_LEGAL_VECTOR_INDEX", "legal_similarity")
    if not list(collection.list_search_indexes(name)):
        collection.create_search_index(SearchIndexModel(name=name, type="vectorSearch", definition=index_definition()))
    for document in docs:
        print(document["id"], index_document(db, document), "chunks indexed")
    print("Wait for the Atlas search index to be queryable before enabling LEGAL_PROVIDER=atlas.")


if __name__ == "__main__":
    main()
