# HerVoice reference parity audit

HerVoice preserves the workflow in the supplied screenshots while using an original U.S.-first interface, a neutral reading cover, and OpenAI providers. This is a hackathon demonstration, not an operational emergency service.

| Reference step | HerVoice implementation | Verification |
| --- | --- | --- |
| Name, contact, location, duration and incident frequency | Optional alias, one safe contact method, manual or consented location, keyboard-operable duration/frequency sliders, person description, injuries and situation text | Structured brief API test; desktop/mobile browser journey |
| Generate Text | OpenAI expands the supplied situation and optional details. Every generated word can be edited. Manual continuation remains available. No invented facts or false urgency are requested. | Real OpenAI synthetic walkthrough plus input-context unit test |
| Review and Generate Image | Editable approved text, image prompt, presets, three real OpenAI choices, selected-image state | Real provider smoke test; browser journey |
| Steganography | Original PNG contains the exact approved UTF-8 narrative, encrypted with AES-GCM and encoded into pixel bits, with length/hash/schema/organization verification | Unicode/capacity/tamper/cross-organization tests |
| Submit post and sharing | Full image preview, native file sharing/download, explicit queue submission, or controlled tagged demo feed | Receipt-owned idempotent feed test; browser journey |
| Submission complete | Accurate received/prepared/queued status and original encouragement; no claim of public posting or emergency dispatch | Browser journey |
| User / authority flow diagram | Two-lane How HerVoice Works panel on the private home page | Visual review and accessibility checks |
| Hashtag monitoring | 30-second durable controlled #HerVoiceSignal scanner; fixed permitted HTTPS connector adapter for live use | Decode→verify→receive-once monitor tests |
| Reverse steganography | Authenticated original-PNG decoding; wrong organization, damaged content, or changed narrative rejected | Backend tests |
| Structured text decomposition | OpenAI advisory summary, reported nature, review flags and severity suggestion are stored automatically after verified intake; explicit retry in case details | Stored-analysis and unchanged-priority tests; synthetic live walkthrough |
| Severity organization | Reviewer-controlled low/medium/high/very-high severity, separate normal/high queue priority, sorted queue and actual status/priority/severity events | API update test; desktop/mobile UI checks |
| Find Match | OpenAI dense embeddings and cosine search over received reports in the current demo, top-N/threshold controls, same-org/self-exclusion, ranked report results and persisted review decisions | Real 768-dimensional embedding test; scope/threshold tests |
| Atlas Vector Search | Configurable MongoDB Atlas vector adapter; model and organization filters, 768 dimensions, explicit indexing utility | Adapter implementation; no live Atlas account supplied |
| Case detail screenshot | Six summary cards, reported location/map link, safe contact, optional details, AI summary, reviewer controls, activity timeline, Find Match dialog | Desktop/mobile browser journey |

## Exact remaining external boundaries

- Current runtime stores synthetic cases in local SQLite. The encrypted MongoDB adapter requires a MongoDB URI and a configured live organization/auth environment. It has not been smoke-tested against a real Atlas cluster.
- Current matching demo uses real OpenAI embeddings with a bounded process-local vector cache. It does not pretend this is an Atlas query. `MATCH_PROVIDER=atlas` selects the live Atlas adapter; `MATCH_PROVIDER=openai_local` selects the synthetic demo.
- Public Twitter/X, Instagram, Telegram and Slack account publishing/monitoring are not connected. A public social platform may recompress an image and destroy its hidden payload. The controlled demo feed transfers original PNG bytes and demonstrates the complete scan/decode/intake path.
- A neutral appearance does not guarantee secrecy from a person monitoring the device, browser history or network. No real authority is contacted, and dispatch is not implemented.
- The female companion is an original illustrated avatar with optional OpenAI speech and visible playback state. It is not a rigged lip-synced 3D character.
- No unsupported impact percentages, identity probabilities or promises that help is coming are presented as facts.

## Judge walkthrough

1. Start on the everyday reading cover. Follow its highlighted entry clue and open personal space.
2. Open Create a post. Use synthetic details, adjust the sliders and choose Generate Text.
3. Review the draft, generate three image options and select one.
4. Choose Send to monitored demo feed, then Send demo signal.
5. Follow Watch the signal reach the dashboard. Wait for the 30-second scanner or use Scan now.
6. Open the verified case. Inspect the six cards, stored advisory extraction and actual activity events. Retry Analyze intake if generation was unavailable.
7. Find Match compares received reports. Treat results as review leads, then set reviewed severity/priority or add a case note.
8. Show the Law bot and Therapy bot, including opt-in AI voice, then return to the neutral cover.
