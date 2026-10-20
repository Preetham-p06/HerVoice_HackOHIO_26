# MongoDB authority workflow and legal retrieval

The OpenAI companion remains unchanged. This configuration enables MongoDB case storage, a Mongo-backed monitor queue, optional X ingestion, case vectors, and legal-document vector retrieval. Implementation and mocked adapter tests are included; a live Atlas cluster and X account have not yet been supplied or tested.

## First-time Atlas setup

For **Find Match**, you need an Atlas database, OpenAI embeddings, and Clerk responder authentication. X and Instagram credentials are not needed for matching. Keep the working demo in demo mode until live identity and encryption settings are ready.

1. Sign in to [MongoDB Atlas](https://cloud.mongodb.com/), create a project, and create a cluster supporting Vector Search.
2. Create a database user with access to the `hervoice` database. This is separate from your Atlas website account. The setup operator also needs permission to create search indexes.
3. Add the IP address of the computer running the API to the project's network access list. If your IP changes, update this entry.
4. Choose **Connect → Drivers → Python** and copy the connection string. Replace its username/password placeholders; URL-encode special characters in credentials.
5. Save `MONGODB_URI` and `MONGODB_DATABASE=hervoice` in the ignored root `.env`. This is a database connection string, not an Atlas management API key. Never commit the URI with credentials.
6. Configure the Clerk application and organization, the live settings below, and a server-managed responder membership. A Clerk account alone does not grant dashboard access. For a local frontend, use `ALLOWED_ORIGINS=http://localhost:3000`.
7. Enable `MATCH_PROVIDER=atlas` and `EMBEDDING_PROVIDER=openai`, then run the case indexing command below. Wait until the index is queryable before testing Find Match.

For matching alone, omit the X settings and leave `LEGAL_PROVIDER` unchanged unless you also want Atlas legal retrieval. The full configuration below includes those optional integrations.

Official instructions: [connect to Atlas](https://www.mongodb.com/docs/atlas/connect-to-database-deployment/) and [configure vector indexes](https://www.mongodb.com/docs/vector-search/indexes/vector-search-type/).

### Test the database connection first

Run from the repository root after saving the connection. This checks connectivity and authentication without printing the URI or changing app mode:

```bash
.venv/bin/python - <<'PYTHON'
import os
from dotenv import load_dotenv
from pymongo import MongoClient
load_dotenv('.env')
try:
    with MongoClient(os.environ['MONGODB_URI'], serverSelectionTimeoutMS=10000) as client:
        client.admin.command('ping')
    print('Atlas connection successful')
except Exception:
    raise SystemExit('Atlas connection failed. Check the URI, database user, IP access list, and network.')
PYTHON
```

A successful ping does not verify Vector Search, database write permissions, or responder authentication. Complete the end-to-end check below too.

### Verify live matching with synthetic reports

1. Restart both services after completing the live configuration. Sign in as an authorized responder in the configured organization.
2. Create and receive at least two synthetic reports with similar physical/behavioral descriptions, plus one different description. Prepared-only reports are excluded. Existing SQLite demo cases are not automatically migrated to MongoDB.
3. Run `.venv/bin/python -m scripts.index_cases YOUR_CLERK_ORG`. Confirm `case_similarity` is queryable in Atlas and that `case_vectors` contains the organization’s records.
4. Open a received case and select **Find Match**. Confirm that the displayed search method identifies Atlas cosine similarity, results exclude the source case, and the similar description is ranked above the unrelated one.
5. Change the maximum results and minimum similarity. Confirm the result count stays within the limit and every score meets the threshold; an empty result is valid at a high threshold.
6. Verify a responder from another organization cannot access the case or see it in matching results. Refresh the dashboard to confirm case data persists.

Only after these steps pass should the deployment be described as live-Atlas verified. The existing automated adapter tests use mocks; they do not establish that a particular cluster is configured correctly.

## What runs where

1. X Recent Search fetches posts with the configured hashtag and image attachments. A cursor in `monitor_cursors` preserves pagination and the last completed batch. The first run searches the API's recent window; this is not full-history collection.
2. The connector fetches only HTTPS `pbs.twimg.com` media, without forwarding the X bearer token. Non-PNG attachments produce rejected records. PNGs are encrypted into `monitor_feed`.
3. Workers claim queued records with an expiry, decode and authenticate the payload, and verify it against the existing approved HerVoice request and recipient organization. Arbitrary external images cannot create reports. Verified intake changes a prepared case to received once.
4. OpenAI advisory decomposition is saved in the encrypted case payload. Reviewers retain control of severity/priority. Eligible received cases are embedded for Atlas matching; the explicit indexing command can retry failures.
5. Find Match uses an organization/model-filtered cosine index and returns related reports, not identity probabilities.
6. The Law bot embeds a question, searches reviewed chunks in Atlas, and sends retrieved text to the existing OpenAI synthesis step. Citations retain source URL, review date, and content hash. Country/state, review expiry, embedding model, and minimum similarity are enforced. Current canonical document metadata is checked again to reject superseded or withdrawn source versions during search-index lag.

## Required configuration

Set these in the ignored root `.env` or a deployment secret manager. Do not paste credentials into README files or Git commits.

```dotenv
APP_MODE=live
NEXT_PUBLIC_APP_MODE=live
MONGODB_URI=mongodb+srv://YOUR_DATABASE_CONNECTION
MONGODB_DATABASE=hervoice
DEFAULT_ORG=YOUR_CLERK_ORG
RECIPIENT_KEYS={"YOUR_CLERK_ORG":"BASE64_32_BYTE_KEY"}
DATA_ENCRYPTION_KEY=DIFFERENT_BASE64_32_BYTE_KEY
CLERK_ISSUER=https://YOUR_INSTANCE.clerk.accounts.dev
CLERK_AUDIENCE=hervoice
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
CLERK_SECRET_KEY=YOUR_SERVER_SECRET
ALLOWED_ORIGINS=https://YOUR_FRONTEND
API_URL=http://127.0.0.1:8000
TEXT_PROVIDER=openai
OPENAI_API_KEY=YOUR_SERVER_KEY
EMBEDDING_PROVIDER=openai
OPENAI_EMBEDDING_MODEL=text-embedding-3-small
MATCH_PROVIDER=atlas
ATLAS_CASE_VECTOR_INDEX=case_similarity
LEGAL_PROVIDER=atlas
ATLAS_LEGAL_VECTOR_INDEX=legal_similarity
SOCIAL_PROVIDER=x
X_BEARER_TOKEN=YOUR_X_APP_BEARER_TOKEN
X_SIGNAL_HASHTAG=HerVoiceSignal
SOCIAL_FEED_ORG=YOUR_CLERK_ORG
MONITOR_SCHEDULER=external
```

Keep your existing OpenAI image/speech settings. The optional fixed HTTPS feed adapter remains available when `SOCIAL_PROVIDER` is not `x` and `SOCIAL_FEED_URL`, `SOCIAL_FEED_TOKEN`, and `SOCIAL_FEED_ORG` are supplied.

Live responder access requires a server-managed membership, not just a Clerk account. Use `scripts/add_membership.py` with the configured environment as described in the architecture guide. Do not switch the shared running demo to live until identity, organization keys, and database access are ready.

## Create the indexes and load documents

Commands below load root `.env` themselves. Run from the repository root:

```bash
# Organization-approved received cases; sends matching text to OpenAI.
.venv/bin/python -m scripts.index_cases YOUR_CLERK_ORG

# Embed the existing reviewed national/Ohio registry into Atlas.
.venv/bin/python -m scripts.index_legal --registry

# Or ingest an explicitly reviewed official PDF with a metadata file.
.venv/bin/python -m scripts.index_legal --pdf /path/to/document.pdf --metadata /path/to/document.json
```

PDF metadata example (fill in actual source and review dates):

```json
{
  "id": "stable-document-id",
  "title": "Official document title",
  "url": "https://www.supremecourt.ohio.gov/path/to/document.pdf",
  "jurisdiction": "United States",
  "state": "Ohio",
  "reviewed": "YYYY-MM-DD",
  "reviewUntil": "YYYY-MM-DD",
  "effective": "Source effective date or Unknown"
}
```

Use `state: null` for national sources. New PDFs must be reviewed on the ingestion date, have a non-expired review deadline, and use an allowlisted official source URL. The script reads your supplied PDF; it does not fetch arbitrary URLs. It extracts page text, uses overlapping chunks, preserves page numbers, and rejects scanned PDFs without text. Each replacement is transactional. Index creation is asynchronous: wait until both Atlas search indexes are queryable before serving requests. The scripts create missing indexes; they do not silently overwrite an existing incompatible index definition.

The current source collection is still a small U.S./Ohio corpus. Enabling Atlas does not add divorce, custody, property, or international law coverage automatically. Add and review relevant official documents before claiming that coverage. International jurisdictions remain unsupported.

## Schedule monitoring

With `MONITOR_SCHEDULER=external`, the API does not start its internal monitor loop. Configure a scheduler to invoke this command every minute:

```bash
cd /absolute/path/to/HerWay && .venv/bin/python -m scripts.scan_feed
```

Example crontab (replace paths; no keys in the crontab):

```cron
* * * * * cd /absolute/path/to/HerWay && .venv/bin/python -m scripts.scan_feed >> /var/log/hervoice-monitor.log 2>&1
```

The command purges expired memory, drains retries, fetches one X page (up to 10 posts), and processes queued images. Mongo claims prevent duplicate active processing and expire after worker interruption. Transient intake failures retry up to three attempts; invalid or terminal payloads discard image bytes. X pagination advances only after all attachments in a page have been handled. Failed X polls preserve the cursor and store a sanitized `lastError`; cron exits unsuccessfully for operator alerting. Quotas, rate limits, downtime exceeding the recent-search window, and high feed volume can delay or omit collection. Adjust operations and API access before relying on it.

Alternatively omit `MONITOR_SCHEDULER` to use the existing 30-second internal loop. The UI's Scan now processes already queued images; it does not make a new X API request.

## Verification and limits

- Local tests verify pipeline filters, score conversion, provenance, transactional replacement, encrypted queueing, retry behavior, X pagination, token separation, and rejection of unexpected media hosts.
- Live Atlas transactions, indexes, actual X access, and an image round-trip through X still require account-backed tests.
- X can recompress/re-encode images. A visually identical PNG may fail authentication; a JPEG is rejected. No receipt or dispatch claim is made on failure. Test with synthetic data and preserve the original-PNG/manual intake path.
- This connector is read-only. It does not publish posts, access private accounts, connect Instagram, or send emergency services.

API references: [X Recent Search](https://docs.x.com/x-api/posts/search/quickstart/recent-search), [X media fields](https://docs.x.com/x-api/fundamentals/data-dictionary), [MongoDB vector indexes](https://www.mongodb.com/docs/vector-search/indexes/vector-search-type/).
