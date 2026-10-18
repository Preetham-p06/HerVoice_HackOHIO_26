# Feature parity and remaining work

This is a working end-to-end local system with explicit demo behavior and configurable live adapters. It is **not yet the entire operational production platform described by the supplied brief**. This table prevents optional integrations or source README claims from becoming fabricated success states.

| Capability | Status | Practical boundary |
| --- | --- | --- |
| Guest manual support request | Working | No required name/contact/location; exact reviewed message; idempotent receipt; synthetic org by default |
| Safe contact, optional manual/geolocation | Working | Conditional email/text/phone validation; no contact default; no external geocoder |
| Optional AI rewrite | Improved equivalent + live adapter | Demo preserves words; configured Gemini returns validated JSON; review remains mandatory; live not smoke-tested |
| Three image choices and upload | Working | Built-ins, uploads and scoped 3-cover jobs; Nova Canvas adapter is unverified with credentials |
| Encrypt/encode/verify/download | Working | AES-GCM, random nonce, UTF-8, version/length/hash/capacity, PNG validation, alpha preserved |
| Download/native file handoff | Working | Download fallback; no receipt claim from share dialog |
| Authorized decode → preview → intake | Working | Org scope, short-lived verification proof, exact narrative check and duplicate linking |
| Responder overview/list/detail | Working | 16 seeded cases/two orgs, polling, status/priority filters, pagination, assignment, notes, real events |
| Related reports | Improved equivalent | Numeric cosine over normalized hash embeddings in demo; optional Gemini/Atlas adapter and explicit index utility; organization isolation, top-N/threshold API, persisted decisions; no identity probability |
| Emotional support conversation | Working demo + live adapter | Deterministic context-aware demo; optional Gemini system instruction; no clinical validation |
| Voice and 3D companion | Improved equivalent | Opt-in browser speech; original R3F idle/blink/mouth animation; visible studio player consumes Rhubarb mouth cues when configured |
| Server TTS/FFmpeg/Rhubarb | Optional adapter | Unique directories/timeouts, ElevenLabs and cues in scoped jobs; connected to a visible player and timed companion cues; not smoke-tested with live credentials |
| Legal information | Improved equivalent, narrow source set | U.S.-first local numeric retrieval, optional Gemini synthesis, and jurisdiction-scoped follow-up context over reviewed DOJ, HHS, and Ohio court source summaries; national vs. state filtering; no determination of legal rights |
| Corpus ingestion | Working offline admin utility | Pypdf extracts native text, rejects scanned/no-text PDFs; source allowlist/hash/pages. Full OCR/admin web ingestion is not implemented |
| Hashtag image monitoring | Demo + permitted connector | Durable bounded demo feed, 30-second scanner, authenticated HTTPS feed adapter; no social-network credentials or operational partner source supplied |
| Live dispatch/human response guarantee | Unavailable | No operational organization integration; never implied |
| Guest tracking/deletion | Working | Browser receipt cookie, hash at rest, scoped status, deletion; external downloads/backups remain |
| Account-owned request persistence | Unavailable | Guest session works; optional public account history/save-resume has not been implemented |
| Persistent consented chat memory | Working | Explicit opt-in; encrypted SQLite/Mongo payloads; private cookie ownership; rolling 24-hour expiry and purge; off/delete controls |
| Demo auth isolation | Working | Server-established synthetic sessions; disabled in live; production demo requires explicit local override |
| Clerk live authorization | Implemented adapter, unverified live | JWT RS256 issuer/audience/expiry + active server-managed org membership; tested with generated RSA tokens/mocked membership |
| MongoDB | Implemented adapter, unverified live | AES-GCM case payloads; indexed metadata; no real MongoDB smoke test |
| Private S3 | Implemented adapter, unverified live | Private put/get with SSE; API scopes job reads; bucket Block Public Access/lifecycle requires operator configuration |
| Retention/jobs | Partial | Expiry-enforced result reads, local cleanup, deletion; no durable external worker recovery, automatic backup deletion or organization retention policy |
| Encryption rotation | Partial | Independent live organization/data keys configurable; archived key IDs and multi-key rotation migration not implemented |
| Shared API contract | Partial | Generated OpenAPI and TypeScript input schemas/drift check; dictionary response models still runtime contracts |
| Container startup / CI | Supplied | Native startup/build/tests exercised; Docker runtime not available during implementation; CI results reported separately |

## Before real use

Live credentials alone are not a production readiness claim. Required remaining operational work includes approved organizations/contact handling, retention/backup policy, encryption-key rotation, scaled/distributed rate limiting and job recovery, current legal review, account-owned persistence if desired, Atlas semantic retrieval if required, and a live integration/security/accessibility review. Some live UI copy remains oriented to training and must be reviewed for the selected organization. Nothing was publicly deployed.

See [hackathon demo](hackathon-demo.md) for the updated judge walkthrough, connector protocol, and live-service boundaries. Structured case analysis is extractive in demo; keyword review flags do not establish facts or danger.
