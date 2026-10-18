# Verification — 18 October 2026

## Executed

- Installed dependencies with npm lockfile and a pinned Python requirements lock. `npm install` reported zero known vulnerabilities at installation.
- Ran strict TypeScript checking and a Next.js production build successfully (repeated after the gateway and intake changes).
- Ran Python lint (Ruff F rules) and 15 backend tests successfully. Tests cover exact Unicode/emoji narrative preservation, guest isolation, organization isolation, unauthenticated access, duplicate request/intake, contact validation, real case events, stale versions, deletion, related-search self exclusion, PNG UTF-8/alpha/capacity/overflow/corruption/wrong key/wrong org/JPEG rejection, origin checks, expiry/signature/membership verification with generated RSA JWTs, encrypted live payload packing, legal retrieval filters and scoped generated-cover jobs.
- Generated TypeScript input contracts and the OpenAPI snapshot directly from FastAPI.
- Ran native Next.js and FastAPI services on localhost and verified health/gateway responses.

## Actual browser exercise

Used the in-app browser against the locally running application, not just source inspection:

1. Viewed home and the request form; heading focus followed wizard steps.
2. Entered a synthetic request with Hindi and emoji; selected no contact and typed a manual city.
3. Edited the approved message independently from the original and selected image preparation.
4. Submitted, saw the real saved receipt with prepared-only status, and verified the exact approved text.
5. Downloaded the original verified `landscape.png` through the visible download control.
6. Opened an organization-A server-established responder demo session; inspected actual queue counts, filters, pagination and freshness.
7. Uploaded that exact downloaded PNG in responder intake; the visible decoded preview preserved the Hindi and emoji.
8. Confirmed intake and saw the original case become received with an actual intake event. The browser check caught a missing verification-token field in the frontend confirmation request; it was fixed and the confirmation then succeeded.
9. Added a private synthetic case note and saw the actual stored event in the case activity history.
10. Inspected the request form at 375px and confirmed `scrollWidth == innerWidth == 375`. Header ordering was refined after visual inspection.
11. Submitted a legal question on mobile and saw retrieved government-source passages with page/section citations.
12. Sent a support conversation starter, received the labeled demo response, and enabled the lazy 3D companion. No voice started automatically.

Home axe audit used WCAG 2 A/AA and WCAG 2.1 AA tags through the explicit development-only `#audit` panel. Initial color-contrast failures were repaired; the repeated home audit returned `[]`. This is one automated screen audit, not complete WCAG 2.2 AA verification. Playwright CI supplies broader viewport and accessibility regression coverage.

## Performance boundaries

Production build compiles successfully without external font downloads. The avatar and audit tools are dynamic imports; the image generator is a background enhancement and does not block direct requests. Case results are paginated six per page and poll every 30 seconds. PNG covers are 640×480; uploads are limited to 8 MB and 4 million pixels. Providers and media subprocesses have explicit timeouts; job execution is limited to two concurrent threads.

No Lighthouse score, clinical outcome, emergency response time or production throughput is claimed. Browser timings include development compilation/file-dialog delays and are not representative performance benchmarks. No statistically meaningful production latency measurements were performed.

## Supplied but not fully exercised

- Desktop/mobile Playwright specs and CI workflow are committed. The standalone Playwright runner was not run locally; the core journey was exercised through the in-app browser. CI results are independent evidence and must not be assumed passed until GitHub reports them.
- `docker compose config -q` passed. Docker image/runtime execution was not possible because the local Docker daemon is not running; native services were tested.
- Live MongoDB, Clerk, Gemini, Bedrock, S3, ElevenLabs and Rhubarb paths were not called with live service credentials. Signature/membership/encryption logic has deterministic local tests, which do not replace live smoke tests.
- Legal PDF ingestion uses a real parser. Downloaded government copies were scanned; selected source passages were visually transcribed and reviewed against rendered pages. Current law/case-law completeness is not verified.
- Full 320px, tablet, keyboard-only, reduced-motion, WebGL-failure, screen-reader and all-screen contrast checks remain broader manual QA work. No complete accessibility conformance claim is made.

## U.S.-first care-interface update

The initial GitHub run failed before browser tests because `.data/e2e` had no parent directory. Startup now uses `mkdir(parents=True)` and a subprocess regression test verifies a fresh nested data directory. GitHub Actions use Node-24-compatible action versions and a pinned Ubuntu 24.04 runner to avoid the announced runner migration.

Backend checks now total 17 tests, including U.S. defaults, explicit state scoping, unsupported-country abstention, and clean CI startup. The active corpus replaces the original India paragraphs with reviewed summaries of U.S. DOJ/HHS and Ohio Supreme Court sources. Playwright regression coverage now includes the help dialog, Escape/focus return, draft preservation, national defaults, and Ohio retrieval. Initial local typecheck, lint, backend tests and production build pass; the updated CI run is tracked on GitHub.

The redesigned home returned zero axe violations for the audited WCAG tags. At 375px, the browser reported `scrollWidth == innerWidth == 375`; primary help buttons and the fixed launcher remained visible. The help dialog was opened and dismissed with Escape; focus returned to the launcher and the exact draft text remained. The Ohio selector returned the official Ohio court source in the browser. New home and mobile help-panel screenshots are stored in `docs/screenshots`.
