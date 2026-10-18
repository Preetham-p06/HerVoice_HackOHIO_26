# HerVoice

A U.S.-first support platform behind **Everyday Notes**, a neutral reading website. The public page, tab title, and navigation paths look like an everyday editorial site. The six highlighted words read **Click the button below for help**. Press the prominent **Open personal space** button to enter HerVoice directly. The header’s Personal space dialog remains an alternative. Returning to reading, switching tabs, pressing Escape twice, or reloading covers the tools and clears unsaved page state. This does not hide browser/network history, downloaded files, a recognizable deployment domain, or device monitoring.

HerVoice provides support workflows with a complete local **synthetic demo**: guest request → saved receipt → encrypted PNG → authorized intake → responder case updates. Includes text support chat, opt-in voice and an original illustrated companion, source-backed U.S. support and legal-resource summaries, resource browsing, and organization-scoped case work.

**Use synthetic information only.** This is development software, not an emergency service or a monitored assistance channel. The demo sends no real reports or messages. Live adapters are included but have not been exercised with live credentials. See [feature parity and remaining work](docs/feature-parity.md).

## Start locally

Requires Node 22 and Python 3.13. From the repository root:

```bash
./scripts/dev.sh
```

The first run installs dependencies. Open [Everyday Notes](http://localhost:3000). The API’s interactive contract is at [FastAPI docs](http://localhost:8000/docs). Stop both services with Ctrl+C. No account, paid provider, MongoDB instance or AWS account is required for the demo.

Alternative container setup:

```bash
docker compose up --build
```

Compose binds both exposed ports to localhost and persists demo data in a named volume. Container configuration is supplied but was not executed during development; native startup was exercised. Do not publish the demo authentication endpoint to the internet.

## Five-minute coworker walkthrough

1. Press **Open personal space**, then **Create a post**, write a short synthetic note, leave contact as **Do not contact me**, and optionally type a city. Review and edit the exact message.
2. Choose **Prepare a discreet PNG**, submit, and download the verified PNG. The receipt says **Prepared**, not delivered. Three built-in covers, uploaded PNGs and optional three-cover preparation work.
3. Open **Responder portal**. Select practice organization A and open its server-established demo session. Organization B has a separate queue and cannot decode A’s PNGs.
4. Open **Signals & image intake**, upload the original PNG, verify the message, and confirm intake. The original request is linked once; repeated intake does not duplicate it.
5. Change status, assignment or notes. Activity comes from stored events. Closing requires a reason; stale updates are rejected.
6. Explore support chat, opt-in voice and the original illustrated companion. Nothing starts playing automatically. **Know your rights** defaults to United States; try “protection order forms” and optionally choose Ohio. Unsupported questions and jurisdictions abstain.

The initial dataset contains 16 synthetic cases across two organizations. No source-repository personal data, avatars, secrets or history were copied.

## Structure

| Path | Responsibility |
| --- | --- |
| `apps/web` | Next.js 16, React 19, strict TypeScript, responsive UI, same-origin gateway |
| `services/api` | FastAPI validation, authorization, cases, codec, providers, source retrieval and enhancement jobs |
| `services/worker` | Portable media-worker contract and operational limits |
| `packages/api-client` | Generated OpenAPI snapshot and TypeScript input models |
| `fixtures` | Reviewed source registry, no private records |
| `tests` | Backend trust-boundary tests and Playwright journeys |

## Checks

```bash
npm run typecheck
npm run lint
npm test
npm run contracts
npm run build
# With browsers installed:
npx playwright install chromium
npm run test:e2e
```

CI repeats lint, typecheck, backend tests, generated-contract drift, production build and desktop/mobile Playwright checks. Browser journeys and axe checks also ran through the local in-app browser; see [verification](docs/verification.md) for the exact boundaries.

## Configuration and live adapters

Copy `.env.example` to `.env` for native development. `scripts/dev.py` loads it for both services. Standalone `next dev` needs the web variables in its environment or `apps/web/.env.local`; never put server secrets in `NEXT_PUBLIC_*` variables.

The default is `APP_MODE=demo`. Setting `APP_MODE=live` requires MongoDB, separate 32-byte base64 data/recipient encryption keys, a trusted Clerk issuer/audience, explicit origins and a default organization. Startup fails if required settings are absent. Demo sign-in is rejected in live mode. The frontend must also use `NEXT_PUBLIC_APP_MODE=live` and configured Clerk keys; rebuild after public-variable changes.

MongoDB stores case payloads encrypted with AES-GCM. Clerk tokens are signature/issuer/audience/expiry verified, then checked against active server-managed memberships. A trusted operator can establish memberships with `scripts/add_membership.py`; public signup cannot do so. Configure the Clerk session token’s `aud` to match `CLERK_AUDIENCE` and select an organization before using the workspace.

OpenAI can power text, image generation, speech and optional embeddings with one server-only API key. Legacy Gemini, Nova Canvas/Bedrock and ElevenLabs adapters remain available by explicit configuration; S3 storage is optional. See [API setup](docs/api-setup.md). No historical model ID is assumed. Provider failures are surfaced; live requests never fall back to synthetic submissions. Missing optional writing assistance does not block manual submission. Follow [live configuration and limitations](docs/architecture.md) before using real information.

## Data controls

Drafts and conversation history stay in page memory. Guest receipt secrets are high entropy, stored only as hashes server-side, and sent through HttpOnly same-site cookies. Request IDs alone grant no access. Requests can be deleted from their private receipt page; downloaded PNGs and external backups are outside that deletion scope. PNG encryption is **server-readable**, not end-to-end encryption. JPEG conversion, screenshots, resizing and social platform processing can destroy the hidden message.

To reset only local demo data, stop the API first:

```bash
.venv/bin/python scripts/reset_demo.py --target local-demo --confirm
```

This also changes the demo encryption key; old downloads will no longer decode. It cannot target a live MongoDB database.

## Project documentation

- [Source audit](docs/source-audit.md)
- [Architecture and deployment limits](docs/architecture.md)
- [Design system](docs/design-system.md)
- [Feature parity and remaining work](docs/feature-parity.md)
- [Verification](docs/verification.md)

The care-service interface uses high-contrast help buttons, a persistent Quick exit, and a user-opened **Help options** dialog with real national advocate links. It does not imply that HerVoice is a hospital or provides medical care. The active source set covers U.S. national support and selected Ohio court resources; state-specific advice is never inferred for other states.

The application is named **HerVoice**. The repository retains the user-provided GitHub name **HerWay**.


The main demo navigation is **Home · Create a post · Law bot · Therapy bot · Dashboard**. The dashboard opens the server-established synthetic organization workspace automatically in demo mode and polls case changes every five seconds. Live mode still requires verified responder authorization. Therapy bot starts with the original illustrated companion visible, without automatically playing speech; Text only remains available.

For the screenshot-matched workflow and a complete judge demonstration, see [reference parity audit](docs/screenshot-parity-audit.md).
