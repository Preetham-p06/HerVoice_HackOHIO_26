"use client";
import { useEffect, useRef } from "react";
import Link from "next/link";
import {
  HeartHandshake,
  MessageCircle,
  Phone,
  ArrowUpRight,
  X,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";
/** Native dialog gives keyboard focus containment, Escape, and return focus. */
export default function HelpOptions() {
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const close = () => dialog.current?.close();
  useEffect(() => {
    const open = () => {
      if (!dialog.current?.open) dialog.current?.showModal();
    };
    const exit = () => dialog.current?.close();
    window.addEventListener("hervoice-open-help", open);
    window.addEventListener("hervoice-exit", exit);
    return () => {
      window.removeEventListener("hervoice-open-help", open);
      window.removeEventListener("hervoice-exit", exit);
    };
  }, []);
  return (
    <>
      <button
        ref={trigger}
        className="help-launcher"
        aria-haspopup="dialog"
        onClick={() => dialog.current?.showModal()}
      >
        <HeartHandshake size={24} />
        <span>
          Help options<small>Choose your next step</small>
        </span>
        <ArrowUpRight size={20} />
      </button>
      <dialog
        ref={dialog}
        className="help-dialog"
        aria-labelledby="help-dialog-title"
        aria-describedby="help-dialog-description"
        onClose={() => trigger.current?.focus()}
        onClick={(e) => {
          if (e.target === dialog.current) close();
        }}
      >
        <div className="dialog-heading">
          <span className="care-symbol">
            <HeartHandshake size={25} />
          </span>
          <button
            className="dialog-quick-exit"
            onClick={() => {
              window.speechSynthesis?.cancel();
              window.dispatchEvent(new Event("hervoice-exit"));
              window.dispatchEvent(new Event("hervoice-cover"));
            }}
          >
            Back to reading
          </button>
          <button
            className="close-dialog"
            aria-label="Close help options"
            onClick={close}
          >
            <X size={24} />
          </button>
        </div>
        <div className="eyebrow">YOU CAN START HERE</div>
        <h2 id="help-dialog-title">What would help right now?</h2>
        <p id="help-dialog-description">
          Choose what feels safe for you. Nothing calls, sends a message, or
          shares your location automatically.
        </p>
        <a className="dialog-option live-help" href="tel:18007997233">
          <Phone size={25} />
          <span>
            <strong>Call a real advocate</strong>
            <small>
              National Domestic Violence Hotline
              <br />
              800-799-7233 · U.S. · 24/7
            </small>
          </span>
          <ArrowUpRight size={22} />
        </a>
        <a
          className="dialog-option"
          href="https://www.thehotline.org/"
          target="_blank"
          rel="noreferrer"
          onClick={close}
        >
          <MessageCircle size={25} />
          <span>
            <strong>Chat with a real advocate</strong>
            <small>Opens The Hotline’s website in a new tab</small>
          </span>
          <ArrowUpRight size={22} />
        </a>
        <Link className="dialog-option" href="/studio" onClick={close}>
          <HeartHandshake size={25} />
          <span>
            <strong>Write a support request</strong>
            <small>
              {process.env.NEXT_PUBLIC_APP_MODE === "live"
                ? "Share only what feels comfortable."
                : "Practice form · no real assistance is sent"}
            </small>
          </span>
          <ArrowRight size={22} />
        </Link>
        <Link className="dialog-option" href="/collections" onClick={close}>
          <ShieldCheck size={25} />
          <span>
            <strong>Find U.S. resources</strong>
            <small>Local support, health information, and legal help</small>
          </span>
          <ArrowRight size={22} />
        </Link>
        <p className="emergency-note">
          <strong>Immediate danger or a medical emergency?</strong> Call{" "}
          <a href="tel:911">911</a> if it is safe to do so. HerVoice cannot
          dispatch help.
        </p>
        <p className="dialog-privacy">
          Calls and external websites can leave records on your device.{" "}
          <Link href="/about" onClick={close}>
            Privacy & safety
          </Link>
        </p>
      </dialog>
    </>
  );
}
