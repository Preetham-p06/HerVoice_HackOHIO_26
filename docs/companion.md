# Maya: survivor-focused AI companionship

The support prompt emphasizes autonomy, no blame, no pressure to disclose or confront, and optional small grounding steps. It is configured for this use case; it is **not clinically fine-tuned, a validated treatment, or a licensed therapist**. The design follows safety, transparency and choice principles described by [SAMHSA](https://www.samhsa.gov/mental-health/trauma-violence/trauma-informed-approaches-programs). Conversation history is context, not a clinical assessment or reliable inference of emotional state.

## Character and speech

The primary character is `apps/web/public/models/maya-studio.glb`, a rigged, textured Ready Player Me example avatar obtained from met4citizen/TalkingHead. Its **CC BY-NC 4.0** asset license permits non-commercial sharing/adaptation with attribution. Source, asset-specific licensing evidence, change notice and SHA-256 are recorded in the adjacent `maya-studio.LICENSE.txt`, also linked from the studio. The GLB file is distributed unchanged; runtime configuration hides glasses and uses plain blue clothing materials. Obtain commercial rights or replace this character before commercial use. The old procedural character has been removed.

The studio uses one large peach/lavender avatar stage, a floating message/microphone dock, an optional conversation panel, and collapsed conversation settings. Expand companion opens an accessible presentation dialog after a deliberate click, with keyboard focus containment. Exit expanded view or Escape returns to normal view. Back to reading remains available inside the expanded view as well as normal navigation. History and voice controls remain keyboard accessible.

React Three Fiber, drei useGLTF, Three.js SkeletonUtils cloning and per-frame bone/morph animation render the locally bundled asset. The character supports jaw/viseme movement, paired eyelid blinking, subtle brow/smile cues and restrained head/spine motion. Pause animation, zoom, original still illustration and text-only controls remain optional. Reduced motion pauses idle motion by default; unsupported 3D falls back without blocking chat.

OpenAI generates the text and opt-in AI voice. Listen to reply speaks one reply. Speak replies is off by default and can be enabled for subsequent responses. The voice is clearly labelled AI-generated, following [OpenAI's speech guidance](https://developers.openai.com/api/docs/guides/text-to-speech). Audio is served from private same-origin job URLs. The audio clock drives optional Rhubarb visemes; a browser analyser drives approximate amplitude-based mouth movement when timed cues are unavailable. No camera or facial/emotion recognition is used. Browser device speech does not provide aligned phonemes. Facial neutral/gentle cues describe the AI response presentation, not a diagnosis of the user's emotions.

## Memory

Without consent, conversation text stays in the current page and is sent as context for that conversation. With explicit consent, the existing private-cookie-bound encrypted memory expires after 24 hours and is capped at 20 messages. Live mode uses the configured MongoDB store; local demo mode uses SQLite. Turning memory off deletes it. Clear conversation waits for confirmed deletion when memory is enabled and preserves the memory-on indication on failure. A conditional encrypted-record token prevents an in-flight reply from restoring deleted or replaced memory. No responder can browse the support conversation.

## Verification

Use synthetic messages to check text, voice, mouth movement during playback, pause/resume, still-image fallback, text-only mode, and memory consent/deletion. Test microphone denial and device/browser fallbacks. This prototype does not guarantee continuous availability, privacy on a monitored device, clinical efficacy, or emergency intervention.

Maya uses the OpenAI `nova` voice by default, with calm feminine delivery instructions. The browser speech option selects a known feminine English device voice, or directs the user to AI speech if none is available. The rig uses relaxed shoulder/arm positioning and a modest resting smile.
