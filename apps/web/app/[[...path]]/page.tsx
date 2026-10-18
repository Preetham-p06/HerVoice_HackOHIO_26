"use client";
import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import HelpOptions from "../../components/HelpOptions";
import { US_REGIONS } from "../../components/us-regions";
const DevAudit = dynamic(() => import("../../components/DevAudit"), {
  ssr: false,
});
import { SignIn as ClerkSignIn, OrganizationSwitcher } from "@clerk/nextjs";
const DEMO = process.env.NEXT_PUBLIC_APP_MODE !== "live";
import {
  Phone,
  ArrowUpRight,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  HeartHandshake,
  MessageCircle,
  BookOpen,
  Leaf,
  LockKeyhole,
  LogOut,
  Check,
  Download,
  Upload,
  Search,
  LayoutDashboard,
  FolderOpen,
  Settings,
  Plus,
  Volume2,
  VolumeX,
  RefreshCw,
  X,
} from "lucide-react";
const Companion = dynamic(() => import("../../components/Companion"), {
  ssr: false,
  loading: () => <p>Loading optional companion…</p>,
});
type Case = {
  urgent: boolean;
  id: string;
  alias: string;
  category: string;
  status: string;
  priority: string;
  created: string;
  narrative: string;
  original: string;
  contact: {
    method: string;
    value: string;
    safeTime: string;
    voicemail: boolean;
  };
  location: string;
  version: number;
  assignment: string;
  delivery: string;
  events: {
    id: string;
    type: string;
    note: string;
    time: string;
    actor: string;
  }[];
};
async function api(path: string, body?: unknown, method?: string) {
  const r = await fetch("/api/v1" + path, {
    method: method || (body ? "POST" : "GET"),
    headers: body ? { "Content-Type": "application/json" } : {},
    body: body ? JSON.stringify(body) : undefined,
  });
  const d = await r.json();
  if (!r.ok)
    throw Error(
      typeof d.message === "string"
        ? d.message
        : typeof d.detail === "string"
          ? d.detail
          : "Please check your fields and try again.",
    );
  return d;
}
function Button({
  children,
  onClick,
  secondary = false,
  disabled = false,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  secondary?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      className={secondary ? "btn secondary" : "btn"}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}
function Badge({ children }: { children: React.ReactNode }) {
  return <span className="badge">{children}</span>;
}
function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
      {hint && <small>{hint}</small>}
    </label>
  );
}
function date(s: string) {
  return new Date(s).toLocaleString();
}
const nav = [
  ["/help", "Get help"],
  ["/support", "Support chat"],
  ["/rights", "Know your rights"],
  ["/resources", "Resources"],
];
export default function App() {
  const path = usePathname();
  const staff = path.startsWith("/responder");
  const [error, setError] = useState("");
  useEffect(() => {
    setError("");
  }, [path]);
  function exit() {
    window.speechSynthesis?.cancel();
    window.dispatchEvent(new Event("hervoice-exit"));
    window.location.replace("https://www.weather.gov/");
  }
  return (
    <>
      {process.env.NODE_ENV === "development" && <DevAudit />}
      <a className="skip" href="#main">
        Skip to content
      </a>
      <div className="safetybar">
        <span>
          <LockKeyhole size={12} /> A space for you. Share only what feels
          right.
        </span>
        <button onClick={exit}>
          Quick exit <LogOut size={13} />
        </button>
      </div>
      <header>
        <Link className="brand" href="/">
          <span className="brandmark">
            <HeartHandshake size={25} />
          </span>
          HerVoice<span className="branddot">.</span>
        </Link>
        <nav aria-label="Main navigation">
          {nav.map(([href, label]) => (
            <Link
              className={path === href ? "active" : ""}
              key={href}
              href={href}
            >
              {label}
            </Link>
          ))}
        </nav>
        {!staff && (
          <button
            className="header-help"
            onClick={() =>
              window.dispatchEvent(new Event("hervoice-open-help"))
            }
          >
            Get help now <ArrowUpRight size={17} />
          </button>
        )}
        <Link className="portal" href="/sign-in">
          Responder portal <ArrowUpRight size={15} />
        </Link>
      </header>
      <div className="demo">
        <span className="dot" />{" "}
        {DEMO ? "DEMONSTRATION" : "PRIVATE SUPPORT SPACE"}{" "}
        <span>
          {DEMO
            ? "Demo: support requests and case data are synthetic. National hotline and resource links connect to real external services."
            : "Requests are saved to your selected organization. This service does not provide emergency dispatch."}
        </span>
      </div>
      {error && (
        <div role="alert" className="error">
          {error}
        </div>
      )}
      {staff ? (
        <Staff path={path} />
      ) : (
        <main id="main">
          {path === "/" ? (
            <Home />
          ) : path === "/help" ? (
            <Help />
          ) : path === "/help/complete" ? (
            <Requests complete />
          ) : path === "/requests" ? (
            <Requests />
          ) : path.startsWith("/requests/") ? (
            <Requests id={path.split("/")[2]} />
          ) : path === "/support" ? (
            <Chat />
          ) : path === "/rights" ? (
            <Rights />
          ) : path === "/resources" ? (
            <Resources />
          ) : path === "/privacy-safety" ? (
            <Privacy />
          ) : path === "/sign-in" || path === "/sign-up" ? (
            <SignIn />
          ) : (
            <section className="page">
              <h1>Let’s find your next step.</h1>
              <Link href="/">Return home</Link>
            </section>
          )}
        </main>
      )}
      {!staff && <HelpOptions />}
      <footer>
        <Link className="brand" href="/">
          HerVoice.
        </Link>
        <p>Your voice. Your choices. Your pace.</p>
        <div>
          <Link href="/privacy-safety">Privacy & safety</Link>
          <Link href="/requests">My requests</Link>
          <Link href="/sign-in">Responder sign-in</Link>
          <span>Built with care. Designed around you.</span>
        </div>
      </footer>
    </>
  );
}
function Home() {
  return (
    <>
      <section className="care-intro">
        <div className="care-intro-main">
          <div className="eyebrow">
            <ShieldCheck size={16} /> SUPPORT FOR WOMEN IN THE UNITED STATES
          </div>
          <h1>
            Find the support
            <br />
            you need.
          </h1>
          <p>
            You deserve to feel safe and heard. Talk to an advocate, explore
            your options, or write down what’s happening. We’ll help you find a
            place to start.
          </p>
          <div className="care-actions">
            <button
              className="btn"
              onClick={() =>
                window.dispatchEvent(new Event("hervoice-open-help"))
              }
            >
              <HeartHandshake size={21} /> Get help now <ArrowRight size={20} />
            </button>
            <Link className="btn secondary" href="/resources">
              Find U.S. resources <ArrowUpRight size={19} />
            </Link>
          </div>
          <div className="care-assurance">
            <span>
              <Check size={17} /> No account needed
            </span>
            <span>
              <LockKeyhole size={16} /> You choose what to share
            </span>
          </div>
        </div>
        <div className="advocate-card">
          <div className="advocate-card-top">
            <span className="care-symbol">
              <Phone size={25} />
            </span>
            <span className="badge">REAL U.S. SUPPORT · 24/7</span>
          </div>
          <h2>
            You don’t have to
            <br />
            figure this out alone.
          </h2>
          <p>
            The National Domestic Violence Hotline can help you talk through
            options and find support near you.
          </p>
          <a className="btn hotline-call" href="tel:18007997233">
            <Phone size={21} />
            <span>
              Call 800-799-7233<small>National Domestic Violence Hotline</small>
            </span>
            <ArrowUpRight size={20} />
          </a>
          <a
            className="advocate-chat"
            href="https://www.thehotline.org/"
            target="_blank"
            rel="noreferrer"
          >
            <MessageCircle size={20} /> Prefer to type? Open advocate chat{" "}
            <ArrowUpRight size={18} />
          </a>
          <small>
            External service. Call or open chat only when it’s safe. HerVoice
            does not monitor or receive these conversations.
          </small>
        </div>
      </section>
      <section className="choices care-choices">
        <div className="sectionHeading">
          <div>
            <div className="eyebrow">YOUR NEXT STEP</div>
            <h2>How can we help you today?</h2>
          </div>
          <p>You’re in control of where to start.</p>
        </div>
        <div className="cardgrid">
          {[
            {
              icon: HeartHandshake,
              n: "01",
              title: "Request support",
              text: "Share your situation in your own words. Choose a safe way to be contacted.",
              link: "/help",
              cta: DEMO ? "Open practice request" : "Start a support request",
            },
            {
              icon: MessageCircle,
              n: "02",
              title: "Talk things through",
              text: "A quiet space to reflect with an AI companion. Text first, at your pace.",
              link: "/support",
              cta: "Open AI support chat",
            },
            {
              icon: BookOpen,
              n: "03",
              title: "Understand your options",
              text: "Find U.S. information, state resources, and a starting point for legal help.",
              link: "/rights",
              cta: "Explore your rights",
            },
          ].map((c) => (
            <Link className="choice" key={c.n} href={c.link}>
              <div className="choiceTop">
                <span className="iconbox">
                  <c.icon size={25} />
                </span>
                <span>{c.n}</span>
              </div>
              <h3>{c.title}</h3>
              <p>{c.text}</p>
              <span className="cardlink">
                {c.cta}
                <ArrowRight size={19} />
              </span>
            </Link>
          ))}
        </div>
      </section>
      <section className="care-emergency">
        <ShieldCheck size={25} />
        <div>
          <h3>Need immediate help?</h3>
          <p>
            For immediate danger or a medical emergency in the U.S., call{" "}
            <a href="tel:911">911</a> if it’s safe. HerVoice cannot dispatch
            emergency help.
          </p>
        </div>
        <a
          className="btn secondary"
          href="https://womenshealth.gov/relationships-and-safety/get-help"
          target="_blank"
          rel="noreferrer"
        >
          Support information <ArrowUpRight size={17} />
        </a>
      </section>
      <section className="reassure">
        <span className="iconbox">
          <LockKeyhole size={25} />
        </span>
        <div>
          <h3>Your safety. Your choices.</h3>
          <p>
            Share as much or as little as you want. Quick exit is always at the
            top.
            <br />
            Learn what this site saves and what leaving can’t erase.
          </p>
        </div>
        <Link href="/privacy-safety">
          Privacy & safety <ArrowRight size={18} />
        </Link>
      </section>
      <section className="softnote">
        <p>You deserve care, respect, and a choice in what comes next.</p>
      </section>
    </>
  );
}
function Help() {
  const router = useRouter();
  const [step, S] = useState(0);
  const [busy, B] = useState(false);
  const [error, E] = useState("");
  const [info, I] = useState("");
  const [f, F] = useState({
    alias: "",
    original: "",
    narrative: "",
    category: "Safety planning",
    method: "none",
    value: "",
    safeTime: "",
    voicemail: false,
    location: "",
    urgent: false,
    channel: "direct",
  });
  const idem = useRef(crypto.randomUUID());
  const title = useRef<HTMLHeadingElement>(null);
  function set(k: string, v: unknown) {
    F((x) => ({ ...x, [k]: v }));
  }
  useEffect(() => {
    title.current?.focus();
  }, [step]);
  async function next() {
    E("");
    if (step === 0 && !f.original.trim()) {
      E("Please add a few words about the support you would like.");
      return;
    }
    if (
      step === 1 &&
      f.method === "email" &&
      !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(f.value)
    ) {
      E("Enter a valid safe email address.");
      return;
    }
    if (
      step === 1 &&
      ["phone", "text"].includes(f.method) &&
      f.value.replace(/\D/g, "").length < 7
    ) {
      E("Enter a safe contact number.");
      return;
    }
    if (step < 3) {
      if (step === 0 && !f.narrative) set("narrative", f.original);
      S(step + 1);
      return;
    }
    B(true);
    try {
      const r = await api("/requests", {
        alias: f.alias,
        original: f.original,
        narrative: f.narrative,
        category: f.category,
        contact: {
          method: f.method,
          value: f.method === "none" ? "" : f.value,
          safeTime: f.safeTime,
          voicemail: f.voicemail,
        },
        location: f.location || null,
        urgent: f.urgent,
        channel: f.channel,
        idempotencyKey: idem.current,
      });
      router.push("/requests/" + r.id);
    } catch (e) {
      E((e as Error).message);
    } finally {
      B(false);
    }
  }
  return (
    <section className="page formpage">
      <div className="eyebrow">GET HELP · YOUR CHOICES COME FIRST</div>
      <h1>One step at a time.</h1>
      <p className="intro">
        You decide what to share. You can go back and change anything.
      </p>
      <ol className="steps">
        {["Your situation", "Safe contact", "Your message", "How to send"].map(
          (t, i) => (
            <li className={i <= step ? "current" : ""} key={t}>
              <span>{i < step ? <Check size={14} /> : i + 1}</span>
              <small>{t}</small>
            </li>
          ),
        )}
      </ol>
      <div className="panel">
        <h2 ref={title} tabIndex={-1}>
          {
            [
              "What would you like support with?",
              "How can someone safely contact you?",
              "Your message, in your words.",
              "Choose your next step.",
            ][step]
          }
        </h2>
        {step === 0 ? (
          <>
            <p>Share only what feels comfortable. A few words are enough.</p>
            <Field label="What’s on your mind?">
              <textarea
                rows={5}
                value={f.original}
                onChange={(e) => set("original", e.target.value)}
                maxLength={8000}
              />
            </Field>
            <Field label="Type of support">
              <select
                value={f.category}
                onChange={(e) => set("category", e.target.value)}
              >
                {[
                  "Safety planning",
                  "Housing",
                  "Financial",
                  "Legal information",
                  "Emotional support",
                  "Other",
                ].map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </Field>
            <Field label="Name or alias (optional)">
              <input
                value={f.alias}
                onChange={(e) => set("alias", e.target.value)}
                maxLength={100}
              />
            </Field>
            <label className="check">
              <input
                type="checkbox"
                checked={f.urgent}
                onChange={(e) => set("urgent", e.target.checked)}
              />{" "}
              I am reporting immediate danger
            </label>
            {f.urgent && (
              <p className="notice">
                This service cannot dispatch help or monitor your safety. If
                safe, consider contacting local emergency services or a trusted
                person.
              </p>
            )}
          </>
        ) : step === 1 ? (
          <>
            <Field label="Safe contact preference">
              <select
                value={f.method}
                onChange={(e) => {
                  set("method", e.target.value);
                  set("value", "");
                }}
              >
                {[
                  ["none", "Do not contact me"],
                  ["email", "Email"],
                  ["text", "Text message"],
                  ["phone", "Phone"],
                  ["in_person", "In person"],
                ].map(([v, t]) => (
                  <option key={v} value={v}>
                    {t}
                  </option>
                ))}
              </select>
            </Field>
            {["email", "text", "phone"].includes(f.method) && (
              <>
                <Field
                  label={
                    f.method === "email"
                      ? "Safe email address"
                      : "Safe contact number"
                  }
                >
                  <input
                    type={f.method === "email" ? "email" : "tel"}
                    value={f.value}
                    onChange={(e) => set("value", e.target.value)}
                  />
                </Field>
                <Field label="Safe times to contact you (optional)">
                  <input
                    value={f.safeTime}
                    onChange={(e) => set("safeTime", e.target.value)}
                  />
                </Field>
                {f.method === "phone" && (
                  <label className="check">
                    <input
                      type="checkbox"
                      checked={f.voicemail}
                      onChange={(e) => set("voicemail", e.target.checked)}
                    />{" "}
                    It is safe to leave voicemail
                  </label>
                )}
              </>
            )}
            <Field
              label="City or region (optional)"
              hint="Manual entry works without sharing your precise location."
            >
              <input
                value={f.location}
                onChange={(e) => set("location", e.target.value)}
              />
            </Field>
            <Button
              secondary
              onClick={() => {
                I("");
                if (!navigator.geolocation) {
                  I(
                    "Location is not supported. You can type a location above.",
                  );
                  return;
                }
                navigator.geolocation.getCurrentPosition(
                  (p) => {
                    set(
                      "location",
                      `${p.coords.latitude.toFixed(4)}, ${p.coords.longitude.toFixed(4)}`,
                    );
                    I(
                      "Coordinates added by your choice. No geocoding service was contacted.",
                    );
                  },
                  () =>
                    I(
                      "Location permission was denied or timed out. You can type a city above.",
                    ),
                  { timeout: 8000 },
                );
              }}
            >
              Use my location
            </Button>
          </>
        ) : step === 2 ? (
          <>
            <p>This exact message will be submitted or hidden in your PNG.</p>
            <Field label="Approved message">
              <textarea
                rows={7}
                value={f.narrative}
                onChange={(e) => set("narrative", e.target.value)}
                maxLength={8000}
              />
            </Field>
            <div className="actions">
              <Button
                secondary
                onClick={async () => {
                  B(true);
                  try {
                    const d = await api("/drafts", { text: f.narrative });
                    set("narrative", d.text);
                    I(d.provider);
                  } catch (e) {
                    E((e as Error).message);
                  } finally {
                    B(false);
                  }
                }}
              >
                Help me write this
              </Button>
              <Button secondary onClick={() => set("narrative", f.original)}>
                Revert to my words
              </Button>
            </div>
            <small>
              Demo assistance keeps your words intact. A configured live AI
              provider would receive your supplied text.
            </small>
          </>
        ) : (
          <>
            <p>
              Recipient:{" "}
              <strong>
                {DEMO
                  ? "HerVoice Practice Center"
                  : process.env.NEXT_PUBLIC_ORG_NAME ||
                    "Participating organization"}
              </strong>{" "}
              <Badge>
                {DEMO ? "Synthetic organization" : "Direct support queue"}
              </Badge>
            </p>
            <label className="option">
              <input
                type="radio"
                name="channel"
                checked={f.channel === "direct"}
                onChange={() => set("channel", "direct")}
              />
              <div>
                <strong>
                  {DEMO
                    ? "Submit a demo support request"
                    : "Submit a support request"}
                </strong>
                <p>
                  {DEMO
                    ? "Save to the practice responder queue. No real organization is contacted."
                    : "Save to the participating organization’s private queue. Human review is not guaranteed."}
                </p>
              </div>
            </label>
            <label className="option">
              <input
                type="radio"
                name="channel"
                checked={f.channel === "image"}
                onChange={() => set("channel", "image")}
              />
              <div>
                <strong>Prepare a discreet PNG</strong>
                <p>
                  Save a request and download an encrypted image. It is only
                  received after authorized intake.
                </p>
              </div>
            </label>
            <div className="summary">
              <p>
                <strong>Message</strong>
                <br />
                {f.narrative}
              </p>
              <p>
                <strong>Contact:</strong>{" "}
                {f.method === "none"
                  ? "Do not contact me"
                  : `${f.method}: ${f.value}`}
              </p>
              <p>
                <strong>Location:</strong> {f.location || "Not shared"}
              </p>
            </div>
          </>
        )}
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        {info && (
          <p className="notice" role="status">
            {info}
          </p>
        )}
        <div className="formactions">
          {step > 0 ? (
            <Button secondary onClick={() => S(step - 1)}>
              <ArrowLeft size={16} /> Back
            </Button>
          ) : (
            <span />
          )}
          <Button
            disabled={busy || (step === 2 && !f.narrative.trim())}
            onClick={next}
          >
            {busy
              ? "Saving…"
              : step === 3
                ? f.channel === "image"
                  ? "Prepare request"
                  : DEMO
                    ? "Submit demo request"
                    : "Submit support request"
                : "Continue"}
            <ArrowRight size={16} />
          </Button>
        </div>
      </div>
      <p className="underform">
        <LockKeyhole size={14} /> Drafts stay in memory until you submit.
        Leaving this page clears your draft.
      </p>
    </section>
  );
}
function Requests({
  id,
  complete = false,
}: {
  id?: string;
  complete?: boolean;
}) {
  const [data, D] = useState<any>(null);
  const [error, E] = useState("");
  const [style, S] = useState(0);
  const [upload, U] = useState<File | null>(null);
  const [job, J] = useState<any>(null);
  const [chosen, Choose] = useState<number | null>(null);
  const [promptText, Prompt] = useState("A quiet landscape, no people");
  const [info, Info] = useState("");
  useEffect(() => {
    if (!job || ["complete", "failed", "canceled"].includes(job.status)) return;
    const timer = setInterval(() => {
      api(`/requests/${id}/jobs/${job.id}`)
        .then(J)
        .catch((e) => E(e.message));
    }, 1200);
    return () => clearInterval(timer);
  }, [id, job]);
  useEffect(() => {
    api(id ? "/requests/" + id : "/requests")
      .then(D)
      .catch((e) => E(e.message));
  }, [id]);
  async function download(share = false) {
    try {
      const form = new FormData();
      if (upload) form.append("file", upload);
      const r = await fetch(
        job && chosen !== null
          ? `/api/v1/requests/${id}/jobs/${job.id}/encode/${chosen}`
          : `/api/v1/requests/${id}/image?style=${style}`,
        job && chosen !== null
          ? { method: "POST" }
          : upload
            ? { method: "POST", body: form }
            : {},
      );
      if (!r.ok) {
        const d = await r.json();
        throw Error(d.message);
      }
      const blob = await r.blob();
      const file = new File([blob], "landscape.png", { type: "image/png" });
      if (share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file] });
        Info(
          "File handed to your device’s share dialog. Receipt and delivery are not confirmed.",
        );
        return;
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "landscape.png";
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 10000);
    } catch (e) {
      E((e as Error).message);
    }
  }
  return (
    <section className="page formpage">
      <div className="eyebrow">YOUR PRIVATE RECEIPT SESSION</div>
      <h1>{id ? "Your request is saved." : "My requests"}</h1>
      <p className="intro">
        {DEMO
          ? "Demo records only. No real assistance has been requested."
          : "Saved to the organization workspace. Receipt does not mean a responder has reviewed your request."}
      </p>
      {error && <p className="error">{error}</p>}
      {!data && !error ? (
        <p>Loading your requests…</p>
      ) : id && data ? (
        <>
          <div className="panel">
            <Badge>
              {data.delivery === "prepared_only"
                ? "Prepared · awaiting intake"
                : DEMO
                  ? "Received by demo queue"
                  : "Saved to organization queue"}
            </Badge>
            <h2>Reference {data.id.slice(0, 8)}</h2>
            <p>{data.narrative}</p>
            <p>
              <strong>Contact preference:</strong>{" "}
              {data.contact.method === "none"
                ? "Do not contact me"
                : data.contact.method}
            </p>
            <p>
              <strong>Status:</strong> {data.status.replaceAll("_", " ")}
            </p>
            <p>
              Your browser has a private receipt cookie valid for one day. A
              reference number alone does not give access.
            </p>
            <Button
              secondary
              onClick={async () => {
                if (
                  confirm(
                    "Delete this demo request and its contact details? Downloaded images remain on your device.",
                  )
                ) {
                  try {
                    await api("/requests/" + id, undefined, "DELETE");
                    location.href = "/requests";
                  } catch (e) {
                    E((e as Error).message);
                  }
                }
              }}
            >
              Delete my request
            </Button>
          </div>
          <div className="panel">
            <h2>Prepare a discreet image</h2>
            <p>
              Your exact message is encrypted and verified inside an original
              PNG. This does not deliver the message.
            </p>
            <div className="covers">
              {["Sage", "Dusk", "Sand"].map((t, i) => (
                <button
                  aria-pressed={style === i && !upload}
                  className={"cover c" + i}
                  key={t}
                  onClick={() => {
                    S(i);
                    U(null);
                    Choose(null);
                  }}
                >
                  {t}
                  {style === i && !upload && <Check size={16} />}
                </button>
              ))}
            </div>
            <Field label="Or upload an original PNG (max 8 MB)">
              <input
                type="file"
                accept="image/png"
                onChange={(e) => {
                  U(e.target.files?.[0] || null);
                  Choose(null);
                }}
              />
            </Field>
            <details className="enhance">
              <summary>Optional: prepare three cover options</summary>
              <p>
                {DEMO
                  ? "Demo creates three neutral covers locally."
                  : "This sends the cover description to the configured image provider."}{" "}
                Your support message is not included.
              </p>
              <Field label="Cover description">
                <input
                  value={promptText}
                  maxLength={500}
                  onChange={(e) => Prompt(e.target.value)}
                />
              </Field>
              <Button
                secondary
                disabled={job && ["queued", "running"].includes(job.status)}
                onClick={async () => {
                  try {
                    Choose(null);
                    J(
                      await api("/requests/" + id + "/covers", {
                        prompt: promptText,
                      }),
                    );
                  } catch (e) {
                    E((e as Error).message);
                  }
                }}
              >
                Prepare 3 covers
              </Button>
              {job && (
                <p role="status">
                  {job.status} · {job.progress}%
                </p>
              )}
              {job?.status === "failed" && (
                <p className="notice">
                  Cover preparation is unavailable. Built-in covers and upload
                  still work.
                </p>
              )}
              {job?.status === "complete" && (
                <div className="covers">
                  {job.results.map((r: any) => (
                    <button
                      className="generatedCover"
                      aria-pressed={chosen === r.index}
                      key={r.index}
                      onClick={() => {
                        Choose(r.index);
                        U(null);
                      }}
                    >
                      <img
                        alt={"Cover option " + (r.index + 1)}
                        src={`/api/v1/requests/${id}/jobs/${job.id}/results/${r.index}`}
                      />
                      <span>
                        {chosen === r.index ? "Selected" : "Choose"}{" "}
                        {r.index + 1}
                      </span>
                    </button>
                  ))}
                </div>
              )}
              {job && ["queued", "running"].includes(job.status) && (
                <Button
                  secondary
                  onClick={async () =>
                    J(
                      await api(
                        `/requests/${id}/jobs/${job.id}`,
                        undefined,
                        "DELETE",
                      ),
                    )
                  }
                >
                  Cancel cover preparation
                </Button>
              )}
            </details>
            <div className="actions">
              <Button onClick={() => download()}>
                <Download size={16} /> Download verified PNG
              </Button>
              <Button secondary onClick={() => download(true)}>
                Share PNG or download
              </Button>
            </div>
            {info && <p className="notice">{info}</p>}
            <p className="notice">
              Resizing, screenshots, JPEG conversion, or social platform
              processing may destroy the message. Downloading or sharing does
              not prove receipt. Pixel content can still identify you.
            </p>
          </div>
          <div className="panel">
            <h2>Activity</h2>
            {data.events.map((e: any) => (
              <p key={e.id}>
                <strong>{e.type.replaceAll("_", " ")}</strong>
                <br />
                <small>{date(e.time)}</small>
              </p>
            ))}
          </div>
        </>
      ) : data?.length ? (
        <div className="panel">
          {data.map((r: any) => (
            <Link className="listrow" href={"/requests/" + r.id} key={r.id}>
              <span>
                Request {r.id.slice(0, 8)}
                <small>{date(r.created)}</small>
              </span>
              <Badge>{r.status}</Badge>
              <ArrowRight size={16} />
            </Link>
          ))}
        </div>
      ) : (
        <div className="panel">
          <h2>No requests in this browser session.</h2>
          <p>
            Requests appear here after you submit. Clearing cookies removes
            access.
          </p>
          <Link className="btn" href="/help">
            Create a request <ArrowRight size={16} />
          </Link>
        </div>
      )}
    </section>
  );
}
function Chat() {
  const [messages, M] = useState<{ role: string; text: string }[]>([]);
  const [text, T] = useState("");
  const [busy, B] = useState(false);
  const [error, E] = useState("");
  const [avatar, A] = useState(false);
  const [speaking, S] = useState(false);
  const generation = useRef(0);
  useEffect(() => {
    function stop() {
      generation.current++;
      window.speechSynthesis?.cancel();
      M([]);
      T("");
    }
    window.addEventListener("hervoice-exit", stop);
    return () => {
      stop();
      window.removeEventListener("hervoice-exit", stop);
    };
  }, []);
  async function send() {
    if (!text.trim() || busy) return;
    const value = text;
    T("");
    const old = messages;
    M([...old, { role: "you", text: value }]);
    B(true);
    E("");
    const g = generation.current;
    try {
      const d = await api("/support", { text: value, history: old.slice(-20) });
      if (g === generation.current)
        M([
          ...old,
          { role: "you", text: value },
          { role: "assistant", text: d.text },
        ]);
    } catch (e) {
      E((e as Error).message);
    } finally {
      if (g === generation.current) B(false);
    }
  }
  function speak() {
    const last = [...messages].reverse().find((m) => m.role === "assistant");
    if (!last) return;
    const s = new SpeechSynthesisUtterance(last.text);
    s.onend = () => S(false);
    s.onerror = () => {
      S(false);
      E("Voice unavailable. You can continue reading the conversation.");
    };
    S(true);
    window.speechSynthesis?.speak(s);
  }
  return (
    <section className="page chatpage">
      <div className="eyebrow">A LITTLE SPACE TO BE HEARD</div>
      <h1>Let’s talk things through.</h1>
      <p className="intro">No perfect words needed. Start wherever you are.</p>
      <div className="chatbar">
        <span className="avatarSmall">
          <Leaf size={20} />
        </span>
        <div>
          <strong>Your support space</strong>
          <small>
            AI {DEMO ? "demo " : ""}companion · not a therapist or emergency
            service
          </small>
        </div>
        <Badge>Memory off</Badge>
      </div>
      <div className="chatbody" aria-live="polite">
        {!messages.length && (
          <div className="welcome">
            <span className="iconbox">
              <MessageCircle size={28} />
            </span>
            <h2>I’m here to listen.</h2>
            <p>
              You can share what’s on your mind, or start with a small question.
            </p>
            <div className="chips">
              {[
                "I’m not sure where to start",
                "I’d like to explore my options",
                "I just need to talk",
              ].map((t) => (
                <button key={t} onClick={() => T(t)}>
                  {t}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((m, i) => (
          <div className={"message " + m.role} key={i}>
            <small>
              {m.role === "you"
                ? "You"
                : DEMO
                  ? "HerVoice · Demo response"
                  : "HerVoice · AI response"}
            </small>
            <p>{m.text}</p>
          </div>
        ))}
        {busy && (
          <p>{DEMO ? "Preparing a demo response…" : "Preparing a reply…"}</p>
        )}
      </div>
      {avatar && <Companion speaking={speaking} />}
      <div className="chattools">
        <Button secondary onClick={() => A(!avatar)}>
          {avatar ? "Text only" : "Enable 3D companion"}
        </Button>
        <Button
          secondary
          disabled={!messages.length}
          onClick={() => {
            if (speaking) {
              window.speechSynthesis?.cancel();
              S(false);
            } else speak();
          }}
        >
          {speaking ? <VolumeX size={16} /> : <Volume2 size={16} />}{" "}
          {speaking ? "Stop voice" : "Read latest reply"}
        </Button>
        <Button
          secondary
          onClick={() => {
            generation.current++;
            M([]);
            B(false);
            window.speechSynthesis?.cancel();
            S(false);
          }}
        >
          Clear conversation
        </Button>
      </div>
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      <form
        className="composer"
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
      >
        <label className="sr-only" htmlFor="chat">
          Your message
        </label>
        <textarea
          id="chat"
          rows={2}
          maxLength={4000}
          placeholder="What’s on your mind?"
          value={text}
          onChange={(e) => T(e.target.value)}
        />
        <button
          className="btn"
          disabled={busy || !text.trim()}
          aria-label="Send message"
        >
          <ArrowRight size={20} />
        </button>
      </form>
      <p className="underform">
        <LockKeyhole size={13} /> This conversation stays in memory. It is never
        shared with responders.
      </p>
    </section>
  );
}
function Rights() {
  const [q, Q] = useState("");
  const [j, J] = useState("United States");
  const [state, SetState] = useState("");
  const [answer, A] = useState<any>(null);
  const [busy, B] = useState(false);
  const [error, E] = useState("");
  return (
    <section className="page formpage">
      <div className="eyebrow">KNOW YOUR RIGHTS</div>
      <h1>Clarity is a place to start.</h1>
      <p className="intro">
        Explore official sources about your options. This demo does not provide
        legal advice.
      </p>
      <div className="panel">
        <Field label="Jurisdiction">
          <select value={j} onChange={(e) => J(e.target.value)}>
            <option>United States</option>
            <option>Other</option>
          </select>
        </Field>
        {j === "United States" && (
          <Field
            label="State or territory (optional)"
            hint="National information is available without a location. State laws vary; coverage is limited to the sources shown."
          >
            <select value={state} onChange={(e) => SetState(e.target.value)}>
              <option value="">National information / prefer not to say</option>
              {US_REGIONS.map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </Field>
        )}
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            B(true);
            E("");
            try {
              A(
                await api("/legal", {
                  question: q,
                  jurisdiction: j,
                  state: state || null,
                }),
              );
            } catch (e) {
              E((e as Error).message);
            } finally {
              B(false);
            }
          }}
        >
          <Field label="What would you like to understand?">
            <textarea
              rows={4}
              value={q}
              onChange={(e) => Q(e.target.value)}
              required
              maxLength={4000}
            />
          </Field>
          <button className="btn" disabled={busy}>
            {busy ? "Checking sources…" : "Explore sources"}{" "}
            <BookOpen size={16} />
          </button>
        </form>
        {error && <p className="error">{error}</p>}
      </div>
      {answer && (
        <div className="panel" aria-live="polite">
          <Badge>{answer.mode}</Badge>
          <h2>About your question</h2>
          <p style={{ whiteSpace: "pre-wrap" }}>{answer.answer}</p>
          {answer.sources.map((s: any) => (
            <a
              className="source"
              key={s.id}
              href={s.url}
              target="_blank"
              rel="noreferrer"
            >
              <BookOpen size={20} />
              <span>
                <strong>{s.title}</strong>
                <small>
                  {s.jurisdiction} · {s.section} · Source reviewed {s.reviewed}
                  <br />
                  Source-backed guidance and directories; not legal advice.
                  State-specific coverage is shown explicitly.
                </small>
              </span>
              <ArrowUpRight size={16} />
            </a>
          ))}
        </div>
      )}
      <div className="notice">
        Coverage is intentionally limited. When evidence is unavailable,
        HerVoice says so instead of generating an unsupported answer.
      </div>
    </section>
  );
}
const resources = [
  {
    name: "National Domestic Violence Hotline",
    category: "Talk to an advocate",
    region: "United States",
    state: "National",
    url: "https://www.thehotline.org/",
    text: "Call 800-799-7233, text START to 88788, or open the official website for advocate chat. Use a safe device when possible.",
  },
  {
    name: "Find support in your state or territory",
    category: "Local support",
    region: "United States",
    state: "National",
    url: "https://www.justice.gov/ovw/resources-victims-and-survivors",
    text: "The U.S. Department of Justice directory lists state, territory, and Tribal coalitions that can connect you to local providers.",
  },
  {
    name: "Office on Women’s Health — Get help",
    category: "Health & safety",
    region: "United States",
    state: "National",
    url: "https://womenshealth.gov/relationships-and-safety/get-help",
    text: "Federal guidance on domestic violence support, safety planning, and services. For a medical emergency, call 911 if safe.",
  },
  {
    name: "Supreme Court of Ohio — Domestic Violence Program",
    category: "Legal information",
    region: "United States",
    state: "Ohio",
    url: "https://www.supremecourt.ohio.gov/courts/services-to-courts/domestic-violence-program/",
    text: "Official Ohio protection-order forms and legal resources. A court or qualified local advocate can explain the steps for your situation.",
  },
  {
    name: "Ohio Domestic Violence Network",
    category: "Local support",
    region: "United States",
    state: "Ohio",
    url: "https://www.odvn.org/",
    text: "Ohio’s domestic violence coalition, listed in the U.S. Department of Justice survivor resource directory.",
  },
];
function Resources() {
  const [q, Q] = useState("");
  const [region, R] = useState("United States");
  const [state, SetState] = useState("");
  return (
    <section className="page">
      <div className="eyebrow">RESOURCES</div>
      <h1>A little more support.</h1>
      <p className="intro">
        U.S. support, health, and legal directories. Choose a state if you want.
        External sites have their own privacy policies.
      </p>
      <div className="filters">
        <Field label="Search resources">
          <input
            value={q}
            onChange={(e) => Q(e.target.value)}
            placeholder="Search by topic or name"
          />
        </Field>
        <Field label="Location">
          <select value={region} onChange={(e) => R(e.target.value)}>
            {["United States"].map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </Field>
      </div>
      <Field label="State or territory">
        <select value={state} onChange={(e) => SetState(e.target.value)}>
          <option value="">All U.S. resources</option>
          {US_REGIONS.map((x) => (
            <option key={x}>{x}</option>
          ))}
        </select>
      </Field>
      {state && state !== "Ohio" && (
        <p className="notice">
          Showing national services for {state}. Open the Department of Justice
          directory to find local coalitions; we do not claim a verified local
          provider list for this state.
        </p>
      )}
      <div className="resourcegrid">
        {resources
          .filter(
            (r) =>
              (region === "All" || region === r.region) &&
              (!state || r.state === "National" || r.state === state) &&
              (r.name + " " + r.text + " " + r.category)
                .toLowerCase()
                .includes(q.toLowerCase()),
          )
          .map((r) => (
            <a
              className="panel resource"
              href={r.url}
              key={r.name}
              target="_blank"
              rel="noreferrer"
            >
              <Badge>
                {r.state === "National" ? "U.S. national" : r.state} ·{" "}
                {r.category}
              </Badge>
              <h2>
                {r.name}
                <ArrowUpRight size={18} />
              </h2>
              <p>{r.text}</p>
              <span className="cardlink">
                Visit official resource <ArrowRight size={16} />
              </span>
            </a>
          ))}
      </div>
    </section>
  );
}
function Privacy() {
  return (
    <section className="page formpage">
      <div className="eyebrow">PRIVACY & SAFETY</div>
      <h1>You’re in control.</h1>
      <p className="intro">
        Understand what this demo saves before sharing anything.
      </p>
      {[
        [
          "Quick exit",
          "The Quick exit button stops speech, clears the current page, and replaces it with a weather website. It cannot erase browser history, network records, downloads, or monitoring software traces.",
        ],
        [
          "Drafts and conversations",
          "Request drafts and chat history stay in page memory. They are cleared when you leave or refresh. Chat text is sent to this local demo API for a deterministic reply and is not stored.",
        ],
        [
          "Submitted requests",
          "Requests, contact preferences and activity are saved in the local demo database until you delete them. A private browser receipt cookie lasts one day. Clearing it removes your browser’s access but does not delete the request. Use the delete control first. Do not enter real sensitive information in this development system.",
        ],
        [
          "Discreet images",
          "PNG messages use AES-GCM encryption with a server-held demo key. This is not end-to-end encryption. The server and authorized demo responders can read them. Downloaded images remain on your device after deletion and may be visible to others.",
        ],
        [
          "Contact and location",
          "No contact is selected by default. Geolocation is requested only when you click Use my location. No real messages, notifications, or requests are sent.",
        ],
        [
          "Retention and live use",
          "This is a local training system with synthetic organizations. There is no automated retention scheduler or backup deletion guarantee. Live deployment is disabled until authentication, encryption at rest, retention, and operational integrations have been implemented and verified.",
        ],
      ].map(([title, text]) => (
        <div className="panel" key={title}>
          <h2>{title}</h2>
          <p>{text}</p>
        </div>
      ))}
    </section>
  );
}
function SignIn() {
  const router = useRouter();
  const [org, O] = useState("demo-a");
  const [role, R] = useState("responder");
  const [error, E] = useState("");
  if (!DEMO)
    return (
      <section className="page formpage">
        <h1>Responder sign-in</h1>
        <p>
          Use your verified organization account. Staff membership is managed by
          your organization.
        </p>
        {process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ? (
          <ClerkSignIn routing="hash" forceRedirectUrl="/responder" />
        ) : (
          <p className="error">Live authentication is not configured.</p>
        )}
      </section>
    );
  return (
    <section className="page formpage">
      <div className="eyebrow">RESPONDER WORKSPACE</div>
      <h1>A space to offer support.</h1>
      <p className="intro">
        Enter an isolated synthetic training workspace. Demo sessions are
        established on the server.
      </p>
      <div className="panel">
        <Badge>Demo access only</Badge>
        <h2>Open a practice session</h2>
        <Field label="Practice organization">
          <select value={org} onChange={(e) => O(e.target.value)}>
            <option value="demo-a">HerVoice Practice Center A</option>
            <option value="demo-b">HerVoice Practice Center B</option>
          </select>
        </Field>
        <Field label="Practice role">
          <select value={role} onChange={(e) => R(e.target.value)}>
            <option value="responder">Responder</option>
            <option value="administrator">Administrator</option>
          </select>
        </Field>
        <Button
          onClick={async () => {
            try {
              await api("/demo/session", { organization: org, role });
              router.push("/responder");
            } catch (e) {
              E((e as Error).message);
            }
          }}
        >
          Open demo workspace <ArrowRight size={16} />
        </Button>
        {error && <p className="error">{error}</p>}
        <p>
          Public signup cannot create live staff access. Live Clerk
          authentication is not configured.
        </p>
      </div>
    </section>
  );
}
function Staff({ path }: { path: string }) {
  const [me, M] = useState<any>(null);
  const [error, E] = useState("");
  useEffect(() => {
    api("/me")
      .then(M)
      .catch((e) => E(e.message));
  }, []);
  return (
    <div className="staffshell">
      <aside>
        <div className="eyebrow">RESPONDER WORKSPACE</div>
        {[
          ["/responder", "Overview", LayoutDashboard],
          ["/responder/cases", "Cases", FolderOpen],
          ["/responder/intake", "Image intake", Upload],
          ["/responder/settings", "Settings", Settings],
        ].map(([p, t, Icon]) => (
          <Link
            className={path === p ? "selected" : ""}
            href={p as string}
            key={p as string}
          >
            {React.createElement(Icon as any, { size: 18 })}
            {t as string}
          </Link>
        ))}
        <div className="asidebottom">
          {!DEMO && <OrganizationSwitcher />}
          <small>
            {me?.org} · {me?.role}
          </small>
          <Button
            secondary
            onClick={async () => {
              await api("/session", undefined, "DELETE");
              location.href = "/";
            }}
          >
            Sign out <LogOut size={14} />
          </Button>
        </div>
      </aside>
      <main id="main" className="staffmain">
        {error ? (
          <div className="panel">
            <h1>Responder sign-in required</h1>
            <p role="alert">{error}</p>
            <Link className="btn" href="/sign-in">
              Sign in to demo
            </Link>
          </div>
        ) : !me ? (
          <p>Verifying your session…</p>
        ) : path === "/responder/intake" ? (
          <Intake />
        ) : path === "/responder/settings" ? (
          <StaffSettings />
        ) : path.startsWith("/responder/cases/") ? (
          <CaseDetail id={path.split("/")[3]} />
        ) : (
          <Queue overview={path === "/responder"} />
        )}
      </main>
    </div>
  );
}
function Queue({ overview }: { overview: boolean }) {
  const [data, D] = useState<any>(null);
  const [q, Q] = useState("");
  const [status, S] = useState("");
  const [priority, P] = useState("");
  const [page, G] = useState(1);
  const [error, E] = useState("");
  function load() {
    api(
      `/cases?q=${encodeURIComponent(q)}&status=${status}&priority=${priority}&page=${page}`,
    )
      .then(D)
      .catch((e) => E(e.message));
  }
  useEffect(() => {
    load();
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, [q, status, priority, page]);
  return (
    <>
      <div className="eyebrow">PRACTICE CENTER · PRIVATE WORKSPACE</div>
      <div className="sectionHeading">
        <div>
          <h1>
            {overview ? "A clearer view of support." : "Support requests"}
          </h1>
          <p>
            {overview
              ? "Review requests and help shape the next step."
              : "All cases are scoped to your organization."}
          </p>
        </div>
        <Button secondary onClick={load}>
          <RefreshCw size={16} /> Refresh
        </Button>
      </div>
      {overview && (
        <div className="stats">
          <div>
            <small>Matching requests</small>
            <strong>{data?.total ?? "—"}</strong>
          </div>
          <div>
            <small>Workspace</small>
            <strong>{DEMO ? "Demo" : "Live"}</strong>
          </div>
          <div>
            <small>Queue freshness</small>
            <strong>30 sec</strong>
          </div>
        </div>
      )}
      <div className="panel">
        <div className="filters">
          <Field label="Search alias or category">
            <input
              value={q}
              onChange={(e) => {
                Q(e.target.value);
                G(1);
              }}
              placeholder="Search cases"
            />
          </Field>
          <Field label="Status">
            <select
              value={status}
              onChange={(e) => {
                S(e.target.value);
                G(1);
              }}
            >
              <option value="">All statuses</option>
              {["received", "in_review", "closed"].map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </Field>
          <Field label="Priority">
            <select
              value={priority}
              onChange={(e) => {
                P(e.target.value);
                G(1);
              }}
            >
              <option value="">All priorities</option>
              <option>high</option>
              <option>normal</option>
            </select>
          </Field>
        </div>
        {error && <p className="error">{error}</p>}
        <div className="tablewrap">
          <table>
            <thead>
              <tr>
                <th>Request</th>
                <th>Support type</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Received</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {data?.items.map((c: Case) => (
                <tr key={c.id}>
                  <td>
                    <Link href={"/responder/cases/" + c.id}>
                      <strong>{c.alias || "Guest request"}</strong>
                      <small>{c.id.slice(0, 8)}</small>
                    </Link>
                  </td>
                  <td>{c.category}</td>
                  <td>
                    <span
                      className={
                        "badge " + (c.priority === "high" ? "urgent" : "")
                      }
                    >
                      {c.priority}
                    </span>
                  </td>
                  <td>
                    <Badge>{c.status.replaceAll("_", " ")}</Badge>
                  </td>
                  <td>{new Date(c.created).toLocaleDateString()}</td>
                  <td>
                    <Link
                      aria-label={"Open " + (c.alias || "request")}
                      href={"/responder/cases/" + c.id}
                    >
                      <ArrowUpRight size={18} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {data && !data.items.length && <p>No matching requests.</p>}
        <div className="pagination">
          <small>
            {data?.total ?? 0} requests · Updated{" "}
            {data ? new Date(data.refreshed).toLocaleTimeString() : "…"}
          </small>
          <div>
            <Button secondary disabled={page === 1} onClick={() => G(page - 1)}>
              Previous
            </Button>
            <span>Page {page}</span>
            <Button
              secondary
              disabled={!data || page * 6 >= data.total}
              onClick={() => G(page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
function CaseDetail({ id }: { id: string }) {
  const [c, C] = useState<Case | null>(null);
  const [error, E] = useState("");
  const [note, N] = useState("");
  const [reason, R] = useState("");
  const [assignment, A] = useState("");
  const [status, S] = useState("");
  const [related, D] = useState<any[]>([]);
  const [info, I] = useState("");
  useEffect(() => {
    api("/cases/" + id)
      .then((d) => {
        C(d);
        S(d.status);
        A(d.assignment);
      })
      .catch((e) => E(e.message));
  }, [id]);
  async function update() {
    try {
      const d = await api(
        "/cases/" + id,
        { version: c!.version, status, assignment, note, reason },
        "PATCH",
      );
      C(d);
      N("");
      I("Case updated and activity recorded.");
    } catch (e) {
      E((e as Error).message);
    }
  }
  return (
    <>
      <Link className="backlink" href="/responder/cases">
        <ArrowLeft size={16} /> Back to cases
      </Link>
      {error && <p className="error">{error}</p>}
      {c && (
        <>
          <div className="eyebrow">CASE {c.id.slice(0, 8)}</div>
          <h1>{c.alias || "Guest request"}</h1>
          <div className="chips">
            <Badge>{c.status}</Badge>
            <Badge>
              {c.priority} priority · {c.urgent ? "person reported" : "default"}
            </Badge>
          </div>
          <div className="detailgrid">
            <div>
              <div className="panel">
                <h2>Their words</h2>
                <p className="narrative">{c.narrative}</p>
                <small>
                  Support type: {c.category} · Created {date(c.created)}
                </small>
              </div>
              <div className="panel">
                <h2>Safe contact</h2>
                <p>
                  <strong>
                    {c.contact.method === "none"
                      ? "Do not contact this person"
                      : c.contact.method}
                  </strong>
                </p>
                {c.contact.method !== "none" && (
                  <>
                    <p>{c.contact.value}</p>
                    <p>Safe times: {c.contact.safeTime || "Not provided"}</p>
                    <p>
                      Voicemail:{" "}
                      {c.contact.voicemail ? "Allowed" : "Not allowed"}
                    </p>
                  </>
                )}
                <p>Location: {c.location || "Not shared"}</p>
              </div>
              <div className="panel">
                <h2>Related reports</h2>
                <p>
                  Lexical overlap supports human review. It does not establish
                  identity or a shared incident.
                </p>
                <Button
                  secondary
                  onClick={async () => {
                    try {
                      D(await api("/cases/" + id + "/related", {}));
                    } catch (e) {
                      E((e as Error).message);
                    }
                  }}
                >
                  Find related reports
                </Button>
                {related.map((r) => (
                  <div className="related" key={r.id}>
                    <Link href={"/responder/cases/" + r.id}>{r.alias}</Link>
                    <small>
                      {r.method} · score {r.score}
                    </small>
                    <div className="actions">
                      {["link", "reject"].map((decision) => (
                        <Button
                          secondary
                          key={decision}
                          onClick={async () => {
                            const why = prompt(
                              "Reason for this review decision",
                            );
                            if (why)
                              try {
                                await api(
                                  "/cases/" + id + "/related/decision",
                                  { target: r.id, decision, reason: why },
                                );
                                I("Related report decision saved.");
                              } catch (e) {
                                E((e as Error).message);
                              }
                          }}
                        >
                          {decision === "link" ? "Link" : "Reject"}
                        </Button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div className="panel">
                <h2>Manage case</h2>
                <Field label="Status">
                  <select value={status} onChange={(e) => S(e.target.value)}>
                    {["received", "in_review", "closed"].map((x) => (
                      <option key={x}>{x}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Assigned responder">
                  <input
                    value={assignment}
                    onChange={(e) => A(e.target.value)}
                    maxLength={100}
                  />
                </Field>
                {status === "closed" && (
                  <Field label="Closure reason (required)">
                    <textarea
                      value={reason}
                      onChange={(e) => R(e.target.value)}
                      maxLength={500}
                    />
                  </Field>
                )}
                <Field label="Private case note">
                  <textarea
                    value={note}
                    onChange={(e) => N(e.target.value)}
                    maxLength={2000}
                  />
                </Field>
                <Button onClick={update}>Save changes</Button>
                {info && (
                  <p className="notice" role="status">
                    {info}
                  </p>
                )}
              </div>
              <div className="panel">
                <h2>Activity history</h2>
                {[...c.events].reverse().map((e) => (
                  <div className="event" key={e.id}>
                    <span className="dot" />
                    <div>
                      <strong>{e.type.replaceAll("_", " ")}</strong>
                      <p>{e.note}</p>
                      <small>
                        {e.actor} · {date(e.time)}
                      </small>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
function Intake() {
  const [file, F] = useState<File | null>(null);
  const [preview, P] = useState<any>(null);
  const [error, E] = useState("");
  const [busy, B] = useState(false);
  return (
    <>
      <div className="eyebrow">DISCREET IMAGE INTAKE</div>
      <h1>A message beneath the surface.</h1>
      <p>
        Verify an original PNG, review the decoded message, then accept it into
        your queue.
      </p>
      <div className="panel intake">
        <span className="iconbox">
          <Upload size={27} />
        </span>
        <h2>Upload an original PNG</h2>
        <p>Only your organization’s encrypted messages can be decoded.</p>
        <Field label="Choose image (max 8 MB)">
          <input
            type="file"
            accept="image/png"
            onChange={(e) => {
              F(e.target.files?.[0] || null);
              P(null);
            }}
          />
        </Field>
        <Button
          disabled={!file || busy}
          onClick={async () => {
            E("");
            B(true);
            try {
              const form = new FormData();
              form.append("file", file!);
              const r = await fetch("/api/v1/intake/preview", {
                method: "POST",
                body: form,
              });
              const d = await r.json();
              if (!r.ok) throw Error(d.message || "Unable to decode image");
              P(d);
            } catch (e) {
              E((e as Error).message);
            } finally {
              B(false);
            }
          }}
        >
          {busy ? "Verifying…" : "Verify & preview"}
          <ShieldCheck size={17} />
        </Button>
        {error && (
          <p role="alert" className="error">
            {error}
          </p>
        )}
      </div>
      {preview && (
        <div className="panel">
          <Badge>Authenticated and verified</Badge>
          <h2>Review the message</h2>
          <p>{preview.narrative}</p>
          <p>
            {preview.alreadyReceived
              ? "This request is already in your queue. Confirming will not create a duplicate."
              : "This request has not yet been received."}
          </p>
          <Button
            onClick={async () => {
              try {
                await api("/intake/confirm", {
                  id: preview.id,
                  verification: preview.verification,
                });
                location.href = "/responder/cases/" + preview.id;
              } catch (e) {
                E((e as Error).message);
              }
            }}
          >
            Confirm intake <Check size={16} />
          </Button>
        </div>
      )}
    </>
  );
}
function StaffSettings() {
  const [s, S] = useState<any>(null);
  useEffect(() => {
    api("/settings").then(S);
  }, []);
  return (
    <>
      <div className="eyebrow">WORKSPACE SETTINGS</div>
      <h1>Clear about what’s connected.</h1>
      <div className="panel">
        <h2>Organization & integrations</h2>
        <p>
          {s?.org} · {s?.role}
        </p>
        {s &&
          Object.entries(s.integrations).map(([k, v]) => (
            <div className="listrow" key={k}>
              <strong>{k}</strong>
              <Badge>{v as string}</Badge>
            </div>
          ))}
        <p>
          Membership and live credentials cannot be changed from this demo. Live
          mode fails closed.
        </p>
      </div>
    </>
  );
}
