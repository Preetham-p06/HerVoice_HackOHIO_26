"use client";
import { useEffect, useRef, useState } from "react";
import { Mic, Square, X } from "lucide-react";

export default function VoiceInput({
  onText,
  onError,
}: {
  onText: (text: string) => void;
  onError: (message: string) => void;
}) {
  const [available, Available] = useState(false);
  const [recording, Recording] = useState(false);
  const [busy, Busy] = useState(false);
  const recorder = useRef<MediaRecorder | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const operation = useRef(0);
  const abort = useRef<AbortController | null>(null);
  function release() {
    stream.current?.getTracks().forEach((t) => t.stop());
    stream.current = null;
    if (timer.current) clearTimeout(timer.current);
  }
  function cancel() {
    operation.current++;
    abort.current?.abort();
    if (recorder.current?.state === "recording") recorder.current.stop();
    release();
    Recording(false);
    Busy(false);
  }
  useEffect(() => {
    Available(
      !!navigator.mediaDevices?.getUserMedia &&
        typeof MediaRecorder !== "undefined",
    );
    window.addEventListener("hervoice-exit", cancel);
    window.addEventListener("hervoice-reset", cancel);
    return () => {
      cancel();
      window.removeEventListener("hervoice-exit", cancel);
      window.removeEventListener("hervoice-reset", cancel);
    };
  }, []);
  async function start() {
    const g = ++operation.current;
    onError("");
    try {
      Busy(true);
      const media = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (g !== operation.current) {
        media.getTracks().forEach((t) => t.stop());
        return;
      }
      stream.current = media;
      const mime = ["audio/webm", "audio/mp4", "audio/ogg"].find((t) =>
        MediaRecorder.isTypeSupported(t),
      );
      const rec = new MediaRecorder(
        media,
        mime ? { mimeType: mime } : undefined,
      );
      recorder.current = rec;
      const chunks: Blob[] = [];
      rec.ondataavailable = (e) => {
        if (e.data.size) chunks.push(e.data);
      };
      rec.onstop = async () => {
        if (g !== operation.current) {
          media.getTracks().forEach((t) => t.stop());
          return;
        }
        release();
        Recording(false);
        Busy(true);
        try {
          const clip = new Blob(chunks, { type: rec.mimeType });
          if (!clip.size || clip.size > 8 * 1024 * 1024)
            throw Error(
              "Recording is empty or too large. Please try a shorter message.",
            );
          await fetch("/api/v1/support/session", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: "{}",
          }).then((r) => {
            if (!r.ok)
              throw Error("Unable to start voice input. You can type instead.");
          });
          if (g !== operation.current) return;
          const body = new FormData();
          body.append(
            "file",
            clip,
            "voice-note." +
              (rec.mimeType.includes("mp4")
                ? "mp4"
                : rec.mimeType.includes("ogg")
                  ? "ogg"
                  : "webm"),
          );
          const controller = new AbortController();
          abort.current = controller;
          const response = await fetch("/api/v1/support/transcribe", {
            method: "POST",
            body,
            signal: controller.signal,
          });
          const data = await response.json();
          if (!response.ok)
            throw Error(
              data.message ||
                data.detail ||
                "Voice input is unavailable. Please type instead.",
            );
          if (g === operation.current) onText(data.text);
        } catch (e) {
          if (g === operation.current && (e as Error).name !== "AbortError")
            onError((e as Error).message);
        } finally {
          if (g === operation.current) Busy(false);
        }
      };
      rec.onerror = () => {
        cancel();
        onError("Recording stopped unexpectedly. Please type or try again.");
      };
      rec.start();
      Recording(true);
      Busy(false);
      timer.current = setTimeout(() => {
        if (rec.state === "recording") rec.stop();
      }, 60000);
    } catch (e) {
      release();
      if (g === operation.current) {
        Busy(false);
        onError(
          (e as Error).name === "NotAllowedError"
            ? "Microphone permission wasn’t granted. You can still type your message."
            : "Microphone is unavailable. You can still type your message.",
        );
      }
    }
  }
  return (
    <div className="voice-input">
      <div className="actions">
        <button
          type="button"
          className={"btn secondary" + (recording ? " recording" : "")}
          disabled={!available || busy}
          onClick={() => (recording ? recorder.current?.stop() : void start())}
        >
          {recording ? <Square size={16} /> : <Mic size={16} />}{" "}
          {recording
            ? "Stop recording"
            : busy
              ? "Transcribing…"
              : "Speak your message"}
        </button>
        {(recording || busy) && (
          <button type="button" className="btn secondary" onClick={cancel}>
            <X size={16} /> Cancel recording
          </button>
        )}
      </div>
      <small role="status">
        {!available
          ? "Voice input is unavailable in this browser. Typing and listening still work."
          : recording
            ? "Recording · up to 60 seconds. Stop to transcribe, or cancel to discard."
            : busy
              ? "Transcribing your voice note…"
              : "Optional: your recording is sent to OpenAI for transcription. Review the words, then choose Send."}
      </small>
    </div>
  );
}
