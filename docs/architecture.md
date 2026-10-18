# Architecture

## Runtime boundaries

Next.js owns navigation and presentation. Its runtime `/api/v1/*` gateway forwards a bounded request, selected identity/origin headers and cookies to FastAPI. It contains no independent role/case rules and preserves API error status. API_URL is read at request time so Docker service discovery works after build. All case/file/job permissions are checked by FastAPI even for direct API calls.

FastAPI owns Pydantic validation, safe-contact normalization, request idempotency, receipt access, responder scope, case versions/events, codec framing/encryption, intake verification, retrieval and jobs. The `/docs` endpoint documents `/v1` contracts. Request IDs and UTC timestamps accompany operations. Errors exclude raw request values, exception traces and provider credentials.

Demo uses local SQLite (an intentional deviation from MongoDB to make an offline no-credential review possible). Live uses MongoDB's canonical `cases` collection and independent memberships/decisions/jobs/intake collections. Request payloads are encrypted at rest in live mode with a fresh AES-GCM nonce and organization/case AAD. IDs, org, delivery/filter metadata, receipt hashes and versions remain searchable; narratives/contact are encrypted. Demo data is plaintext synthetic data in `.data/demo.sqlite` and must never contain real information.

## Authorization

Demo session cookies contain random secrets; database rows store hashes and a one-hour expiry. Choosing a practice role creates a server-side synthetic session, not a live privilege. The demo session endpoint rejects live mode. APP_MODE values are validated; demo is blocked when NODE_ENV=production unless ALLOW_LOCAL_DEMO=true explicitly authorizes a local demo build.

Live staff identity accepts Clerk's session cookie or bearer JWT. Verification uses the configured HTTPS issuer's JWKS, RS256, issuer, audience, expiration, issued-at and subject. Current active membership is read from the server-managed memberships collection; neither unsafeMetadata nor a client org/role grants access. Select the active organization in Clerk and configure the audience claim. Revoking the database membership denies access on the next API request. Organization admins are provisioned with the explicit operator CLI, not signup.

Guest receipt cookies contain 40 random URL-safe bytes, are HttpOnly/SameSite=Strict (Secure in live), and expire in one day. Only their hash is stored. IDs in routes are non-authorizing opaque identifiers; narratives/contact/coordinates never enter URLs. Reads return scoped 404s and public signup cannot see case queues. Cookie mutations check configured Origin when present; SameSite cookies protect normal browser requests without Origin. Server rate limits are per-process and must be replaced with a shared edge/store limit for multi-replica deployments.

## Case lifecycle

Original input and approved narrative are separate fields. `channel=direct` writes a received record; `channel=image` writes prepared-only. An idempotency key links retries to the same logical record; an unrelated receipt session cannot retrieve an existing idempotency record. Events are created on actual receipt/preparation, assignment, note, status transition and intake. Closure requires a reason. Version checks reject stale updates; Mongo replacements include expected version.

Queue filtering and pagination are performed in the API. Demo is small; the current live repository scans at most 5,000 authorized candidate records before filtering. This is a documented scaling limit, not an Atlas-backed semantic/large-queue implementation. Related search is lexical, scoped, excludes self, and never claims an identity probability. Decisions persist separately.

## Image transport

PNG bytes are decoded with bounded dimensions and file sizes; arbitrary remote asset URLs are unsupported. Fresh cover/output bytes strip extra image metadata. LSB framing: `HV01` magic/version, big-endian body byte length, SHA-256 encrypted-body digest, 12-byte nonce and AES-GCM ciphertext/tag. Ciphertext is authenticated against recipient org ID. Capacity is checked before writing; UTF-8 and alpha are preserved. Decoding exact exported bytes verifies the result before download.

LSB transport is not encryption; AES-GCM is server-readable encryption. No end-to-end or social-transport guarantee is made. The original PNG is required. Current key selection supports one configured key per org; historical key IDs/rotation require a migration. The guest session owns download/encoding; responders can decode only within their organization. Intake produces a ten-minute random server-held proof before confirmation can record verified receipt.

## Providers and jobs

`providers.py` contains Gemini JSON output/support and ElevenLabs adapters. Models/voice IDs are explicit configuration, not historical assumptions. Writing/support failures are 503 responses and never become a demo success in live mode. Support instructions preserve autonomy, do not diagnose or invent resource contacts, and forbid dispatch promises. Demo behavior is deterministic and labeled.

`jobs.py` uses a bounded two-thread executor, durable metadata, random IDs, owner scope, status/progress, cancellation, one bounded attempt, expiry, temporary-directory cleanup and sanitized failures. Nova Canvas uses Bedrock InvokeModel; S3 uses private objects with SSE and authenticated API reads. Optional media processing discovers FFmpeg on PATH and uses configured Rhubarb with unique directories and timeouts. A dedicated external queue/worker is an operational extension; interrupted jobs do not auto-recover.

Current speech jobs are API adapters. The visible player uses explicitly initiated browser speech and an original code-generated R3F companion with neutral fallback; it does not claim exact viseme alignment. WebGL is lazy and an error boundary preserves text fallback. Persistent memory and microphone capture are not enabled.

Provider contracts checked against official documentation on 18 October 2026:

- [Gemini GenerateContent](https://ai.google.dev/api/generate-content)
- [Clerk manual JWT verification](https://clerk.com/docs/guides/sessions/manual-jwt-verification)
- [Clerk session tokens](https://clerk.com/docs/guides/sessions/session-tokens)
- [Boto3 Bedrock InvokeModel](https://docs.aws.amazon.com/boto3/latest/reference/services/bedrock-runtime/client/invoke_model.html)
- [ElevenLabs Create speech](https://elevenlabs.io/docs/api-reference/text-to-speech/convert)

These references support the adapter design; they do not establish that configured live calls were tested.

## Legal provenance

The maintained JSON registry stores URL, authority, jurisdiction, SHA-256 document version, review/effective dates, expiry/status, full selected text, section/page, numeric 128-dimension hash embeddings and embedding model metadata. Retrieval filters jurisdiction, status, review expiry, lexical relevance and dimension before ranking. Source IDs/URLs come from retrieved records, never generated URLs. Unsupported or empty retrieval abstains.

The active starter corpus contains reviewed, paraphrased U.S. DOJ survivor-directory guidance, HHS support guidance, and Ohio Supreme Court protection-order resources. National sources have no state scope; Ohio sources are eligible only when Ohio is explicitly selected. Other states receive national guidance and an explicit local-coverage limitation. Source hashes identify the reviewed summary text, not an unrecorded full web download. This is not a complete current legal database. Generic PDF ingestion uses a parser and rejects no-text PDFs; it never reads PDF bytes as Latin-1. Offline ingestion requires an explicit metadata file and allowlisted government URL and writes the selected demo registry. Admin HTTP ingestion, full OCR and legal generative synthesis are not implemented.

## Deployment limits

Configure HTTPS, exact origins, secret management, separate org encryption keys, private S3 Block Public Access/lifecycle, staff memberships and provider IDs. Do not expose demo mode publicly. No deployment was performed. User-facing retention policy, multi-key rotation, backup/derived-data deletion, persistent account ownership, live staff logout and full application review remain required before real operational use. See feature-parity.md.
