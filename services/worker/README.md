# Media and enhancement processing

`services/api/jobs.py` runs a bounded two-thread executor with durable job metadata (SQLite demo; MongoDB live). This keeps local setup to two services. Jobs have random IDs, owner scope, expiry, progress, sanitized failure, cancellation and one attempt. No automatic retries incur provider charges. Running jobs become unavailable if the process stops; they are not resumed automatically. A production queue service is a documented remaining operational task.

Media processing uses unique temporary directories, `ffmpeg` discovered on PATH, and optional `RHUBARB_PATH`. Both subprocesses have 30-second timeouts, captured output, no shell interpolation and temporary-directory cleanup. Text is available independently of audio. ElevenLabs requires its own key, voice and model; it does not require an unrelated provider key.

Demo uses explicit opt-in browser speech and an original code-generated R3F companion. Browser speech uses playback-state mouth animation. The visible studio voice player consumes scoped ElevenLabs audio and timed Rhubarb mouth cues when configured, with a playback-state fallback when cues are unavailable. Live provider credentials are still required for integration verification.

Live result storage requires a private S3 bucket and SSE; demo uses `.data/jobs`. Configure an S3 `jobs/` lifecycle rule to expire all objects after one day. API job reads expire after one hour. Never expose the local data directory or S3 bucket publicly.
