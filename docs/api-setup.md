# HerVoice API credentials

The entire synthetic demo, dashboard, avatar, original cover illustrations, browser speech, and PNG verification work without paid API keys. Maya is a bundled original GLB character with mouth/blink morph targets and Idle/Talking clips, loaded with useGLTF. No avatar API key is required. OpenAI audio drives mouth opening through a browser audio analyser; optional Rhubarb cues select timed visemes. The default is approximate audio-reactive animation, not phoneme-accurate lip sync. A still illustration remains available as a fallback.

## AI features — OpenAI

One server-only `OPENAI_API_KEY` powers all configured AI features. Create a project API key in the OpenAI API dashboard and fund that project's billing account. The app sends requests directly to `https://api.openai.com/v1` using that key. ChatGPT subscription billing does not configure this API project.

| Feature | Environment |
| --- | --- |
| Chat, rewriting, encouragement, legal synthesis | `TEXT_PROVIDER=openai`, `OPENAI_TEXT_MODEL=gpt-4.1-mini` |
| Generated image covers | `IMAGE_PROVIDER=openai`, `OPENAI_IMAGE_MODEL=gpt-image-1.5` |
| Voice input | `OPENAI_TRANSCRIBE_MODEL=gpt-4o-mini-transcribe` (optional override; uses the same OpenAI key) |
| Generated speech | `SPEECH_PROVIDER=openai`, `OPENAI_TTS_MODEL=gpt-4o-mini-tts`, `OPENAI_TTS_VOICE=coral` |
| Optional Atlas semantic vectors | `EMBEDDING_PROVIDER=openai`, `OPENAI_EMBEDDING_MODEL=text-embedding-3-small`; 768-dimensional index, `MATCH_PROVIDER=atlas` for live MongoDB, or `MATCH_PROVIDER=openai_local` for real embeddings with synthetic local storage |

Text requests use the Responses API with strict structured output and `store=false`. Only the cover prompt is sent to image generation. Images are generated at 1024×1024, low quality, three choices per job. Voice is opt-in and generated audio is labelled AI. A generation attempt consumes the configured OpenAI project's API usage. The app reports provider errors rather than falling back to fabricated results. Gemini, Bedrock and ElevenLabs adapters remain available for explicit legacy configuration, but are not used when these OpenAI selectors are set. Restart the API after editing its environment.

Official API references: [Responses](https://developers.openai.com/api/reference/resources/responses/methods/create), [image generation](https://developers.openai.com/api/reference/resources/images/methods/generate), [speech](https://developers.openai.com/api/reference/resources/audio/subresources/speech/methods/create).

## Full live deployment

| Service | Configuration |
| --- | --- |
| [Clerk](https://clerk.com/docs/js-frontend/getting-started/quickstart) | `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `CLERK_ISSUER`, `CLERK_AUDIENCE`. Create the participating organization and responder membership/role. Set matching `DEFAULT_ORG`. |
| [MongoDB Atlas](https://www.mongodb.com/docs/atlas/connect-to-database-deployment/) | `MONGODB_URI` with database credentials, `MONGODB_DATABASE`. Scope database access and network access to the API environment. |
| Local encryption | Generate independent random 32-byte base64 values for `DATA_ENCRYPTION_KEY` and each organization in `RECIPIENT_KEYS`. These are your own encryption keys, not purchased API keys. Keep stable and backed up. |
| Optional private AWS S3 media | `S3_PRIVATE_BUCKET` plus AWS role/profile permissions. Without it, job assets use configured local storage. |
| Optional semantic related reports | Existing OpenAI key plus `OPENAI_EMBEDDING_MODEL`, Atlas vector index `ATLAS_CASE_VECTOR_INDEX`, `MATCH_PROVIDER=atlas`; run documented indexing setup. Similarity does not verify identity. |
| Optional permitted feed connector | `SOCIAL_FEED_URL`, `SOCIAL_FEED_TOKEN`, `SOCIAL_FEED_ORG`. This is a separately provided approved feed, not social-network publishing. |

Set both `APP_MODE=live` and `NEXT_PUBLIC_APP_MODE=live`, the exact HTTPS `ALLOWED_ORIGINS`, organization settings, and the required encryption/auth/database environment before deployment. The web server needs its private `API_URL`. Case details include an interactive Google map, loaded only after selecting **Load Google map**, plus an external Maps link. The default Google Maps web embed needs no key. Optionally set `NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY` to a website-restricted key with Maps Embed API enabled to use the official Embed API. Only the reported location is included in the map query; it is sent to Google when the map is loaded. No social API keys are needed for the current manual file-sharing workflow. FFmpeg/Rhubarb are optional local executables, not API subscriptions.

Store secrets in the API process environment or deployment secret manager. The example file documents names only and is not loaded automatically by uvicorn. Never commit real credentials or put private keys in `NEXT_PUBLIC_*` variables. Only Clerk's publishable key is intended to be public.

Voice input starts only when **Speak your message** is selected. Stop the recording to transcribe it into an editable draft; choose **Send message** separately. **Listen to reply** generates and plays the AI response, with native audio controls and a **Stop voice** control. Microphone permission requires localhost or HTTPS; typing remains available if permission is denied.
