# HerVoice: assistant briefing and judge Q&A

Prepared October 24, 2026. This is a project knowledge file, not proof of production readiness. It describes the repository and development checks available when written. Configuration and test results can change.

## Judge Q&A response style

Write something a teammate could comfortably say out loud. The judge may have no coding background. Respond directly to their question in **one short paragraph**, usually **35–65 words in three or four sentences**. A simple question may only need one or two sentences. Give only the spoken response: no heading, bullet points, stage directions, or “Here's what you should say.”

Use ordinary language and contractions: “we built,” “we found,” “it helps,” “we'd,” and “didn't.” Don't add forced slang or filler like “basically,” “you know,” or “honestly.” Keep sentences short enough to say in one breath. Let the answer stop when the question is covered.

Keep STAR in the background, not as a formula. For a challenge question, explain what went wrong, what we changed, and what happened afterward. For a feature question, explain what it does and why it helps. For a simple factual question, give the fact. Do not start every response with “We needed” or “We wanted,” or finish every one with “The result is.”

**Explain the experience first; explain the machinery only if asked.** Don't list three tools when one plain explanation will do. If the judge names MongoDB, discuss MongoDB without introducing five more terms. If they ask how the matching works, start with “it compares the meaning of descriptions.” Save embedding dimensions, cosine similarity, API routes, model versions, and encryption framing for a specific technical follow-up.

Prefer these phrases in spoken responses:

| Instead of | Say |
| --- | --- |
| Responder workflow | How responders receive and review requests |
| Numerical text representations | A way for the system to compare the meaning of text |
| MongoDB adapter | The code that connects to MongoDB |
| Account-backed validation | Testing it with a live account |
| Source-grounded synthesis | Explaining information from the sources we provide |
| Scoped access | Each organization can only see its own cases |
| Submission confirmation | The page you see after submitting |
| Synthetic information | Made-up reports for the demo |
| Surface related information | Find similar reports |
| Bounded background executor | Processing longer tasks in the background |

Don't give a testing report unless asked about testing. For example, say “we checked it on phones and computers,” not “desktop and mobile regression checks validated the submission lifecycle.” Avoid abstract benefit claims; say what someone can now see or do.

Stay accurate without attaching a long warning to every answer. Include limits that affect the specific question: don't imply the demo uses live MongoDB, dispatches police, identifies an abuser, or provides professional therapy. State the limit plainly, not with meta-commentary like “I wouldn't claim…” or “quoting a number would be misleading.”

Use “we” for documented team work. Don't invent accomplishments, incidents, partners, personal experiences, metrics, or test results. If asked how we could do something new, explain the approach with “we would.” Keep future plans separate from things already working. Follow the competition's rules about AI assistance.

Before returning a response, silently read it as speech. Cut anything that sounds like a README, explains an unrelated tool, repeats the question, or turns one thought into a long sentence. Keep the specific point the judge asked about.

### Confidence and impact

Speak with ownership: “We built,” “We handle that by,” and “Our approach is.” Avoid hesitant filler such as “actually,” “sort of,” “it should,” and “we just.” Give a direct answer rather than commenting on what you can or cannot claim.

Use **solution → relevant mechanism → practical value** for most questions. For challenges, use **problem → action → result**. End with the specific benefit of the feature or control, not a generic slogan. Examples: “That keeps the user in control of what gets shared,” “That gives responders a clear record to review,” or “That lets someone check where the information came from.” Vary the ending to fit the question.

For a failure or safety question, answer the failure honestly first, then explain the control and why it matters. Do not hide a material limitation in positive language. A strong response can say that compression breaks a message and then explain verified intake and the original-file submission path. Do not imply those controls make compressed images recoverable.

Mention only limitations relevant to the question. Avoid attaching an unrelated warning to every feature description. When a limit matters, place it beside the mechanism it qualifies and finish with what the implemented feature does provide. Never turn “we plan to” into “we already do,” or describe an intended benefit as a measured outcome.

Technical questions deserve technical answers. Name the specific tools and what each does, then connect them to the user experience. For Maya, distinguish the existing rigged character from the language model: OpenAI generates replies, not the 3D model. Say **Nova**, not “Noble”; **React Three Fiber**, not “React 3 fiber”; **transcribe**, not “transcript” as a verb; and **controlled demo feed**, not “controller feed.”

Do not repeat the practice transcript's “30 cents” as a general cost claim. It is a team-reported figure without a documented usage window or workload in this file. Only use it if the team verifies the billing scope, and describe it as the cost of that specific test.

The technical sections below are background facts, **not a speaking template**. Use the conversational examples near the end to set the voice.

## Project identity

**Name:** HerVoice  
**Tagline:** A quiet way to be heard.  
**Team:** Team Impact  
**Contributors:** Preetham Prabhu, Aadit Bhatia, Akarsh Penubaka  
**Repository:** https://github.com/Preetham-p06/HerVoice_HackOHIO_26  
**Demo video:** https://youtu.be/AAFByEBo2XE

Individual contributions have not been documented here. Ask the team before attributing a feature to a person.

**One sentence:** HerVoice is a prototype that brings discreet support requests, an AI conversation companion, legal-resource guidance, and a responder workspace into one application.

**Problem:** People experiencing abuse can face monitored communications, isolation, uncertainty about their rights, and difficulty finding support. HerVoice explores an easier first step while letting users choose what to disclose.

**Personal inspiration:** The team supplied a presentation story about a friend who experienced abuse. Use that only with the team's approval; do not invent details about the friend or claim the prototype would definitely have prevented harm.

**Intended impact:** Reduce friction in asking for support and organize reports for human review. No measured safety, clinical, or response-time benefit has been established. Existing shelters, hotlines, advocates, and legal professionals remain essential.

## The four parts of the product

### 1. Discreet entry and create a post

The public cover looks like an everyday notes, music, or books website. Reloading rotates cover editions. Users enter personal space through the visible entry controls. Leaving a private user tab conceals support tools behind the cover; double Escape also exits. The responder workspace is exempt from ordinary tab-switch concealment so responders can consult another tab without losing their view.

An explicit Twitter sharing handoff temporarily preserves the post during the immediate tab switch. This is a narrowly scoped exception, not a permanent disabling of concealment.

**Limit:** A cover changes what is on screen. It does not remove history, downloads, network logs, spyware, screenshots, or device monitoring. Avoid calling it undetectable.

Create-post flow:

1. Enter a narrative and support type. Optionally add an alias, duration, frequency, person description, contact preferences, safe contact time, and city/region. Browser location is optional.
2. Review the message. AI can expand notes into an editable draft; the user approves the final wording.
3. Generate/select a cover and prepare the encoded image.
4. Choose a destination: direct queue submission, the controlled demo feed, or image-only preparation.
5. Read the completion state and receipt. Direct submission offers a link to the submitted case.

A prepared or downloaded image is **not** a received case. Direct **Submit post** sends the prepared request to the queue. Feed mode waits for verified intake. Image-only mode leaves it prepared.

### 2. Maya

Maya is an AI support companion with text, optional voice input, and AI-generated speech using the configured Nova voice. A saved Nova greeting is available. Playback can depend on browser autoplay restrictions; do not promise automatic audio always succeeds.

The cream/sage workspace places the avatar beside the conversation. Users can choose starters, type, review a transcription before sending, pause animation, use a still image, zoom, and control speech. The avatar has idle body/hand movement, blinking, and approximate audio-driven mouth animation.

Optional conversation memory is encrypted, limited to 20 messages, and expires after 24 hours. Users can disable/delete it. These controls do not establish a universal deletion guarantee across external providers and backups.

Maya's instructions emphasize autonomy, no blame, optional grounding exercises, and no pressure to disclose. It is not therapy, diagnosis, medication advice, or a clinically validated intervention. No camera or face recognition is used.

### 3. Law bot

The bot provides general U.S. legal-support information from a small reviewed source registry. Current scope includes national DOJ/HHS support guidance and selected Ohio court protection-order resources.

Users choose a jurisdiction and optional state. National information is available without a state. Selecting a state does not mean that state has comprehensive coverage. Ohio-specific passages require Ohio selection; unsupported countries or questions should receive an honest coverage limitation or abstention.

Local flow: question and jurisdiction → eligible reviewed sources → lexical/hash-vector ranking → relevant summaries → optional OpenAI explanation → answer and canonical source links.

Optional Atlas flow: reviewed PDF text/chunks → embeddings/index → query embedding → MongoDB Atlas Vector Search → recheck source metadata → OpenAI explanation and sources. PDF ingestion preserves page information and uses overlapping chunks. Scanned PDFs without extractable text require another workflow; OCR is not implemented here.

**LangChain:** Not a dependency of the current pipeline. Python code and provider APIs implement retrieval directly. **RAG** means retrieving relevant material before asking the model to answer; RAG does not require LangChain.

### 4. Responders

The dashboard polls every five seconds and lists six cases per page. Newest-first is the default; responders can change severity sorting, search alias/category, filter status/priority, choose columns, and open cases. Demo access is a practice workflow. Live access requires configured authentication and organization membership.

A case shows:

- Original/approved report context, alias, support type, and timestamps.
- Safe contact preferences, including “Do not contact.”
- Frequency, duration, reported person description, and location when supplied.
- Case status, reviewed severity, priority, and assigned responder.
- AI-generated advisory summary/classification when analysis is available.
- Activity events, private notes, and update controls.
- An embedded Google map and an external map link for a reported location.
- Related-report comparison and human review decisions.

Google Maps receives the reported location when the embedded map loads. A city/region is approximate, not a verified live position. Map controls were tested with a mocked Google response; successful live rendering is not established by that test.

Responders can update status, reviewed severity, priority, assignment, and notes. Stale version updates are rejected. AI analysis does not silently decide dispatch or change queue priority.

## Architecture and source map

```text
Browser / Next.js frontend
  → same-origin /api/v1 gateway
  → FastAPI /v1 API
  → validation, organization access, request receipts, case lifecycle
  → PNG codec / retrieval / matching / conversation / background media jobs
  → SQLite demo or configured MongoDB storage
  → optional OpenAI and other explicitly configured integrations
```

| Area | Main files |
| --- | --- |
| Pages and user flows | frontend/app/[[...path]]/page.tsx |
| Styles | frontend/app/globals.css |
| Companion rendering | frontend/components/Companion.tsx, AvatarScene.tsx |
| Cover and privacy state | frontend/components/CoverSite.tsx, DiscreetSession.tsx |
| Voice and maps | frontend/components/VoiceInput.tsx, CaseMap.tsx |
| API and lifecycle | backend/api/main.py |
| PNG transport | backend/api/codec.py |
| AI adapters/instructions | backend/api/providers.py, openai_provider.py |
| Advisory analysis | backend/api/analysis.py |
| Legal retrieval | backend/api/legal.py, legal_atlas.py |
| Source registry | backend/fixtures/legal-registry.json |
| Description matching | backend/api/matching.py |
| Persistence and memory | backend/api/store.py, memory.py |
| Monitoring | backend/api/monitor.py, x_monitor.py |
| Media work | backend/api/jobs.py |
| Indexing and launcher | backend/scripts/ |
| Tests | backend/tests/ |
| Generated contracts | backend/packages/api-client/ |
| Design, setup, diagrams, demo assets | docs/ |

Frontend: Next.js 16, React 19, TypeScript, custom CSS, Lucide. Avatar: Three.js, React Three Fiber, drei, GLB model and morph targets. Backend: Python 3.13, FastAPI, Pydantic, Pillow, cryptography. Local tooling uses Node.js 22.

The backend enforces permissions even if a caller bypasses the frontend. The frontend gateway is not the authorization boundary.

## Steganography: exact technical explanation

**Simple answer:** “We encrypt the approved message, then hide those encrypted bytes in an ordinary PNG. The receiver verifies and decrypts the original image before accepting the request.”

Steganography hides the presence of data; encryption protects its contents. They are separate steps.

The codec:

1. Validates PNG input, an 8 MB upload limit, and a 4-million-pixel limit.
2. Encrypts payload bytes with AES-GCM and a fresh 12-byte nonce. The recipient organization is authenticated additional data.
3. Packs an `HV01` marker, four-byte body length, SHA-256 digest, nonce, and ciphertext/authentication tag.
4. Stores one frame bit in the least significant bit of each pixel's red channel. Other channels remain unchanged.
5. Checks capacity and saves a PNG.
6. Decodes the exported bytes and compares them with the original payload before returning success.

For this implementation, total frame capacity is floor(width × height / 8) bytes. Framing plus nonce/tag consumes 68 bytes, leaving approximately that capacity minus 68 for plaintext. This is a codec-level bound, not a promise that the form allows arbitrarily long messages.

SHA-256 detects frame corruption; authenticated encryption provides the security check. The backend can read/decrypt the payload: this is **not end-to-end encryption**. It has not undergone an independent security audit or steganalysis evaluation.

Resizing, cropping, screenshots, JPEG conversion, and social-platform recompression can destroy the message. Never promise hidden content will survive a social upload merely because the picture looks unchanged.

## Delivery, social sharing, and duplicate handling

The X button opens a compose intent with a neutral caption. It does not automatically attach/upload the encoded file or confirm a responder received it. The user downloads the verified PNG and attaches it themselves.

The controlled demo feed preserves original image bytes. Its scanner runs every 30 seconds, with a manual Scan now option. Intake verifies payload, organization, and linkage to an approved request. Repeated intake is idempotent and should not create duplicate cases.

A read-only X connector exists, but real account access and an encoded-image round trip still need verification. Instagram, Telegram, Slack monitoring and emergency dispatch are not demonstrated integrations. The connector is not a public-posting service. No real shelter or police partnership is established by the demo.

## Models and data flow

These are code/README configuration defaults, not proof that every current environment uses them:

| Task | Configured default |
| --- | --- |
| Text and structured replies | gpt-4.1-mini |
| Cover images | gpt-image-1.5 |
| Speech | gpt-4o-mini-tts, nova |
| Transcription | gpt-4o-mini-transcribe |
| Semantic embeddings | text-embedding-3-small, 768 dimensions for matching |

No custom foundation model was trained or fine-tuned. The team's work is the application, workflows, retrieval, transport, integration, controls, and testing.

Text features can send the supplied narrative or conversation context to the configured provider. Matching sends description/narrative text for embeddings. Speech/transcription use the configured provider. Image generation receives the separate cover prompt, not the hidden message by default. The user could still type sensitive information into that prompt. API keys remain server-side; do not claim zero external processing.

Default local storage is SQLite. MongoDB is an implemented live-mode adapter. Atlas Vector Search is optional and requires a configured cluster, index, compatible model/dimensions, and indexed documents/cases. Local OpenAI matching does not mean MongoDB Atlas ran.

Live mode includes Clerk identity verification and server-managed organization membership. Case payloads use encryption; searchable operational metadata is not all hidden. Production needs HTTPS, key management, retention/deletion operations, identity setup, and independent security review.

## How description matching works

**Judge answer:** “We took it a step further by comparing descriptions across reports. AI embeddings represent the text as numbers, allowing us to flag similar descriptions for a responder to investigate. A similar description does not prove it is the same person.”

The selected text is the optional reported-person description, falling back to the narrative if absent. OpenAI local mode embeds eligible reports, computes cosine similarity, ranks results, and applies count/threshold controls. It uses a bounded process-local embedding cache. No-key mode uses local hash vectors. Atlas mode performs organization/model-filtered vector retrieval.

The UI says **Description similarity** and **Search method: OpenAI embeddings** where applicable. Technically the comparison still uses cosine similarity. Atlas's score representation is converted back before applying the configured threshold.

A 76.9% similarity score is **not** a 76.9% chance of the same person, guilt, or a shared incident. Common traits such as tall, fair skin, and glasses are weak identifying evidence. Reporting bias, vague descriptions, and similar wording can produce false positives. There is no validated identity matching benchmark. Human review and independent evidence are necessary; do not automate accusations.

## Hallucinations and AI failure handling

**Short answer:** “We reduce unsupported answers by grounding legal responses in reviewed sources, preserving user-approved text, and keeping AI case classifications advisory. Those controls reduce risk but do not eliminate hallucinations.”

| Risk | Implemented control | Remaining limitation |
| --- | --- | --- |
| Draft invents abuse/injury/urgency | Instructions restrict rewriting to supplied facts; user can edit/approve | User review can miss errors |
| Legal answer invents law or URLs | Retrieve eligible summaries; instruct model to use passages only; canonical source links; abstain without support | Generated prose may still misinterpret a source |
| Retrieved content contains instructions | Treat passages as untrusted data | Prompt instructions alone are not a complete injection defense |
| Analysis overstates danger | Validated structured fields; advisory severity; preserve uncertainty; human review | No calibrated emergency-risk model |
| Maya invents memories/diagnoses | Provided context only; no diagnosis/treatment promises; explicit memory controls | Support text can still be wrong or unhelpful |
| Matching implies identity | Description-only labels, scoped candidates, human decisions | Common traits and model bias still affect results |
| Provider fails | Visible errors and applicable source-based/manual alternatives | No guarantee of uninterrupted service |

The legal pipeline filters jurisdiction, state scope, active/review status and relevance. Atlas results are checked against canonical source metadata to reject obsolete/withdrawn versions. Source links and hashes aid traceability; they do not prove each generated sentence is correct. Review expiry is not continuous legal monitoring.

Structured output/schema validation checks shape, not truth. Do not say “hallucination-free,” “100% accurate,” or “the model cannot lie.” No quantified hallucination reduction has been measured. We have implemented preventative controls; we have not documented a complete red-team evaluation.

## Actual problems encountered and how they were handled

These examples come from observed development work. Do not embellish them into measured research findings.

| Problem | What happened and response |
| --- | --- |
| New case seemed missing | Melissa's case was saved, but severity sorting plus six-row pagination buried it. Default sorting changed to newest-first; severity sorting remains available; confirmation links to the case. |
| Localhost refused connections | A stopped local process made the site unavailable. A detached supervisor now restarts exited services. It does not survive every failure or automatically solve laptop sleep/reboot. |
| Twitter sharing concealed the form | Ordinary tab hiding interrupted sharing. A short, explicit one-use handoff preserves the post for the immediate share switch. |
| Responder tab switching concealed the dashboard | Responder routes were exempted from ordinary visibility concealment. User-facing concealment remains. |
| Map loading was unclear | Embedded map loading/fallback controls were improved; maps now appear in the case view. Live rendering was not verified by the mocked browser test. |
| Case detail UI was difficult to scan | Added grouped summary cards, status colors, timeline/map layout, management controls, and ranked description comparison cards. |
| Companion layout was crowded | Replaced the floating full-screen controls with avatar/conversation columns and a clearer composer. |
| Speech voice did not meet the team's preference | Nova was configured and a generated greeting asset added. Browser playback restrictions still apply. |
| Intake confirmation initially failed | Earlier browser verification caught a missing verification-token field; the confirmation request was fixed. |
| Fresh CI data directory failed | Startup was changed to create nested data directories; a regression test covers it. |
| Low-contrast helper text | Accessibility checks caught text on the dark help button; the CSS was corrected and desktop/mobile checks passed. |
| Slow generated images in browser tests | Two broader image-generation journeys timed out waiting for images. Do not report the entire browser suite as passed. |
| Old screenshot remained visible | A new screenshot filename and README link were published to avoid the old image URL. |

## Test evidence and boundaries

Latest recorded checks during the folder reorganization:

- TypeScript and Ruff checks passed.
- Production Next.js build passed.
- All **49 backend tests** passed.
- Targeted desktop/mobile navigation, dashboard, and real-save/submit journeys passed.
- Public-page accessibility tests passed after the contrast fix.
- The broader browser run was interrupted after failures: generated-image timeouts, an outdated text assertion, and contrast. The assertion/contrast were fixed and targeted checks rerun. The two image-generation journeys were not established as passing afterward.
- Map behavior was checked with a mocked external map response.
- Tests of adapters and authorization do not establish a live Atlas, X, Clerk, or production deployment.

The submit regression test uses real local save/submit endpoints but stubs image generation for speed. Be explicit about that distinction if asked about end-to-end evidence.

No independent penetration test, clinical trial, full accessibility certification, public-service partnership, throughput benchmark, or real dispatch test is claimed. GitHub Actions status must be checked separately; local success does not imply CI success.

## Example judge responses

Use these as examples of confident, conversational explanations. Keep the factual limits when adapting them.

### What does HerVoice do?

“HerVoice brings asking for help, understanding your options, and reviewing support requests into one place. A user can prepare a discreet request, talk with Maya, or explore legal resources. Submitted requests then appear in the responder dashboard. We've connected those steps so someone can start with their own words and turn them into an organized request for support.”

### What makes HerVoice different?

“What makes HerVoice different is how the pieces work together. Someone can prepare an encrypted request inside an ordinary image, talk things through with Maya, and explore legal resources. On the responder side, that request becomes a case with contact preferences, a summary, and related-report search. We connect the first step of reaching out with the information a responder needs to review it.”

### Which tools power Maya's character, movement, and voice?

“We use OpenAI for Maya's replies, voice transcription, and speech with the Nova voice. The character is an existing rigged 3D model, which we display with Three.js and React Three Fiber. We animate its bones for gentle movement and use the playing audio to drive approximate mouth movement. Together, that gives users a conversation they can type or speak through, with a character that responds visually too.”

### If an abuser checks the phone, how does someone use HerVoice discreetly?

“HerVoice opens as an everyday-looking page about notes, music, or books. When someone leaves a private tab, the support tools disappear behind that cover again, and there's also a quick-exit control. This doesn't defeat device monitoring, but it does keep the support interface out of view during a quick glance. We built those controls so users can choose when the support tools are visible.”

### What happens if the image is compressed, cropped, or converted?

“Those changes can damage the hidden message, so we built verification into the process. We check that the message can be recovered from the original PNG, and intake only accepts it after validation. Users can submit directly or use the original file through our demo intake flow. That gives us a clear distinction between an image being created and a request actually being received.”

### How does the hidden image message work?

“We encrypt the approved message, then use steganography to store it through tiny changes in an ordinary PNG's pixels. Encryption protects the contents; steganography places them inside the image. Before returning the file, we decode it again to check that the message is intact. That gives the user an ordinary-looking image carrying the exact message they approved.”

### Who receives the hidden message, and how do they know to look?

“In our demo, the original image goes into a controlled feed that the scanner checks automatically, or a responder can scan it manually. The system verifies the request and adds it to the responder dashboard. Public X intake still needs live testing, so the controlled feed is what we're demonstrating. It shows the complete path from a hidden message to a case a responder can review.”

### Why use an image instead of an encrypted messaging app?

“Encrypted messaging protects what a conversation says, but the conversation can still be visible on the phone. We explored a different way to carry a request: encrypting it and placing it inside an ordinary-looking image. It doesn't replace a secure messaging app or defeat phone monitoring. It gives the user another way to prepare a request without displaying it as an obvious conversation.”

### How do you prevent harmful or incorrect AI advice?

“We give Maya clear instructions against diagnosis, blame, and pressuring someone to disclose. For legal questions, we provide reviewed source material for the model to explain and show links users can open themselves. If there's no relevant support in our sources, the bot says so. These checks don't eliminate AI mistakes, but they make the information easier to verify and keep important decisions with people.”

### What was a technical challenge you faced?

“One issue we caught was that a newly submitted request looked like it had disappeared. It was saved, but older cases appeared above it. We changed the dashboard to show the newest requests first and added a link directly to the submitted case. We then checked it on phones and computers, so users could find their request immediately after submitting.”

### How does the legal bot work?

“The legal bot starts with your question and looks for relevant material in our reviewed sources. OpenAI then helps explain that material in plain language, and the response includes links you can inspect. Our current coverage is national support guidance and selected Ohio resources. Within that scope, it gives someone a clearer starting point without requiring them to know legal terminology.”

### How did you use LangChain?

“We implemented the retrieval process directly in Python rather than using LangChain. Our code finds relevant passages, checks whether the sources fit the question, and sends that information to OpenAI for an explanation. That gives us direct control over the source checks and makes it easier to trace what information the legal bot used.”

### Where does MongoDB fit?

“We've written the MongoDB integration to store cases and support searches for related information. Atlas Vector Search can compare descriptions by meaning rather than requiring the same words. Our current demo uses a local database, and live MongoDB testing is still ahead. That lets us demonstrate the case workflow locally while keeping a separate database integration ready for testing.”

### How does reported-person matching work?

“We took it a step further by comparing descriptions across cases. OpenAI embeddings help us compare what the descriptions mean, even when they're worded differently. We show the closest descriptions for a responder to review; the score doesn't prove they're the same person. This gives responders a way to spot possible connections that deserve a closer look.”

### What do responders see?

“Responders see the person's message, requested support, contact preferences, and any location or situation details they chose to share. They can review an AI summary, assign the case, add notes, and update its status. They can also compare descriptions across reports. We bring that information into one workspace so they can understand a request and keep track of what happens next.”

### Does it contact real authorities?

“This demo sends requests to our practice responder dashboard, not real authorities. We built it that way so we could test receipt, review, and case updates without sending fictional reports to real services. A real deployment would need an agreement with the receiving organization. What we're showing now is the working request-to-dashboard process those operations would build on.”

### Is it private and secure?

“We protect image messages with encryption and restrict case access by organization. Users choose what they share, and the cover pages help keep support tools out of view. The server can still read submitted requests, and a monitored phone remains a risk. Within those limits, we've built controls around both access to the information and the user's choices about sharing it.”

### What did your team create?

“We built the application that connects these features: the user interface, encrypted image encoding and verification, request tracking, responder dashboard, and AI integrations. We used existing OpenAI models and a licensed character rather than training a model ourselves. Our contribution is making those pieces work together in a process that users and responders can actually walk through.”

### How would you scale it?

“We'd start by measuring which parts slow down as more people use the app. Image generation and other longer tasks would move into a separate job queue that can recover interrupted work. We'd then test database capacity and hosting under realistic traffic. That would give us evidence for how many requests we can support before expanding access.”

### What does it cost to run?

“The cost depends on which features people use, particularly image generation and voice. We haven't measured a representative cost per user yet. We'd track those features separately during a pilot and use that information to set sensible limits. That would let us make cost decisions based on how people actually use HerVoice.”

### What is next for the project?

“Our next step is to work with shelters and survivor advisors to understand what would help most in practice. We'd use that feedback to improve the experience, expand language support, and add reviewed local legal resources, alongside security and integration testing. That would help us turn the prototype into something shaped by the people who would use and operate it.”

## Statistics and presentation discipline

Do not reuse unsupported presentation claims such as “80% of abuse survivors have mental-health issues.” The team has discussed WHO statistics and a historical UK legal-awareness survey, but this file is not a new source verification. Before quoting a number, check the original source, population, geography, year, and exact definition. Do not present a UK survey as a global or U.S. statistic. Do not imply all partner violence is included in a statistic limited to physical/sexual violence.

Use fictional reports for demos, clearly marked synthetic. Melissa is a demo example, not evidence of a real beneficiary. “Culprit match” is informal team wording; prefer “reported-person description matching” when explaining it to judges.

## Reference priority

Use current code for exact behavior, the README for the overview, docs/authority-atlas.md for integration details, and actual test output for verification claims. Consult docs/companion.md and the model license files for avatar terms. Historical documentation may describe earlier behavior or test counts. Configuration determines the active providers; never expose credentials. Keep these references in the background unless the judge asks for evidence.
