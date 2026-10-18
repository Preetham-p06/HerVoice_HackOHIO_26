# HerVoice: judge walkthrough

HerVoice is U.S.-first. The reference project reference is a feature specification, not a source of privacy guarantees, legal advice, or clinical claims. All interface and illustration work here is original.

## Five-minute local demonstration

1. Start with `npm run dev:all`; open http://localhost:3000. The default view is **Everyday Notes**, with working reading, filtering, and search. Read the highlighted words: **Click the button below for help**. Press **Open personal space** to enter the HerVoice demo in one click. The persistent **Help options** button opens the real U.S. hotline choices. Use synthetic information for the demonstration.
2. **Request support** → enter a short situation → optionally request a rewrite → review → choose image delivery. Pick a botanical, landscape, or food illustration, upload your own original PNG, or request three covers. Download the encoded PNG. Image delivery is still **prepared** at this point.
3. **Responder sign-in** → choose the demo organization → **Image intake**. Under **Image monitoring lab**, upload that PNG and queue it. Wait for the 30-second scan or press **Scan now**. Open the resulting verified case. The receipt now reflects actual intake. Re-queueing does not create a duplicate intake event. Images belonging to another organization are rejected.
4. Open the case, press **Analyze intake**, inspect the extractive summary and human-review flags. Search related cases: numeric cosine similarity is shown as a similarity score, never as a culprit identity probability. Link/reject decisions require a reason.
5. **Support chat** → send a message → optionally enable the original illustrated companion and browser speech. Explicitly allow encrypted **24-hour conversation memory** if desired, revisit the page, and turn memory off to delete it. No responder can access these conversations.
6. **Know your rights** → choose U.S./optional state → ask a question and a follow-up. Sources remain attached to the retrieved answer; unsupported jurisdictions and missing evidence produce an abstention. The small reviewed collection is support guidance, not comprehensive U.S. law.

## Optional live services

Set the documented environment values server-side; no credentials are committed. These adapters require operator configuration and have not been smoke-tested against paid/live accounts:

- Gemini: reviewed narrative rewriting, emotional-support responses, and synthesis over retrieved U.S. sources.
- Nova Canvas / Bedrock: three generated cover choices. Local choices are original procedural illustrations, not claimed AI photographs.
- ElevenLabs: **Generate studio voice** creates a scoped audio job and exposes a visible player. FFmpeg + Rhubarb can generate timed cue data; the current illustrated companion shows playback status rather than lip sync. Browser speech remains a separate opt-in fallback.
- MongoDB/Clerk/private S3: encrypted case storage, verified organization membership, and private job assets.
- Gemini embeddings + Atlas: set `MATCH_PROVIDER=atlas`, `GEMINI_EMBEDDING_MODEL`, and `ATLAS_CASE_VECTOR_INDEX`. Run `.venv/bin/python -m scripts.index_cases APPROVED_ORG_ID` with approved live settings to create the 768-dimensional cosine index and embed authorized case narratives. This sends those narratives to Gemini. Re-run indexing after case changes; Atlas indexing is asynchronous. Search enforces organization/model filters and excludes the current case. Local mode uses normalized hash embeddings and exact numeric cosine similarity; it is not semantic identity resolution.

## Permitted social-feed connector

No Instagram, X, or Slack account is accessed automatically. A participating organization can configure `SOCIAL_FEED_URL`, `SOCIAL_FEED_TOKEN`, and `SOCIAL_FEED_ORG`. The fixed HTTPS endpoint must be operated with permission to access those posts and original image files. Every 30 seconds, HerVoice sends an authenticated GET and expects:

```json
{"items":[{"id":"stable-source-post-id","hashtag":"#HerVoiceSignal","pngBase64":"BASE64_OF_UNCHANGED_PNG"}]}
```

Responses are bounded to 12 MB/20 items; redirects are not followed. Duplicate source IDs are ignored. Queued image bytes are encrypted at rest and cleared after scanning. The decoded payload must pass AES-GCM verification, organization/schema checks, and exact canonical-narrative matching before intake. Corrupted/recompressed images are rejected. The connector does not make HerVoice an emergency dispatch service. This single-process scheduler requires persistent storage and one API worker; a distributed scheduler and operational alerting are future deployment work.

## Scope boundaries

This implements the reference's demo workflows and configurable integration paths. It does not reproduce proprietary assets, unsupported success metrics, “total privacy,” guaranteed social-media delivery, or guaranteed culprit identification. Public account-based case history, durable distributed worker recovery, key-rotation migration, broad state-law coverage, and operational service partnerships remain outside this hackathon build. Do not present this as a production emergency service.


## Discreet entry and return behavior

The default rendered public DOM contains no support navigation, hotline launcher, or case content. Opening a bookmarked support URL still shows the reading site until the user opens Personal space. Metadata stays neutral in both modes. Frontend paths use `/studio`, `/journal`, `/library`, `/collections`, `/saved`, `/account`, and `/workspace`; legacy paths remain accepted but are neutralized when opened through the gate. Backend API paths are unchanged and may be visible in network records.

**Back to reading** closes dialogs and unmounts support components, cancels speech/media, and replaces the current route with `/`. Two Escape presses within 900 ms do the same. Page hiding and history restoration cover the tools; there is no saved unlock preference. Returning to reading clears unsaved drafts and ephemeral conversation state, not saved requests or explicitly consented server memory. Reading stories/search/filter state is local and makes no support API calls before entry. A neutral deployment domain is still necessary; the current local address is not a production domain. No claim is made about hiding activity from monitoring software, history, screenshots, downloads or traffic inspection.

The expanded request form now has optional duration, frequency, visible-injury and person-description fields. Matching uses the person description when supplied, with visible top-N and cosine-threshold controls. The encouragement button supplies original demo verse or configured provider generation; it never promises rescue or dispatch.


## Primary demo navigation

The five primary pages are Home, Create a post, Law bot, Therapy bot, and Dashboard. Their existing neutral frontend paths remain in use. The dashboard uses five-second polling and real stored case events; “live updates” does not imply emergency monitoring. Demo mode establishes a synthetic organization session when a visitor opens Dashboard without one; an existing organization selection is preserved. Live mode does not create demo access. Therapy bot shows the original illustrated companion beside the conversation, with opt-in speech and a Text only toggle. The reference video was inspected for its post form, live case table, and avatar-led layout; proprietary character assets were not copied.

### Guided image post
Create a post now follows four stages: complete the situation/contact form, review the exact approved message and generate three images, select an image and submit/share, then read the completion note. Image generation first creates a private prepared request; only explicit Submit post sends it to the dashboard. Receipt-owner submission is idempotent. Changing approved text invalidates its image selection.

Demo images are original procedural illustrations, not AI photos. For OpenAI text-to-image generation configure IMAGE_PROVIDER=openai, OPENAI_API_KEY and OPENAI_IMAGE_MODEL on the API server (see .env.example); never place credentials in browser code. This explicitly enables network image generation even with synthetic demo storage. The image provider receives only the cover prompt. Social buttons invoke native file sharing where available, otherwise download the original PNG for manual attachment. They do not automatically publish to a social account or claim delivery.

OpenAI configuration also supports text, studio voice and optional semantic embeddings using the same server-only key. See `docs/api-setup.md`.
