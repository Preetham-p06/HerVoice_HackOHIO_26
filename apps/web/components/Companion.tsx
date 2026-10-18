"use client";
import { useState } from "react";
import { ZoomIn, ZoomOut } from "lucide-react";

export default function Companion({
  speaking,
}: {
  speaking: boolean;
  mouthShape?: string;
}) {
  const [close, Close] = useState(false);
  return (
    <div
      className={
        "companion portrait-companion" + (speaking ? " is-speaking" : "")
      }
    >
      <div className="companion-name">
        <span className="eyebrow">YOUR AI COMPANION</span>
        <strong>Maya</strong>
        <small>A little room to be yourself.</small>
      </div>
      <div className="portrait-halo" />
      <img
        className={close ? "portrait close" : "portrait"}
        src="/images/companion-maya.png"
        alt="Maya, an original illustrated female AI companion in a blue shirt"
        width={1024}
        height={1536}
      />
      <button
        className="portrait-zoom"
        onClick={() => Close(!close)}
        aria-label={close ? "Zoom out companion" : "Zoom in companion"}
      >
        {close ? <ZoomOut size={20} /> : <ZoomIn size={20} />}
      </button>
      <div className="companion-caption" role="status">
        <span className="voice-bars" aria-hidden="true">
          <i />
          <i />
          <i />
          <i />
        </span>
        {speaking ? "Speaking" : "Ready when you are"}
      </div>
      <small className="portrait-note">
        Illustrated avatar · AI support, not a therapist
      </small>
    </div>
  );
}
