"use client";
import React, { useState, useEffect, useRef, useId } from "react";
import NextLink from "next/link";
import { usePathname, useRouter as useNextRouter } from "next/navigation";
import CoverSite from "../../components/CoverSite";
import { useDiscreetSession } from "../../components/DiscreetSession";
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
  severity?: string;
  created: string;
  updated?: string;
  narrative: string;
  original: string;
  contact: {
    method: string;
    value: string;
    safeTime: string;
    voicemail: boolean;
  };
  location: string;
  details?: {
    duration?: string;
    frequency?: string;
    personDescription?: string;
    visibleInjuries?: string;
  };
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
const publicRoutes = [
  ["/help/complete", "/studio/complete"],
  ["/privacy-safety", "/about"],
  ["/requests", "/saved"],
  ["/resources", "/collections"],
  ["/support", "/journal"],
  ["/rights", "/library"],
  ["/sign-in", "/account"],
  ["/sign-up", "/join"],
  ["/responder", "/workspace"],
  ["/help", "/studio"],
];
function neutralPath(path: string) {
  for (const [privateRoute, publicRoute] of publicRoutes) {
    if (path === privateRoute || path.startsWith(privateRoute + "/"))
      return publicRoute + path.slice(privateRoute.length);
  }
  return path;
}
function privatePath(path: string) {
  for (const [privateRoute, publicRoute] of publicRoutes) {
    if (path === publicRoute || path.startsWith(publicRoute + "/"))
      return privateRoute + path.slice(publicRoute.length);
  }
  return path;
}
function Link(props: React.ComponentProps<typeof NextLink>) {
  return (
    <NextLink
      {...props}
      href={
        typeof props.href === "string" ? neutralPath(props.href) : props.href
      }
    />
  );
}
function useRouter() {
  const router = useNextRouter();
  return {
    ...router,
    push: (href: string) => router.push(neutralPath(href)),
    replace: (href: string) => router.replace(neutralPath(href)),
  };
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
  const id = useId();
  const control = React.isValidElement(children)
    ? React.cloneElement(
        children as React.ReactElement<{
          id?: string;
          "aria-describedby"?: string;
        }>,
        { id, "aria-describedby": hint ? id + "-hint" : undefined },
      )
    : children;
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {control}
      {hint && <small id={id + "-hint"}>{hint}</small>}
    </div>
  );
}
function RangeField({
  label,
  value,
  max,
  unit,
  onChange,
  hint,
}: {
  label: string;
  value: string;
  max: number;
  unit: string;
  onChange: (value: string) => void;
  hint?: string;
}) {
  const id = useId();
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <div className="range-row">
        <input
          id={id}
          type="range"
          min="0"
          max={max}
          step="1"
          value={parseInt(value) || 0}
          aria-valuetext={value || "Not shared"}
          aria-describedby={hint ? id + "-hint" : undefined}
          onChange={(e) => onChange(e.target.value + " " + unit)}
        />
        <output htmlFor={id}>{value || "Not shared"}</output>
      </div>
      {hint && <small id={id + "-hint"}>{hint}</small>}
    </div>
  );
}
function date(s: string) {
  return new Date(s).toLocaleString();
}
const nav = [
  ["/", "Home"],
  ["/help", "Create a post"],
  ["/rights", "Law bot"],
  ["/support", "Therapy bot"],
  ["/responder", "Dashboard"],
];
export default function App() {
  const rawPath = usePathname();
  const path = privatePath(rawPath);
  const router = useRouter();
  const { unlocked, unlock: Unlock } = useDiscreetSession();
  const escapeTime = useRef(0);
  function conceal() {
    if (document.querySelector(".private-shell"))
      document.documentElement.dataset.covering = "true";
    else delete document.documentElement.dataset.covering;
    window.speechSynthesis?.cancel();
    document
      .querySelectorAll("audio,video")
      .forEach((el) => (el as HTMLMediaElement).pause());
    window.dispatchEvent(new Event("hervoice-exit"));
    Unlock(false);
  }
  function cover() {
    conceal();
    router.replace("/");
  }
  useEffect(() => {
    if (!unlocked) delete document.documentElement.dataset.covering;
  }, [unlocked]);
  useEffect(() => {
    function visibility() {
      if (document.visibilityState === "hidden") cover();
    }
    function key(e: KeyboardEvent) {
      if (e.key !== "Escape") return;
      const time = Date.now();
      if (time - escapeTime.current < 900) cover();
      escapeTime.current = time;
    }
    function restored(e: PageTransitionEvent) {
      if (e.persisted) cover();
    }
    window.addEventListener("hervoice-cover", cover);
    window.addEventListener("keydown", key);
    document.addEventListener("visibilitychange", visibility);
    window.addEventListener("pagehide", conceal);
    window.addEventListener("pageshow", restored);
    return () => {
      window.removeEventListener("hervoice-cover", cover);
      window.removeEventListener("keydown", key);
      document.removeEventListener("visibilitychange", visibility);
      window.removeEventListener("pagehide", conceal);
      window.removeEventListener("pageshow", restored);
    };
  }, []);
  const staff = path.startsWith("/responder");
  const [error, setError] = useState("");
  useEffect(() => {
    setError("");
    document.documentElement.dataset.appReady = "true";
    return () => {
      delete document.documentElement.dataset.appReady;
    };
  }, [path]);
  function exit() {
    cover();
  }
  if (!unlocked)
    return (
      <>
        {process.env.NODE_ENV === "development" && <DevAudit />}
        <CoverSite
          onOpen={() => {
            delete document.documentElement.dataset.covering;
            Unlock(true);
            const destination = neutralPath(rawPath);
            if (destination !== rawPath) router.replace(destination);
          }}
        />
      </>
    );
  return (
    <div className="private-shell">
      {process.env.NODE_ENV === "development" && <DevAudit />}
      <a className="skip" href="#main">
        Skip to content
      </a>
      <div className="safetybar">
        <span>
          <LockKeyhole size={12} /> Personal space · Esc twice returns to
          reading.
        </span>
        <button onClick={exit}>
          Back to reading <LogOut size={13} />
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
    </div>
  );
}
function Home() {
  return (
    <>
      <section className="signal-banner" aria-label="Your space, your pace">
        <span>
          <span className="signal-dot" /> A SAFE PLACE TO BEGIN
        </span>
        <span>U.S. support · Your choices come first</span>
      </section>
      <section className="care-intro">
        <div className="care-intro-main">
          <div className="eyebrow">
            <ShieldCheck size={16} /> SUPPORT FOR WOMEN IN THE UNITED STATES
          </div>
          <h1>
            Your voice.
            <br />
            Your way forward.
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
        <div className="support-constellation" aria-hidden="true">
          <div className="orbit orbit-one" />
          <div className="orbit orbit-two" />
          <div className="voice-core">
            <HeartHandshake size={58} strokeWidth={1.3} />
          </div>
          <span className="orbit-label label-one">Be heard</span>
          <span className="orbit-label label-two">Find your options</span>
          <span className="orbit-label label-three">Take your next step</span>
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
      <section className="journey-strip" aria-label="Ways to use HerVoice">
        <div>
          <span>01 / SHARE</span>
          <strong>Your words, at your pace.</strong>
          <p>
            Write a request. Review every word. Choose a direct request or an
            encrypted PNG.
          </p>
          <Link href="/help">
            Create a request <ArrowUpRight size={16} />
          </Link>
        </div>
        <div>
          <span>02 / CONNECT</span>
          <strong>A little room to breathe.</strong>
          <p>
            Talk things through with an AI companion, with optional voice and a
            illustrated companion.
          </p>
          <Link href="/support">
            Enter your support space <ArrowUpRight size={16} />
          </Link>
        </div>
        <div>
          <span>03 / UNDERSTAND</span>
          <strong>More clarity. More choice.</strong>
          <p>
            Explore reviewed U.S. resources and source-backed information for
            your next step.
          </p>
          <Link href="/rights">
            Explore your options <ArrowUpRight size={16} />
          </Link>
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
            Share as much or as little as you want. Back to reading is always at
            the top.
            <br />
            Learn what this site saves and what leaving can’t erase.
          </p>
        </div>
        <Link href="/privacy-safety">
          Privacy & safety <ArrowRight size={18} />
        </Link>
      </section>
      <ProcessOverview />
      <section className="softnote">
        <p>You deserve care, respect, and a choice in what comes next.</p>
      </section>
    </>
  );
}
function ProcessOverview() {
  return (
    <section className="process-overview" aria-labelledby="process-title">
      <div className="eyebrow">HOW HERVOICE WORKS</div>
      <h2 id="process-title">An ordinary image. A message that matters.</h2>
      <p className="process-intro">
        Follow the message from your words to an authorized responder’s
        workspace.
      </p>
      <div className="process-lanes">
        {[
          {
            name: "Your side",
            steps: [
              {
                icon: MessageCircle,
                title: "Share a few details",
                text: "Write as much or as little as you choose.",
              },
              {
                icon: BookOpen,
                title: "Generate and review",
                text: "AI turns your details into sentences. You approve the message.",
              },
              {
                icon: Leaf,
                title: "Create an everyday image",
                text: "Choose an AI image. The approved message is encrypted inside its PNG.",
              },
            ],
          },
          {
            name: "Responder side",
            steps: [
              {
                icon: Search,
                title: "Detect an original PNG",
                text: "A permitted feed or the controlled demo scanner finds a tagged signal.",
              },
              {
                icon: ShieldCheck,
                title: "Verify and structure",
                text: "The original message is decoded, authenticated, and summarized for human review.",
              },
              {
                icon: LayoutDashboard,
                title: "Review the case",
                text: "Responders review the case, set priority, record actions and compare related reports.",
              },
            ],
          },
        ].map((lane) => (
          <div className="process-lane" key={lane.name}>
            <h3>{lane.name}</h3>
            <ol>
              {lane.steps.map((step, i) => (
                <li key={step.title}>
                  <span className="process-icon">
                    <step.icon size={24} />
                  </span>
                  <span className="eyebrow">STEP 0{i + 1}</span>
                  <h4>{step.title}</h4>
                  <p>{step.text}</p>
                </li>
              ))}
            </ol>
          </div>
        ))}
      </div>
      <p className="process-footnote">
        Social platforms may change image files. Use original PNG transfer;
        delivery and human response are never guaranteed. The hackathon scanner
        uses a controlled feed, not public social accounts.
      </p>
    </section>
  );
}
function Help() {
  const [imageProvider, ImageProvider] = useState("");
  useEffect(() => {
    api("/health")
      .then((h) => ImageProvider(h.capabilities.imageGeneration))
      .catch(() => {});
  }, []);
  const [step, S] = useState(0);
  const [busy, B] = useState(false);
  const [error, E] = useState("");
  const [info, I] = useState("");
  const [f, F] = useState({
    alias: "",
    duration: "",
    frequency: "",
    visibleInjuries: "not_shared",
    personDescription: "",
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
  const title = useRef<HTMLHeadingElement>(null);
  function set(k: string, v: unknown) {
    F((x) => ({
      ...x,
      [k]: v,
      ...(step === 0 && k !== "narrative" ? { narrative: "" } : {}),
    }));
  }
  useEffect(() => {
    title.current?.focus();
  }, [step]);
  const [record, Record] = useState<string | null>(null);
  const [job, Job] = useState<any>(null);
  const [chosen, Choose] = useState(0);
  const [prompt, Prompt] = useState(
    "Good morning, a cup of coffee beside flowers, warm sunlight",
  );
  const [poem, Poem] = useState("");
  const [mode, Mode] = useState("direct");
  useEffect(() => {
    if (!record || !job || !["queued", "running"].includes(job.status)) return;
    const timer = setInterval(
      () =>
        api(`/requests/${record}/jobs/${job.id}`)
          .then(Job)
          .catch((e) => E(e.message)),
      1000,
    );
    return () => clearInterval(timer);
  }, [record, job]);
  async function expandBrief() {
    E("");
    if (!f.original.trim()) {
      E("Add a few words about the situation first.");
      return;
    }
    B(true);
    try {
      const result = await api("/drafts", {
        text: f.original,
        alias: f.alias,
        location: f.location,
        urgent: f.urgent,
        details: {
          duration: f.duration,
          frequency: f.frequency,
          visibleInjuries: f.visibleInjuries,
          personDescription: f.personDescription,
        },
        contact: {
          method: f.method,
          value: f.method === "none" ? "" : f.value,
          safeTime: f.safeTime,
          voicemail: f.voicemail,
        },
      });
      set("narrative", result.text);
      Job(null);
      Record(null);
      I(result.provider);
      S(1);
    } catch (e) {
      E((e as Error).message);
    } finally {
      B(false);
    }
  }
  async function generate() {
    B(true);
    E("");
    try {
      // A fresh prepared record keeps each edited message and its image consistent.
      const r = await api("/requests", {
        ...f,
        details: {
          duration: f.duration,
          frequency: f.frequency,
          visibleInjuries: f.visibleInjuries,
          personDescription: f.personDescription,
        },
        contact: {
          method: f.method,
          value: f.method === "none" ? "" : f.value,
          safeTime: f.safeTime,
          voicemail: f.voicemail,
        },
        location: f.location || null,
        channel: "image",
        idempotencyKey: crypto.randomUUID(),
      });
      Record(r.id);
      Choose(0);
      Job(await api(`/requests/${r.id}/covers`, { prompt }));
    } catch (e) {
      E((e as Error).message);
    } finally {
      B(false);
    }
  }
  async function imageFile() {
    const response = await fetch(
      `/api/v1/requests/${record}/jobs/${job.id}/encode/${chosen}`,
      { method: "POST" },
    );
    if (!response.ok)
      throw Error("Unable to prepare the PNG. Please try again.");
    return new File([await response.blob()], "morning-note.png", {
      type: "image/png",
    });
  }
  async function share(platform?: string) {
    E("");
    try {
      const file = await imageFile();
      if (platform && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file] });
        I(
          "Image handed to your device’s share sheet. Delivery is not confirmed.",
        );
      } else {
        const url = URL.createObjectURL(file);
        const link = document.createElement("a");
        link.href = url;
        link.download = file.name;
        link.click();
        setTimeout(() => URL.revokeObjectURL(url), 10000);
        I(
          platform
            ? `PNG downloaded. Attach it as an original file in ${platform}; this does not publish a post.`
            : "Verified PNG downloaded.",
        );
      }
    } catch (e) {
      if ((e as Error).name !== "AbortError") E((e as Error).message);
    }
  }
  async function next() {
    E("");
    if (step === 0) {
      if (!f.original.trim()) {
        E("Please add a few words about the support you would like.");
        return;
      }
      if (f.method === "email" && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(f.value)) {
        E("Enter a valid safe email address.");
        return;
      }
      if (
        ["phone", "text"].includes(f.method) &&
        f.value.replace(/\D/g, "").length < 7
      ) {
        E("Enter a safe contact number.");
        return;
      }
      if (!f.narrative) set("narrative", f.original);
      Job(null);
      Record(null);
      S(1);
      return;
    }
    if (step === 1) {
      S(2);
      return;
    }
    B(true);
    try {
      if (mode === "direct") await api(`/requests/${record}/submit`, {});
      if (mode === "feed")
        await api(`/requests/${record}/demo-signal`, {
          jobId: job.id,
          index: chosen,
        });
      S(3);
      api("/encouragement", {
        text: "A short reassuring note about personal choice",
      })
        .then((d) => Poem(d.text))
        .catch(() =>
          Poem(`Your words matter.
Your next step belongs to you.
Take it at your own pace.`),
        );
    } catch (e) {
      E((e as Error).message);
    } finally {
      B(false);
    }
  }
  const working = busy || (job && ["queued", "running"].includes(job.status));
  return (
    <section className="page formpage post-flow">
      <div className="eyebrow">CREATE A POST · ONE STEP AT A TIME</div>
      <h1>Create a post.</h1>
      <p className="intro">
        Your words. An everyday image. A next step you choose.
      </p>
      <div className="journey-caption">
        <ShieldCheck size={18} />
        <span>01 Write your message</span>
        <ArrowRight size={14} />
        <span>02 Create an everyday image</span>
        <ArrowRight size={14} />
        <span>03 Choose how to share</span>
      </div>
      <ol className="steps">
        {[
          "Fill out the form",
          "Review and generate image",
          "Submit post",
          "Submission complete",
        ].map((label, i) => (
          <li
            key={label}
            className={i <= step ? "current" : ""}
            aria-current={i === step ? "step" : undefined}
          >
            <span>{i < step || step === 3 ? <Check size={14} /> : i + 1}</span>
            <small>{label}</small>
          </li>
        ))}
      </ol>
      <div className="panel">
        <h2 ref={title} tabIndex={-1}>
          {
            [
              "Tell us what’s happening.",
              "Review your words. Create your image.",
              "Your post is ready.",
              mode === "direct"
                ? "Post successfully submitted!"
                : mode === "feed"
                  ? "Your demo signal is queued."
                  : "Your image is ready to share.",
            ][step]
          }
        </h2>
        {step === 0 ? (
          <fieldset
            className="post-fields"
            disabled={busy}
            aria-label="Situation and safe contact"
          >
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
            <details className="optional-details" open>
              <summary>Optional situation details</summary>
              <p>
                Skip anything you do not want to share. These details are saved
                with your request for authorized responders; only the approved
                message is embedded in the PNG.
              </p>
              <div className="situation-sliders">
                <RangeField
                  label="How long has this been happening? (optional)"
                  value={f.duration}
                  max={120}
                  unit="months"
                  onChange={(v) => set("duration", v)}
                />
                <RangeField
                  label="Frequency of incidents (optional)"
                  value={f.frequency}
                  max={60}
                  unit="times per month"
                  hint="Approximate number per month."
                  onChange={(v) => set("frequency", v)}
                />
              </div>
              <Field label="Visible injuries (optional)">
                <select
                  value={f.visibleInjuries}
                  onChange={(e) => set("visibleInjuries", e.target.value)}
                >
                  <option value="not_shared">Prefer not to share</option>
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                  <option value="unsure">Unsure</option>
                </select>
              </Field>
              <Field
                label="Description of the person involved (optional)"
                hint="Include only details you choose to share, such as behavior or identifying characteristics. Similarities require human review and do not identify a person."
              >
                <textarea
                  rows={3}
                  value={f.personDescription}
                  onChange={(e) => set("personDescription", e.target.value)}
                  maxLength={2000}
                />
              </Field>
            </details>
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
          </fieldset>
        ) : step === 1 ? (
          <>
            <Field
              label="Approved message"
              hint="Review and edit this text before generating your image."
            >
              <textarea
                rows={7}
                disabled={!!working}
                value={f.narrative}
                maxLength={8000}
                onChange={(e) => {
                  set("narrative", e.target.value);
                  Job(null);
                }}
              />
            </Field>
            <div className="actions">
              <Button
                secondary
                disabled={working}
                onClick={async () => {
                  B(true);
                  E("");
                  try {
                    const d = await api("/drafts", { text: f.narrative });
                    set("narrative", d.text);
                    Job(null);
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
              <Button
                secondary
                disabled={!!working}
                onClick={() => {
                  set("narrative", f.original);
                  Job(null);
                }}
              >
                Revert to my words
              </Button>
            </div>
            <Field
              label="Image prompt"
              hint={
                ["OpenAI configured", "Gemini configured"].includes(
                  imageProvider,
                )
                  ? "The configured AI provider generates images from this prompt. Your support message is not included."
                  : DEMO
                    ? "Demo generates original illustrations locally; live mode uses the configured image provider. Only this prompt is sent to the image provider."
                    : "Only this image prompt is sent to the configured image provider."
              }
            >
              <input
                value={prompt}
                disabled={!!working}
                maxLength={500}
                onChange={(e) => Prompt(e.target.value)}
              />
            </Field>
            <div className="prompt-presets">
              {[
                "Good Morning",
                "Good Night",
                "Sunset",
                "Mountains",
                "Ocean",
              ].map((t) => (
                <button key={t} type="button" onClick={() => Prompt(t)}>
                  {t}
                </button>
              ))}
            </div>
            <Button
              disabled={working || !prompt.trim() || !f.narrative.trim()}
              onClick={generate}
            >
              {working ? "Generating images…" : "Generate Images"}
            </Button>
            {job && (
              <p role="status">
                Image generation: {job.status} · {job.progress}%
              </p>
            )}
            {job?.status === "failed" && (
              <p role="alert" className="error">
                {job.error === "image_quota_exceeded"
                  ? "AI generation quota or rate limit reached. Check the provider project billing and limits, then retry."
                  : "Image generation failed. Try again or check the image provider configuration."}
              </p>
            )}
            {job?.status === "complete" && (
              <h3 className="image-selection-heading">Select an image</h3>
            )}
            {job?.status === "complete" && (
              <div className="post-image-options">
                {job.results.map((r: any) => (
                  <button
                    key={r.index}
                    aria-pressed={chosen === r.index}
                    onClick={() => Choose(r.index)}
                  >
                    <img
                      alt={`Generated image option ${r.index + 1}`}
                      src={`/api/v1/requests/${record}/jobs/${job.id}/results/${r.index}`}
                    />
                    <span>
                      {chosen === r.index ? "Selected" : "Choose image"}{" "}
                      {r.index + 1}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </>
        ) : step === 2 ? (
          <>
            <img
              className="post-preview"
              alt="Selected generated post image"
              src={`/api/v1/requests/${record}/jobs/${job.id}/results/${chosen}`}
            />
            <div className="post-share-actions">
              {["Telegram", "Twitter", "Instagram", "Slack"].map((t) => (
                <Button key={t} secondary onClick={() => share(t)}>
                  <Upload size={16} /> Share on {t}
                </Button>
              ))}
            </div>
            <Button secondary onClick={() => share()}>
              <Download size={16} /> Download verified PNG
            </Button>
            <p className="notice">
              Sharing opens your device’s share sheet when supported, or
              downloads a file to attach yourself. Social platforms may resize
              images and destroy the embedded message. Sharing does not confirm
              receipt.
            </p>
            <Field label="Submission destination">
              <select value={mode} onChange={(e) => Mode(e.target.value)}>
                <option value="direct">
                  {DEMO
                    ? "Submit to the demo dashboard"
                    : "Submit to the organization queue"}
                </option>
                {DEMO && (
                  <option value="feed">
                    Send to monitored demo feed · #HerVoiceSignal
                  </option>
                )}
                <option value="image">
                  Keep as an image for manual sharing
                </option>
              </select>
            </Field>
            <details>
              <summary>Review the approved message</summary>
              <p>{f.narrative}</p>
            </details>
          </>
        ) : (
          <div className="post-complete">
            <div className="post-success">
              <Check size={32} />
            </div>
            <p>
              {mode === "direct"
                ? DEMO
                  ? "Saved to the practice dashboard. No real organization has been contacted."
                  : "Saved to the organization queue. Human review is not guaranteed."
                : mode === "feed"
                  ? "Your original encoded PNG is queued in the controlled #HerVoiceSignal feed. The 30-second scanner verifies and receives it into the demo dashboard. No public social account was contacted."
                  : "Prepared only. No organization or social platform has received your image."}
            </p>
            {mode === "feed" && (
              <Link className="btn" href="/responder/intake">
                Watch the signal reach the dashboard <ArrowRight size={16} />
              </Link>
            )}
            <blockquote>
              {poem || "Preparing a little encouragement…"}
            </blockquote>
            <Link className="button secondary" href={`/requests/${record}`}>
              View receipt and image
            </Link>
          </div>
        )}
        {step === 0 && (
          <div className="generate-brief">
            <div>
              <strong>Turn a few words into your message.</strong>
              <p>
                AI expands the details you supplied. You review every word
                before anything is shared.
              </p>
            </div>
            <Button disabled={busy} onClick={expandBrief}>
              {busy ? "Generating text…" : "Generate Text"}
              <ArrowRight size={16} />
            </Button>
          </div>
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
        {step < 3 && (
          <div className="formactions">
            {step > 0 ? (
              <Button secondary disabled={working} onClick={() => S(step - 1)}>
                <ArrowLeft size={16} /> Back
              </Button>
            ) : (
              <span />
            )}
            <Button
              disabled={working || (step === 1 && job?.status !== "complete")}
              onClick={next}
            >
              {busy
                ? "Saving…"
                : step === 2
                  ? mode === "direct"
                    ? "Submit post"
                    : mode === "feed"
                      ? "Send demo signal"
                      : "Finish preparing image"
                  : "Continue"}
              <ArrowRight size={16} />
            </Button>
          </div>
        )}
      </div>
      <p className="underform">
        <LockKeyhole size={14} /> Generating images saves a private prepared
        request. Draft fields stay in memory; use your receipt to manage saved
        requests.
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
  const router = useRouter();
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
                    router.push("/requests");
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
  const [liveAI, LiveAI] = useState(!DEMO);
  useEffect(() => {
    api("/health")
      .then((h) =>
        LiveAI(
          ["OpenAI configured", "Gemini configured"].includes(
            h.capabilities.chat,
          ),
        ),
      )
      .catch(() => {});
  }, []);
  const [messages, M] = useState<{ role: string; text: string }[]>([]);
  const [remember, Remember] = useState(false);
  const [verse, Verse] = useState("");
  const [text, T] = useState("");
  const [busy, B] = useState(false);
  const [error, E] = useState("");
  const [avatar, A] = useState(true);
  const [speaking, S] = useState(false);
  const [mouthShape, Mouth] = useState("");
  const [studio, Studio] = useState("");
  const [studioBusy, StudioBusy] = useState(false);
  const cues = useRef<{ start: number; end: number; value: string }[]>([]);
  const audio = useRef<HTMLAudioElement>(null);
  const mediaJob = useRef("");
  const generation = useRef(0);
  useEffect(() => {
    api("/support/memory")
      .then((d) => {
        Remember(d.enabled);
        if (d.enabled) M(d.messages);
      })
      .catch(() => {});
  }, []);
  async function toggleMemory() {
    E("");
    try {
      if (!remember) await api("/support/session", {});
      await api("/support/memory", { enabled: !remember }, "PUT");
      Remember(!remember);
    } catch (e) {
      E((e as Error).message);
    }
  }
  useEffect(() => {
    function stop() {
      generation.current++;
      window.speechSynthesis?.cancel();
      audio.current?.pause();
      if (mediaJob.current)
        void api(
          "/support/media/" + mediaJob.current,
          undefined,
          "DELETE",
        ).catch(() => {});
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
  async function studioVoice() {
    const last = [...messages].reverse().find((m) => m.role === "assistant");
    if (!last || studioBusy) return;
    StudioBusy(true);
    E("");
    const g = generation.current;
    try {
      await api("/support/session", {});
      const job = await api("/support/media", { text: last.text });
      mediaJob.current = job.id;
      let state = job;
      for (
        let attempt = 0;
        attempt < 60 && state.status !== "complete";
        attempt++
      ) {
        if (g !== generation.current) return;
        if (["failed", "canceled"].includes(state.status))
          throw Error(
            "Studio voice is unavailable. Use Read latest reply for browser speech.",
          );
        await new Promise((resolve) => setTimeout(resolve, 1000));
        state = await api("/support/media/" + job.id);
      }
      if (state.status !== "complete")
        throw Error("Voice generation timed out. Text remains available.");
      if (g !== generation.current) return;
      const timing = await api("/support/media/" + job.id + "/results/1");
      cues.current = timing.mouthCues || [];
      Studio("/api/v1/support/media/" + job.id + "/results/0");
    } catch (e) {
      if (g === generation.current) E((e as Error).message);
    } finally {
      if (g === generation.current) StudioBusy(false);
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
      <div className="eyebrow">THERAPY BOT · A LITTLE SPACE TO BE HEARD</div>
      <h1>Let’s talk things through.</h1>
      <p className="intro">No perfect words needed. Start wherever you are.</p>
      <div className="chatbar">
        <span className="avatarSmall">
          <Leaf size={20} />
        </span>
        <div>
          <strong>Your support space</strong>
          <small>
            AI {liveAI ? "" : "demo "}companion · not a therapist or emergency
            service
          </small>
        </div>
        <Badge>{remember ? "24-hour memory on" : "Memory off"}</Badge>
      </div>
      <div className={"therapy-scene" + (avatar ? " with-avatar" : "")}>
        <div className="chatbody" aria-live="polite">
          {!messages.length && (
            <div className="welcome">
              <span className="iconbox">
                <MessageCircle size={28} />
              </span>
              <h2>I’m here to listen.</h2>
              <p>
                You can share what’s on your mind, or start with a small
                question.
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
                  : !liveAI
                    ? "HerVoice · Demo response"
                    : "HerVoice · AI response"}
              </small>
              <p>{m.text}</p>
            </div>
          ))}
          {busy && (
            <p>
              {liveAI ? "Preparing a reply…" : "Preparing a demo response…"}
            </p>
          )}
        </div>
        {avatar && <Companion speaking={speaking} mouthShape={mouthShape} />}
      </div>
      {studio && (
        <div className="panel">
          <p>AI-generated voice · captions are in the conversation above.</p>
          <audio
            ref={audio}
            controls
            src={studio}
            onPlay={() => S(true)}
            onPause={() => {
              S(false);
              Mouth("X");
            }}
            onEnded={() => {
              S(false);
              Mouth("X");
            }}
            onTimeUpdate={(e) => {
              const t = e.currentTarget.currentTime;
              Mouth(
                cues.current.find((c) => c.start <= t && c.end > t)?.value ||
                  "",
              );
            }}
          />
        </div>
      )}
      {verse && (
        <div className="panel" aria-live="polite">
          <h2>A few words for this moment</h2>
          <p style={{ whiteSpace: "pre-line" }}>{verse}</p>
          <small>Encouragement, not a promise of assistance.</small>
        </div>
      )}
      <div className="chattools">
        <Button
          secondary
          disabled={busy}
          onClick={async () => {
            B(true);
            E("");
            try {
              const d = await api("/encouragement", {
                text: text.trim() || "A quiet moment of encouragement",
              });
              Verse(d.text);
            } catch (e) {
              E((e as Error).message);
            } finally {
              B(false);
            }
          }}
        >
          A few words of encouragement
        </Button>
        <Button
          secondary
          disabled={!messages.some((m) => m.role === "assistant") || studioBusy}
          onClick={studioVoice}
        >
          {studioBusy ? "Generating studio voice…" : "Generate AI voice"}
        </Button>
        <Button secondary onClick={toggleMemory}>
          {remember
            ? "Turn off & delete saved memory"
            : "Allow 24-hour conversation memory"}
        </Button>
        <Button secondary onClick={() => A(!avatar)}>
          {avatar ? "Text only" : "Show Maya"}
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
            void api("/support/memory", undefined, "DELETE").catch(() =>
              E("Could not delete saved memory. Please retry."),
            );
            Remember(false);
            M([]);
            Verse("");
            B(false);
            StudioBusy(false);
            Studio("");
            audio.current?.pause();
            Mouth("");
            if (mediaJob.current)
              void api(
                "/support/media/" + mediaJob.current,
                undefined,
                "DELETE",
              ).catch(() => {});
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
        <LockKeyhole size={13} />{" "}
        {remember
          ? "You allowed encrypted storage for 24 hours after your latest message. Turning memory off deletes the saved conversation."
          : "Memory is off. Messages remain in this page until you leave. You can optionally allow encrypted 24-hour memory."}{" "}
        Conversations are not shared with responders.
      </p>
    </section>
  );
}
function Rights() {
  const [q, Q] = useState("");
  const [questions, Questions] = useState<string[]>([]);
  const [j, J] = useState("United States");
  const [state, SetState] = useState("");
  const [answer, A] = useState<any>(null);
  const [busy, B] = useState(false);
  const [error, E] = useState("");
  return (
    <section className="page formpage">
      <div className="eyebrow">LAW BOT · KNOW YOUR RIGHTS</div>
      <h1>Clarity is a place to start.</h1>
      <p className="intro">
        Explore official sources about your options. This demo does not provide
        legal advice.
      </p>
      <div className="panel">
        <Field label="Jurisdiction">
          <select
            value={j}
            onChange={(e) => {
              J(e.target.value);
              Questions([]);
              A(null);
            }}
          >
            <option>United States</option>
            <option>Other</option>
          </select>
        </Field>
        {j === "United States" && (
          <Field
            label="State or territory (optional)"
            hint="National information is available without a location. State laws vary; coverage is limited to the sources shown."
          >
            <select
              value={state}
              onChange={(e) => {
                SetState(e.target.value);
                Questions([]);
                A(null);
              }}
            >
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
                  previousQuestions: questions.slice(-4),
                }),
              );
              Questions([...questions, q].slice(-4));
              Q("");
            } catch (e) {
              E((e as Error).message);
            } finally {
              B(false);
            }
          }}
        >
          {questions.length > 0 && (
            <p className="notice">
              You can ask a follow-up. Your last {questions.length} question
              {questions.length === 1 ? "" : "s"} in this jurisdiction provide
              context.{" "}
              <button
                type="button"
                className="textbtn"
                onClick={() => {
                  Questions([]);
                  A(null);
                }}
              >
                Start a new topic
              </button>
            </p>
          )}
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
          "Returning to reading",
          "Everyday Notes is the default public view and browser-tab title. Personal space opens HerVoice tools. Back to reading, pressing Escape twice, switching tabs, or restoring a page from browser history covers the tools, stops playback, and clears unsaved page state. Reloading also returns to reading. This cannot erase browser history, network records, downloads, screenshots, cookies, saved requests, consented chat memory, or monitoring software traces. The website address itself can still identify the service; choose a neutral deployment domain.",
        ],
        [
          "Drafts and conversations",
          "Request drafts stay in page memory and are cleared when the tools close. Chat is not retained by default. You may explicitly enable encrypted conversation memory for 24 hours after your latest message; turning memory off deletes it. Returning to reading does not delete previously saved requests or consented memory. Live AI services receive submitted text when configured.",
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
    let active = true;
    async function openWorkspace() {
      try {
        let session;
        try {
          session = await api("/me");
        } catch (e) {
          if (!DEMO) throw e;
          await api("/demo/session", { organization: "demo-a" });
          session = await api("/me");
        }
        if (active) M(session);
      } catch (e) {
        if (active) E((e as Error).message);
      }
    }
    void openWorkspace();
    return () => {
      active = false;
    };
  }, []);
  return (
    <div className="staffshell">
      <aside>
        <div className="eyebrow">RESPONDER WORKSPACE</div>
        {[
          ["/responder", "Overview", LayoutDashboard],
          ["/responder/cases", "Cases", FolderOpen],
          ["/responder/intake", "Signals & image intake", Upload],
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
  const [columns, Columns] = useState([
    "Location",
    "Severity",
    "Issue",
    "Status",
  ]);
  const rank = (c: Case) =>
    (({ critical: 4, high: 3, medium: 2, low: 1 }) as Record<string, number>)[
      c.severity || ""
    ] || (c.priority === "high" ? 3 : 1);
  const [descending, Descending] = useState(true);
  const [copied, Copied] = useState("");
  const visible = (name: string) => columns.includes(name);
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
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, [q, status, priority, page]);
  return (
    <>
      <div className="eyebrow">PRACTICE CENTER · PRIVATE WORKSPACE</div>
      <div className="sectionHeading">
        <div>
          <h1>{overview ? "Live dashboard" : "Support requests"}</h1>
          <div className="live-label">
            <span /> Live Updates
          </div>
          <p>
            {overview
              ? "New posts and case changes refresh automatically every 5 seconds."
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
            <strong>5 sec</strong>
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
        <div className="queue-toolbar">
          <p role="status">{copied}</p>
          <details className="column-picker">
            <summary>Columns</summary>
            {["Location", "Severity", "Issue", "Status"].map((name) => (
              <label key={name}>
                <input
                  type="checkbox"
                  checked={visible(name)}
                  onChange={() =>
                    Columns((values) =>
                      visible(name)
                        ? values.filter((v) => v !== name)
                        : [...values, name],
                    )
                  }
                />
                {name}
              </label>
            ))}
          </details>
        </div>
        <div className="tablewrap live-table">
          <table>
            <thead>
              <tr>
                <th>S.No</th>
                <th>Name</th>
                {visible("Location") && <th>Location</th>}
                {visible("Severity") && (
                  <th>
                    <button
                      className="sort-priority"
                      onClick={() => Descending(!descending)}
                    >
                      Severity {descending ? "↓" : "↑"}
                    </button>
                  </th>
                )}
                {visible("Issue") && <th>Issue</th>}
                {visible("Status") && <th>Status</th>}
                <th>
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {[...(data?.items || [])]
                .sort(
                  (a: Case, b: Case) =>
                    (rank(b) - rank(a)) * (descending ? 1 : -1),
                )
                .map((c: Case, index: number) => (
                  <tr key={c.id}>
                    <td>{(page - 1) * 6 + index + 1}</td>
                    <td>
                      <Link href={"/responder/cases/" + c.id}>
                        <strong>{c.alias || "Guest request"}</strong>
                        <small>{c.id.slice(0, 8)}</small>
                      </Link>
                    </td>
                    {visible("Location") && (
                      <td>{c.location || "Not shared"}</td>
                    )}
                    {visible("Severity") && (
                      <td>
                        <span
                          className={
                            "severity-pill " +
                            (c.priority === "high" ? "high" : "normal")
                          }
                        >
                          {c.severity && c.severity !== "unreviewed"
                            ? c.severity === "critical"
                              ? "Very high"
                              : c.severity
                            : c.priority === "high"
                              ? "High · reported"
                              : "Not reviewed"}
                        </span>
                      </td>
                    )}
                    {visible("Issue") && <td>{c.category}</td>}
                    {visible("Status") && (
                      <td>
                        <Badge>{c.status.replaceAll("_", " ")}</Badge>
                      </td>
                    )}
                    <td>
                      <details className="row-actions">
                        <summary
                          aria-label={"Actions for " + (c.alias || "request")}
                        >
                          •••
                        </summary>
                        <div>
                          <strong>Actions</strong>
                          <button
                            onClick={async () => {
                              try {
                                await navigator.clipboard.writeText(c.id);
                                Copied("Request ID copied.");
                              } catch {
                                Copied("Unable to copy. Request ID: " + c.id);
                              }
                            }}
                          >
                            Copy ID
                          </button>
                          <Link
                            aria-label={"Open " + (c.alias || "request")}
                            href={"/responder/cases/" + c.id}
                          >
                            View Details
                          </Link>
                        </div>
                      </details>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
        <small>
          Severity is responder-reviewed when available; otherwise the person’s
          selected urgency is shown. AI suggestions require review.
        </small>
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
  const matches = useRef<HTMLDialogElement>(null);
  const [c, C] = useState<Case | null>(null);
  const [error, E] = useState("");
  const [note, N] = useState("");
  const [reason, R] = useState("");
  const [assignment, A] = useState("");
  const [status, S] = useState("");
  const [severity, Severity] = useState("unreviewed");
  const [priority, Priority] = useState("normal");
  const [related, D] = useState<any[]>([]);
  const [matchingBusy, MatchingBusy] = useState(false);
  const [searched, Searched] = useState(false);
  const [analysis, Analysis] = useState<any>(null);
  const [matchLimit, MatchLimit] = useState(4);
  const [matchThreshold, MatchThreshold] = useState(0.08);
  const [info, I] = useState("");
  useEffect(() => {
    api("/cases/" + id)
      .then((d) => {
        C(d);
        Analysis(d.analysis || null);
        S(d.status);
        Priority(d.priority);
        Severity(d.severity || "unreviewed");
        A(d.assignment);
      })
      .catch((e) => E(e.message));
  }, [id]);
  async function findRelated() {
    MatchingBusy(true);
    E("");
    try {
      D(
        await api("/cases/" + id + "/related", {
          limit: matchLimit,
          threshold: matchThreshold,
        }),
      );
      Searched(true);
    } catch (e) {
      E((e as Error).message);
    } finally {
      MatchingBusy(false);
    }
  }
  async function update() {
    try {
      const d = await api(
        "/cases/" + id,
        {
          version: c!.version,
          status,
          priority,
          severity,
          assignment,
          note,
          reason,
        },
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
          <div className="sectionHeading">
            <h1>{c.alias || "Guest request"}</h1>
            <div className="actions">
              <Button
                secondary
                onClick={() => {
                  matches.current?.showModal();
                  void findRelated();
                }}
              >
                Find Match
              </Button>
              <Button
                onClick={() => {
                  S("closed");
                  document
                    .getElementById("manage-case")
                    ?.scrollIntoView({ behavior: "smooth" });
                }}
              >
                Close Issue
              </Button>
            </div>
          </div>
          <div className="chips">
            <Badge>{c.status}</Badge>
            <Badge>
              {c.priority} priority · {c.urgent ? "person reported" : "default"}
            </Badge>
          </div>
          <div className="case-summary-grid">
            <article className="panel">
              <Phone size={20} />
              <h2>Preferred way of contact</h2>
              <p>
                {c.contact.method === "none"
                  ? "Do not contact"
                  : c.contact.method}
              </p>
              {c.contact.method !== "none" && (
                <p>{c.contact.value || "Not provided"}</p>
              )}
              <small>Safe time: {c.contact.safeTime || "Not shared"}</small>
            </article>
            <article className="panel">
              <RefreshCw size={20} />
              <h2>Frequency and duration</h2>
              <p>{c.details?.frequency || "Frequency not shared"}</p>
              <p>{c.details?.duration || "Duration not shared"}</p>
            </article>
            <article className="panel">
              <ShieldCheck size={20} />
              <h2>Nature of the situation</h2>
              <p>
                {analysis?.nature?.length
                  ? analysis.nature.join(" · ")
                  : c.category}
              </p>
              <span
                className={"severity-pill " + (c.urgent ? "high" : "normal")}
              >
                {c.urgent ? "Immediate danger reported" : "No urgency selected"}
              </span>
            </article>
            <article className="panel">
              <Search size={20} />
              <h2>Person description</h2>
              <p>{c.details?.personDescription || "Not shared"}</p>
              <small>Reported description; identity is not verified.</small>
            </article>
            <article className="panel">
              <FolderOpen size={20} />
              <h2>Location</h2>
              <p>{c.location || "Not shared"}</p>
              {c.location && (
                <a
                  href={
                    "https://www.google.com/maps/search/?api=1&query=" +
                    encodeURIComponent(c.location)
                  }
                  target="_blank"
                  rel="noreferrer"
                >
                  Open location in Google Maps ↗
                </a>
              )}
              <small>External map opens only when selected.</small>
            </article>
            <article className="panel">
              <LayoutDashboard size={20} />
              <h2>Current Status</h2>
              <p>{c.status.replaceAll("_", " ")}</p>
              <p>{c.assignment || "No responder assigned"}</p>
              <small>Updated {date(c.updated || c.created)}</small>
            </article>
          </div>
          <dialog
            ref={matches}
            className="match-dialog"
            aria-labelledby="match-title"
            onClick={(e) => {
              if (e.target === e.currentTarget) matches.current?.close();
            }}
          >
            <div className="sectionHeading">
              <div>
                <div className="eyebrow">COMPARE REPORTED DETAILS</div>
                <h2 id="match-title">Related report information</h2>
              </div>
              <Button secondary onClick={() => matches.current?.close()}>
                Close
              </Button>
            </div>{" "}
            <div className="panel">
              <h2>Related reports</h2>
              <Field label="Maximum related reports">
                <select
                  value={matchLimit}
                  onChange={(e) => MatchLimit(Number(e.target.value))}
                >
                  {[4, 8, 12, 20].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Minimum cosine similarity">
                <select
                  value={matchThreshold}
                  onChange={(e) => MatchThreshold(Number(e.target.value))}
                >
                  {[0.08, 0.25, 0.5, 0.75, 0.9].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </Field>
              <p>
                Cosine similarity compares the optional person description, or
                the reviewed narrative when no description is supplied. Results
                support human review; they do not establish identity or a shared
                incident.
              </p>
              <Button secondary disabled={matchingBusy} onClick={findRelated}>
                {matchingBusy
                  ? "Finding related reports…"
                  : "Find related reports"}
              </Button>
              {error && (
                <p className="error" role="alert">
                  {error}
                </p>
              )}
              {matchingBusy && (
                <p role="status">
                  Comparing reported details with stored reports…
                </p>
              )}
              {searched && !matchingBusy && related.length === 0 && (
                <p>No reports met this similarity threshold.</p>
              )}
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
                          const why = prompt("Reason for this review decision");
                          if (why)
                            try {
                              await api("/cases/" + id + "/related/decision", {
                                target: r.id,
                                decision,
                                reason: why,
                              });
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
          </dialog>
          <div className="detailgrid">
            <div>
              <div className="panel">
                <h2>Their words</h2>
                <p className="narrative">{c.narrative}</p>
                <Button
                  secondary
                  onClick={() =>
                    api("/cases/" + id + "/analysis", {})
                      .then((result) => {
                        Analysis(result);
                        return api("/cases/" + id).then(C);
                      })
                      .catch((e) => E(e.message))
                  }
                >
                  Analyze intake
                </Button>
                {analysis && (
                  <div className="analysis-panel">
                    <h3>Structured intake · review required</h3>
                    <p>{analysis.summary}</p>
                    {analysis.nature && (
                      <p>
                        <strong>Reported nature:</strong>{" "}
                        {analysis.nature.join(" · ") || "Unspecified"}
                      </p>
                    )}
                    {analysis.severity && (
                      <p>
                        <Badge>AI review suggestion: {analysis.severity}</Badge>
                        <br />
                        {analysis.reasoning}
                      </p>
                    )}
                    <p className="notice">
                      This summary is advisory. Queue priority and case
                      decisions remain with the responder.
                    </p>
                    <p>
                      Location: {analysis.location} · {analysis.urgency}
                    </p>
                    <p>
                      {analysis.reviewFlags.length
                        ? analysis.reviewFlags.join(" · ")
                        : "No keyword review flags. This does not establish safety."}
                    </p>
                    {analysis.details && (
                      <dl>
                        {Object.entries(analysis.details).map(
                          ([key, value]) => (
                            <div key={key}>
                              <dt>
                                {(
                                  {
                                    duration: "Duration",
                                    frequency: "Frequency",
                                    visibleInjuries: "Visible injuries",
                                    personDescription: "Person description",
                                  } as Record<string, string>
                                )[key] || key}
                              </dt>
                              <dd>
                                {!value || value === "not_shared"
                                  ? "Not shared"
                                  : String(value)}
                              </dd>
                            </div>
                          ),
                        )}
                      </dl>
                    )}
                    <small>{analysis.method}</small>
                  </div>
                )}
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
            </div>
            <div>
              <div className="panel">
                <h2 id="manage-case" tabIndex={-1}>
                  Manage case
                </h2>
                <Field label="Status">
                  <select value={status} onChange={(e) => S(e.target.value)}>
                    {["received", "in_review", "closed"].map((x) => (
                      <option key={x}>{x}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Reviewed severity">
                  <select
                    value={severity}
                    onChange={(e) => Severity(e.target.value)}
                  >
                    {["unreviewed", "low", "medium", "high", "critical"].map(
                      (v) => (
                        <option key={v} value={v}>
                          {v === "critical" ? "Very high" : v}
                        </option>
                      ),
                    )}
                  </select>
                </Field>
                <Field label="Responder priority">
                  <select
                    value={priority}
                    onChange={(e) => Priority(e.target.value)}
                  >
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
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
                <h2>Recent Activities</h2>
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
function FeedMonitor() {
  const [data, Data] = useState<any>(null);
  const [error, ErrorText] = useState("");
  const [upload, UploadFile] = useState<File | null>(null);
  const [busy, Busy] = useState(false);
  async function refresh() {
    try {
      Data(await api("/monitor/feed"));
    } catch (e) {
      ErrorText((e as Error).message);
    }
  }
  useEffect(() => {
    void refresh();
    const timer = setInterval(refresh, 10000);
    return () => clearInterval(timer);
  }, []);
  if (!DEMO)
    return (
      <div className="panel monitor-panel">
        <h2>Permitted image-feed monitoring</h2>
        <p>
          Your operator can configure a permitted HTTPS feed for #HerVoiceSignal
          original PNGs. The scheduler checks configured feeds every 30 seconds.
          HerVoice does not log into social accounts.
        </p>
        <p>{data?.items.length || 0} recent feed items</p>
        {error && <p role="alert">{error}</p>}
      </div>
    );
  return (
    <div className="panel monitor-panel">
      <div className="eyebrow">SIGNAL → VERIFIED CASE</div>
      <h2>Image monitoring lab</h2>
      <p>
        Queue an original encoded PNG in the controlled{" "}
        <strong>#HerVoiceSignal</strong> demo feed. The monitor scans every 30
        seconds, verifies the message, and receives the matching request. No
        social network is connected.
      </p>
      <Field label="PNG for demo feed">
        <input
          type="file"
          accept="image/png"
          onChange={(e) => UploadFile(e.target.files?.[0] || null)}
        />
      </Field>
      <div className="chattools">
        <Button
          disabled={!upload || busy}
          onClick={async () => {
            Busy(true);
            ErrorText("");
            try {
              const form = new FormData();
              form.append("file", upload!);
              const r = await fetch("/api/v1/monitor/feed", {
                method: "POST",
                body: form,
              });
              if (!r.ok)
                throw Error(
                  "Could not queue image. Use an original PNG under 8 MB.",
                );
              await refresh();
            } catch (e) {
              ErrorText((e as Error).message);
            } finally {
              Busy(false);
            }
          }}
        >
          Queue demo signal
        </Button>
        <Button
          secondary
          disabled={busy}
          onClick={async () => {
            Busy(true);
            try {
              await api("/monitor/scan", {});
              await refresh();
            } catch (e) {
              ErrorText((e as Error).message);
            } finally {
              Busy(false);
            }
          }}
        >
          Scan now
        </Button>
      </div>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <div aria-live="polite">
        {data?.items.map((item: any) => (
          <div className="event" key={item.id}>
            <span className="dot" />
            <div>
              <strong>
                {item.status === "verified"
                  ? "PNG verified · request received"
                  : item.status === "rejected"
                    ? "Image rejected · no request received"
                    : "Queued · awaiting scan"}
              </strong>
              <p>{date(item.created)}</p>
              {item.case_id && (
                <Link href={"/responder/cases/" + item.case_id}>
                  Open verified case <ArrowUpRight size={14} />
                </Link>
              )}
            </div>
          </div>
        ))}
        {data && !data.items.length && (
          <p>
            No signals queued yet. Start with an encoded PNG from a practice
            request.
          </p>
        )}
      </div>
    </div>
  );
}
function Intake() {
  const router = useRouter();
  const [file, F] = useState<File | null>(null);
  const [preview, P] = useState<any>(null);
  const [error, E] = useState("");
  const [busy, B] = useState(false);
  return (
    <>
      <FeedMonitor />
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
                router.push("/responder/cases/" + preview.id);
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
