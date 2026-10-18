# Source audit

**U.S.-first update:** The current application uses reviewed U.S. national support resources and Ohio court resource summaries. The India source work below records the original audit/build history and is no longer the active source corpus.

Reference: https://github.com/annu12340/Haven

Inspected commit: `a93c17f2af624c46b7187d9870119d129950f55d`, matching both supplied documents. The reference was cloned to `/tmp/hervoice-reference`, outside this implementation. No upstream code, binary model, image asset or Git history was copied. No LICENSE was found at the reference root; original code and a code-generated companion avoid unclear reuse rights.

The supplied rebuild brief is a product specification, not authorization for contacts, social publication, dispatch or deployment. The user's instructions override its Haven naming: this implementation is **HerVoice**. The supplied screenshot identifies the destination repository as `Preetham-p06/HerWay`.

## Findings and rebuilt journey

| Area / inspected evidence | Reference status | HerVoice behavior |
| --- | --- | --- |
| create-post, InputForm, ImageGen, MultiStep, Share | Partially connected UI; edited narrative can be lost; implicit state advancement | Explicit four-step wizard, manual optional contact/location, approved message preserved |
| All eight frontend API routes; backend main.py | Thin proxies plus direct general Gemini chat; no encoding gateway | Same-origin runtime gateway; all sensitive decisions in FastAPI |
| backend steganography.py | Genuine red-channel LSB utility, disconnected from sharing; terminator, Unicode/overflow errors; plaintext | Authenticated encryption, UTF-8, versioned length frame, SHA-256 corruption check, capacity limits and decode-before-download |
| Share.tsx | Decompose called with wrong input; nonexistent encodedImage property; success before save; inactive social buttons | Awaited persistence; separate prepared/received states; original PNG download/native-share fallback; authorized upload intake |
| sign-up, middleware, dashboard and case endpoints | unsafeMetadata admin flag trusted; backend authorization absent | Synthetic server sessions in demo; verified Clerk + server-managed MongoDB membership in live adapter |
| RealtimeList, dashboard, post/[id], PostDetail, Timeline | One fetch, broad case APIs, hardcoded activity and separate close update | Scoped queue, 30-second polling, filters/pagination, optimistic version, real change events, closure reason |
| backend db/schema/embedding | admin save differs from complains2 matching; vector percentage uncalibrated | One canonical case repository; explicitly labeled lexical related suggestions and persisted human decisions |
| lawbot and /api/chat | General Gemini latest message; no retrieval/citations/history | Maintained source registry, numeric local embeddings, actual retrieval, official citations; extractive answers and abstention |
| common.py / upload_embeddings | PDF read as Latin-1; disconnected embedding helper | Pypdf ingestion rejects no-text PDFs; initial selected scanned passages visually transcribed and dated |
| Avatar frontend hook/UI/Avatar/Experience and Express handler | Working isolated pipeline with hardcoded localhost, Windows binary, fixed filenames, unrelated key gate | Lazy original R3F companion, opt-in browser speech, ephemeral chat; optional portable server TTS/Rhubarb job adapter |
| Avatar assets and animation names | Ready Player Me and tutorial attribution; Angry/Crying/Laughing/Rumba/Terrified plus idle/talk clips | No asset reuse; neutral/gentle, idle/talking allowlist; source rig remains replaceable |
| text_llm, prompts, regex_ptr | Gemini/Groq expansion and decomposition; prompt can inflate urgency | Original/approved text separate; demo preserves words; optional structured validated Gemini output |
| README social monitoring and consented memory claims | README-only claims; no operational cron or conversation-memory path | No implied social discovery or monitored dispatch; memory off, no background social monitoring |

Text implementations in the reference use Gemini/Groq/Vertex, not the README's claimed Titan Text path. The Twitter helper is an outbound publisher, not inbound monitoring. Neither source utility existence nor a share callback is delivery evidence.

## Legal source provenance

India Code PDF downloads timed out in this development environment. An official Assam copy downloaded successfully but was scanned Assamese and was not used for English answers. A government-hosted S3WaaS/NIC copy downloaded successfully; it is a scanned English source with incorrect decorative “Section/Chapter” headings. Selected actual statutory paragraphs from sections 12, 17 and 18 were visually checked on rendered pages 6–7 and transcribed into the registry. Source hash, URL, page, section, transcription review date and a review expiry are stored. This does **not** establish current consolidated law or later case law; the UI says so explicitly. The generic PDF parser correctly does not manufacture text from those scanned bytes.

## Boundaries

No live case data was accessed. No external dispatch, reports, social publication or public deployment was performed. External providers are code adapters with documented official contracts; live calls were not made with paid credentials. See feature-parity.md for capabilities still unavailable.
