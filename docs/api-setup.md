# HerVoice API credentials

The entire synthetic demo, dashboard, avatar, original cover illustrations, browser speech, and PNG verification work without paid API keys. Maya is a bundled original illustration, not a hosted avatar service; no avatar API key is required. It has a voice status indicator and zoom, not a rigged face or lip sync.

## AI features

| Feature | Obtain | Server environment |
| --- | --- | --- |
| Real chat, draft rewriting, encouragement, legal synthesis | [Google AI Studio](https://ai.google.dev/gemini-api/docs/api-key) | `TEXT_PROVIDER=gemini`, `GEMINI_API_KEY`, `GEMINI_MODEL` (supported generateContent model) |
| AI generated post images | [Amazon Bedrock / Nova Canvas](https://docs.aws.amazon.com/nova/latest/userguide/getting-started-api.html) | `AWS_REGION`, `AWS_PROFILE` locally or an AWS execution role, `BEDROCK_IMAGE_MODEL` for an available Nova Canvas model in that region |
| Natural generated speech | [ElevenLabs API keys](https://elevenlabs.io/docs/overview/administration/workspaces/api-keys) and [voice library](https://elevenlabs.io/app/voice-library) | `ELEVENLABS_API_KEY`, `ELEVENLABS_VOICE_ID`, `ELEVENLABS_MODEL` |

Bedrock uses the standard AWS SDK credential chain, not a generic Bedrock key field in this project. A deployed IAM role is preferred. Local access-key credentials, if used, belong in the AWS credentials profile rather than source code. The image adapter uses the real provider only in `APP_MODE=live`; demo mode intentionally produces local illustrations. Gemini can be enabled independently in a local demo with synthetic input. Restart the API after configuring its environment. Choose currently available model identifiers from the provider console; placeholders in `.env.example` must be replaced.

## Full live deployment

| Service | Configuration |
| --- | --- |
| [Clerk](https://clerk.com/docs/js-frontend/getting-started/quickstart) | `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `CLERK_ISSUER`, `CLERK_AUDIENCE`. Create the participating organization and responder membership/role. Set matching `DEFAULT_ORG`. |
| [MongoDB Atlas](https://www.mongodb.com/docs/atlas/connect-to-database-deployment/) | `MONGODB_URI` with database credentials, `MONGODB_DATABASE`. Scope database access and network access to the API environment. |
| Local encryption | Generate independent random 32-byte base64 values for `DATA_ENCRYPTION_KEY` and each organization in `RECIPIENT_KEYS`. These are your own encryption keys, not purchased API keys. Keep stable and backed up. |
| Optional private AWS S3 media | `S3_PRIVATE_BUCKET` plus AWS role/profile permissions. Without it, job assets use configured local storage. |
| Optional semantic related reports | Existing Gemini key plus `GEMINI_EMBEDDING_MODEL`, Atlas vector index `ATLAS_CASE_VECTOR_INDEX`, `MATCH_PROVIDER=atlas`; run documented indexing setup. Similarity does not verify identity. |
| Optional permitted feed connector | `SOCIAL_FEED_URL`, `SOCIAL_FEED_TOKEN`, `SOCIAL_FEED_ORG`. This is a separately provided approved feed, not social-network publishing. |

Set both `APP_MODE=live` and `NEXT_PUBLIC_APP_MODE=live`, the exact HTTPS `ALLOWED_ORIGINS`, organization settings, and the required encryption/auth/database environment before deployment. The web server needs its private `API_URL`. No map API key is needed: map links open Google Maps only after a click; there is no automatic external map load. No social API keys are needed for the current manual file-sharing workflow. FFmpeg/Rhubarb are optional local executables, not API subscriptions.

Store secrets in the API process environment or deployment secret manager. The example file documents names only and is not loaded automatically by uvicorn. Never commit real credentials or put private keys in `NEXT_PUBLIC_*` variables. Only Clerk's publishable key is intended to be public.
