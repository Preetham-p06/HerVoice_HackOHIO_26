# Maya: survivor-focused AI companionship

The support prompt emphasizes autonomy, no blame, no pressure to disclose or confront, and optional small grounding steps. It is configured for this use case; it is **not clinically fine-tuned, a validated treatment, or a licensed therapist**. The design follows safety, transparency and choice principles described by [SAMHSA](https://www.samhsa.gov/mental-health/trauma-violence/trauma-informed-approaches-programs). Conversation history is context, not a clinical assessment or reliable inference of emotional state.

## Character and speech

`node scripts/build_companion.mjs` regenerates the original stylized `apps/web/public/models/maya.glb`. It includes actual mouth/blink morph targets and Idle/Talking quaternion clips; no reference-project character assets were copied. React Three Fiber, drei useGLTF/useAnimations and Three.js render the locally bundled asset. Pause animation, zoom, still illustration and text-only controls remain optional. Reduced motion pauses idle motion by default; unsupported 3D falls back without blocking chat.

OpenAI generates the text and opt-in AI voice. Listen to reply speaks one reply. Speak replies is off by default and can be enabled for subsequent responses. The voice is clearly labelled AI-generated, following [OpenAI's speech guidance](https://developers.openai.com/api/docs/guides/text-to-speech). Audio is served from private same-origin job URLs. The audio clock drives optional Rhubarb visemes; a browser analyser drives approximate amplitude-based mouth movement when timed cues are unavailable. No camera or facial/emotion recognition is used. Browser device speech does not provide aligned phonemes. Facial neutral/gentle cues describe the AI response presentation, not a diagnosis of the user's emotions.

## Memory

Without consent, conversation text stays in the current page and is sent as context for that conversation. With explicit consent, the existing private-cookie-bound encrypted memory expires after 24 hours and is capped at 20 messages. Live mode uses the configured MongoDB store; local demo mode uses SQLite. Turning memory off deletes it. Clear conversation waits for confirmed deletion when memory is enabled and preserves the memory-on indication on failure. No responder can browse the support conversation.

## Verification

Use synthetic messages to check text, voice, mouth movement during playback, pause/resume, still-image fallback, text-only mode, and memory consent/deletion. Test microphone denial and device/browser fallbacks. This prototype does not guarantee continuous availability, privacy on a monitored device, clinical efficacy, or emergency intervention.
