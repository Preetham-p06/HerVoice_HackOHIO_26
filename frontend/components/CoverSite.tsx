"use client";
import { useDiscreetSession } from "./DiscreetSession";
import { useEffect, useRef, useState } from "react";
import {
  Music,
  ArrowUpRight,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Leaf,
  Search,
  X,
} from "lucide-react";
const stories = [
  {
    id: "windowsill",
    category: "At home",
    title: "A little green goes a long way.",
    subtitle: "Small ideas for a brighter windowsill.",
    time: "3 min read",
    art: "plant",
    paragraphs: [
      "A windowsill can be a small place to notice the changing day. Start with a clear surface, a favorite pot, and a plant suited to the light you have.",
      "Look at how sunlight moves across the room before choosing a spot. Keep a little space around each pot so leaves have room to grow. A saucer underneath helps keep the surface tidy.",
      "You do not need to fill every corner. One green detail beside a book or a cup can be enough. Let the arrangement change as you find what you enjoy.",
    ],
  },
  {
    id: "table",
    category: "Everyday rituals",
    title: "Make room for a slower morning.",
    subtitle: "An ordinary table, a few thoughtful details.",
    time: "2 min read",
    art: "cup",
    paragraphs: [
      "A slower morning can begin with something ordinary: putting a cup on the table, opening the curtains, or sitting down for a moment before starting the day.",
      "Keep the things you reach for together. A tray for a mug, a spoon, and a small napkin can make a familiar corner feel intentional without adding more to do.",
      "There is no perfect routine to follow. Choose one detail you like and leave the rest flexible. Some mornings will be busy; the table will still be there another day.",
    ],
  },
  {
    id: "outside",
    category: "Out & about",
    title: "Look a little closer.",
    subtitle: "Finding new details on a familiar walk.",
    time: "4 min read",
    art: "landscape",
    paragraphs: [
      "A familiar route can look different when you notice its smaller details. The shape of a tree, a painted doorway, or the pattern of shadows can give you something new to see.",
      "Choose a route you already know and enjoy, and dress for the weather. You might notice colors one day and textures another. There is no need to track a distance or make it a project.",
      "If you prefer staying inside, the view from a window works too. Watching light move over the same small scene is its own way of paying attention.",
    ],
  },
  {
    id: "notebook",
    category: "Small projects",
    title: "A page for the little things.",
    subtitle: "A simple notebook, with no rules to follow.",
    time: "3 min read",
    art: "notebook",
    paragraphs: [
      "A notebook can hold whatever catches your attention: a color combination, an idea for a room, or a few words from your day. It does not need to be neat or complete.",
      "Try starting with a date and one thing you noticed. Add a sketch, a short list, or a piece of paper you like. Blank space can be part of the page.",
      "Keep it somewhere convenient. The point is to have a place for small thoughts when you want one, rather than another task to keep up with.",
    ],
  },
];
const editions = [
  {
    name: "notes",
    kicker: "GOOD THINGS, CLOSE TO HOME",
    heading: "More joy in",
    ending: "the little things.",
    latest: "THE LATEST NOTES",
    note: "No grand plans needed.",
    noteEnd: "Start with something small.",
    stories,
  },
  {
    name: "music",
    kicker: "A SOUNDTRACK FOR THE EVERYDAY",
    heading: "Good music.",
    ending: "A little discovery.",
    latest: "LISTENING NOTES",
    note: "Put on something familiar.",
    noteEnd: "Leave room for something new.",
    stories: [
      {
        id: "slow-sounds",
        category: "Listening",
        title: "A softer start to the day.",
        subtitle: "Making a little room for music in the morning.",
        time: "3 min read",
        art: "record",
        paragraphs: [
          "A morning playlist can be as simple as three songs you enjoy. Start with something familiar and let the next track surprise you.",
          "Keep the volume comfortable and choose a moment when listening fits your day. Instrumental music, a favorite singer, or a quiet acoustic recording can each bring a different feeling.",
          "You do not need a perfect playlist. Add a song when it catches your ear, and let your collection grow slowly.",
        ],
      },
      {
        id: "records",
        category: "Collections",
        title: "The pleasure of a whole album.",
        subtitle: "Letting a record tell its story, one track at a time.",
        time: "4 min read",
        art: "record",
        paragraphs: [
          "An album offers a sequence chosen by the artist. Try listening from the first track to the last and noticing how the mood changes.",
          "Look at the artwork and read the liner notes if they are available. The musicians, recording places, and production details can be part of the discovery.",
          "Return to a favorite track afterward. Sometimes the songs you notice on a second listen are different from the first.",
        ],
      },
      {
        id: "new-artists",
        category: "Discovery",
        title: "Follow a familiar sound somewhere new.",
        subtitle: "Small ways to discover your next favorite artist.",
        time: "3 min read",
        art: "headphones",
        paragraphs: [
          "Start with a musician you already enjoy. Look for a collaborator, an opening act, or an artist they mention as an influence.",
          "Try one song rather than a long list. Notice the instruments, the rhythm, or the way a voice sits in the recording.",
          "Keep a short listening list for another day. Finding music is more enjoyable when it feels like exploration rather than homework.",
        ],
      },
      {
        id: "listening-corner",
        category: "At home",
        title: "Make a little listening corner.",
        subtitle: "A comfortable chair and a favorite record.",
        time: "2 min read",
        art: "headphones",
        paragraphs: [
          "A listening corner needs very little: somewhere comfortable to sit and a way to play music at a pleasant volume.",
          "Place a record sleeve or a notebook nearby if you like reading about what you hear. Keep cables tidy and leave room to move.",
          "Let the space stay simple. The music can provide the detail.",
        ],
      },
    ],
  },
  {
    name: "books",
    kicker: "ONE GOOD PAGE AT A TIME",
    heading: "Small moments.",
    ending: "Good books.",
    latest: "FROM THE BOOKSHELF",
    note: "You don’t need to finish a chapter.",
    noteEnd: "A page is a lovely place to start.",
    stories: [
      {
        id: "reading-ritual",
        category: "Reading life",
        title: "A few pages, just for you.",
        subtitle: "Finding a reading rhythm that fits an ordinary day.",
        time: "3 min read",
        art: "books",
        paragraphs: [
          "Reading does not need a long stretch of uninterrupted time. A few pages with a cup of tea can be a satisfying part of the day.",
          "Keep a book where you naturally pause. Choose a comfortable size and a story you actually want to return to.",
          "There is no required pace. Some days are for a chapter and others are for a single paragraph.",
        ],
      },
      {
        id: "bookshop",
        category: "Discovery",
        title: "Browse without a reading list.",
        subtitle: "Let a cover, a first line, or a curious title lead you.",
        time: "4 min read",
        art: "books",
        paragraphs: [
          "A library shelf or bookshop display can introduce you to something you would not have searched for.",
          "Read the first page and see whether the voice catches your attention. Try a different shelf or an unfamiliar subject.",
          "You can leave with one title, a short list, or simply an idea for next time.",
        ],
      },
      {
        id: "bookmark",
        category: "Small projects",
        title: "A place to save your page.",
        subtitle: "Simple bookmarks from paper you already have.",
        time: "2 min read",
        art: "notebook",
        paragraphs: [
          "A bookmark can be a postcard, a strip of sturdy paper, or a small sketch. Choose something thin enough to sit comfortably between pages.",
          "Add a date or a line you enjoyed if you wish. Leave fragile photographs and bulky objects outside the book.",
          "It is a small project with a useful purpose: keeping your place until you return.",
        ],
      },
      {
        id: "shelf",
        category: "At home",
        title: "Give your favorites a little space.",
        subtitle: "A bookshelf arranged for browsing, not perfection.",
        time: "3 min read",
        art: "books",
        paragraphs: [
          "Keep the books you reach for on an accessible shelf. A little space around them makes choosing the next one easier.",
          "Arrange by topic, author, color, or whatever helps you find things. Keep books out of direct damp and strong sunlight.",
          "A shelf can change as your reading changes. There is no single right order.",
        ],
      },
    ],
  },
];
function Illustration({ kind }: { kind: string }) {
  return (
    <svg
      viewBox="0 0 600 470"
      role="img"
      aria-label={
        kind === "record"
          ? "Original illustration of a record player"
          : kind === "headphones"
            ? "Original illustration of headphones"
            : kind === "books"
              ? "Original illustration of a stack of books"
              : kind === "plant"
                ? "Original illustration of a potted plant beside a window"
                : kind === "cup"
                  ? "Original illustration of a cup on a table"
                  : kind === "notebook"
                    ? "Original illustration of an open notebook"
                    : "Original illustration of hills and a sunny sky"
      }
    >
      <rect
        width="600"
        height="470"
        fill={kind === "landscape" ? "#d8e6df" : "#e9dfce"}
      />
      {kind === "record" ? (
        <>
          <rect
            x="80"
            y="130"
            width="440"
            height="270"
            rx="22"
            fill="#a86f51"
          />
          <rect
            x="100"
            y="148"
            width="400"
            height="230"
            rx="12"
            fill="#dfcbb0"
          />
          <circle cx="270" cy="260" r="102" fill="#293e3d" />
          {[82, 68, 54].map((r) => (
            <circle
              key={r}
              cx="270"
              cy="260"
              r={r}
              fill="none"
              stroke="#546864"
              strokeWidth="2"
            />
          ))}
          <circle cx="270" cy="260" r="31" fill="#c58b5b" />
          <path
            d="M445 190v80l-55 55"
            stroke="#536862"
            strokeWidth="12"
            fill="none"
            strokeLinecap="round"
          />
          <circle cx="445" cy="185" r="17" fill="#f3ead8" />
        </>
      ) : kind === "headphones" ? (
        <>
          <circle cx="300" cy="245" r="180" fill="#d5ddcf" />
          <path
            d="M175 280v-65a125 125 0 0 1 250 0v65"
            stroke="#36564c"
            strokeWidth="28"
            fill="none"
          />
          <rect
            x="143"
            y="240"
            width="75"
            height="130"
            rx="30"
            fill="#af7453"
          />
          <rect
            x="382"
            y="240"
            width="75"
            height="130"
            rx="30"
            fill="#af7453"
          />
          <path
            d="M420 365q0 60-100 60"
            stroke="#36564c"
            strokeWidth="6"
            fill="none"
          />
        </>
      ) : kind === "books" ? (
        <>
          <circle cx="320" cy="220" r="170" fill="#e4cba7" />
          <rect x="105" y="350" width="390" height="55" rx="9" fill="#45695a" />
          <rect x="125" y="359" width="350" height="32" fill="#f5ead5" />
          <rect x="135" y="290" width="340" height="58" rx="8" fill="#ad6f53" />
          <rect x="150" y="300" width="310" height="32" fill="#f5ead5" />
          <path
            d="M160 275V110q75-35 140 5 65-40 140-5v165q-75-25-140 10-65-35-140-10Z"
            fill="#fff7e5"
            stroke="#8e785b"
            strokeWidth="4"
          />
          <path
            d="M300 115v170M180 140l95 10m-95 20 95 10m50-30 95-10m-95 40 95-10"
            stroke="#c9b99d"
            strokeWidth="3"
          />
        </>
      ) : kind === "plant" ? (
        <>
          <rect
            x="345"
            y="40"
            width="210"
            height="310"
            rx="100"
            fill="#f6edda"
          />
          <path d="M450 40v310M345 180h210" stroke="#d0c4aa" strokeWidth="10" />
          <ellipse cx="290" cy="425" rx="190" ry="20" fill="#c9bca6" />
          <path
            d="M245 350q-15-140 50-225M300 350q70-120 20-220M280 350q-65-90-110-90"
            fill="none"
            stroke="#385848"
            strokeWidth="8"
          />
          {[
            [285, 150, -30],
            [335, 180, 35],
            [245, 240, -40],
            [330, 275, 35],
            [195, 275, -50],
          ].map(([x, y, r], i) => (
            <ellipse
              key={i}
              cx={x}
              cy={y}
              rx="25"
              ry="62"
              transform={`rotate(${r} ${x} ${y})`}
              fill={i % 2 ? "#71866b" : "#425f4a"}
            />
          ))}
          <path d="M200 340h150l-22 90H222Z" fill="#b56e4f" />
          <path d="M195 340h160v17H195" fill="#ca8460" />
        </>
      ) : kind === "cup" ? (
        <>
          <rect y="320" width="600" height="150" fill="#b9c2ac" />
          <ellipse cx="300" cy="355" rx="170" ry="30" fill="#e7e4d7" />
          <path
            d="M390 205h35q65 5 38 85-20 35-65 15"
            fill="none"
            stroke="#fcf5e7"
            strokeWidth="24"
          />
          <path d="M165 200h240v90q0 75-120 75t-120-75Z" fill="#fcf5e7" />
          <ellipse cx="285" cy="200" rx="120" ry="32" fill="#d7c5a9" />
          <ellipse cx="285" cy="204" rx="103" ry="23" fill="#775a41" />
          <path
            d="M235 65q-32 32 0 65M305 50q-32 32 0 65"
            fill="none"
            stroke="#c3b59d"
            strokeWidth="5"
            strokeLinecap="round"
          />
        </>
      ) : kind === "landscape" ? (
        <>
          <circle cx="450" cy="100" r="45" fill="#e5b766" />
          <path d="M0 300Q120 120 300 300T600 250V470H0Z" fill="#859d7c" />
          <path d="M0 370Q170 200 360 350T600 315V470H0Z" fill="#506d56" />
          <path d="M280 350q-60 60-45 120h120q-50-80-75-120" fill="#d9c49b" />
        </>
      ) : (
        <>
          <rect
            x="95"
            y="95"
            width="410"
            height="285"
            rx="12"
            fill="#aebaa3"
            transform="rotate(-6 300 235)"
          />
          <path
            d="M95 120q105-30 205 5 100-35 205-5v265q-105-30-205 5-100-35-205-5Z"
            fill="#fcf6e7"
          />
          <path d="M300 125v265" stroke="#cfc4af" strokeWidth="3" />
          {[175, 210, 245, 280, 315].map((y) => (
            <path
              key={y}
              d={`M130 ${y}h130M340 ${y}h125`}
              stroke="#cec6b4"
              strokeWidth="3"
            />
          ))}
          <path
            d="m410 330 80-185"
            stroke="#b46b4d"
            strokeWidth="12"
            strokeLinecap="round"
          />
        </>
      )}
    </svg>
  );
}
export default function CoverSite({ onOpen }: { onOpen: () => void }) {
  const { cover } = useDiscreetSession();
  const edition = editions[cover];
  const stories = edition.stories;
  const BrandIcon = cover === 1 ? Music : cover === 2 ? BookOpen : Leaf;
  const [selected, Selected] = useState("");
  const [category, Category] = useState("All stories");
  const [query, Query] = useState("");
  const dialog = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const close = () => dialog.current?.close();
    window.addEventListener("hervoice-exit", close);
    return () => window.removeEventListener("hervoice-exit", close);
  }, []);
  const article = stories.find((s) => s.id === selected);
  const filtered = stories.filter(
    (s) =>
      (category === "All stories" || s.category === category) &&
      (s.title + " " + s.subtitle + " " + s.category)
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  return (
    <div className={"everyday-site edition-" + edition.name}>
      <a href="#reading" className="skip">
        Skip to stories
      </a>
      <div className="everyday-topline">
        A LITTLE INSPIRATION FOR THE EVERYDAY.
      </div>
      <header className="everyday-header">
        <button
          className="everyday-brand"
          onClick={() => {
            Selected("");
            Category("All stories");
            Query("");
          }}
        >
          <BrandIcon size={25} strokeWidth={1.4} /> everyday
          <span>{edition.name}</span>
          <span className="sr-only"> home</span>
        </button>
        <button
          className="personal-space"
          ref={opener}
          onClick={() => dialog.current?.showModal()}
        >
          <BookOpen size={17} /> Personal space <ArrowUpRight size={16} />
        </button>
      </header>
      <main id="reading" className="everyday-main">
        {article ? (
          <article className="everyday-article">
            <button className="reading-back" onClick={() => Selected("")}>
              <ArrowLeft size={17} /> Back to stories
            </button>
            <div className="article-heading">
              <span>
                {article.category} / {article.time}
              </span>
              <h1>{article.title}</h1>
              <p>{article.subtitle}</p>
            </div>
            <div className="article-art">
              <Illustration kind={article.art} />
            </div>
            <div className="article-copy">
              {article.paragraphs.map((p) => (
                <p key={p}>{p}</p>
              ))}
            </div>
            <button className="reading-back" onClick={() => Selected("")}>
              Explore more stories <ArrowRight size={17} />
            </button>
          </article>
        ) : (
          <>
            <div className="everyday-hero">
              <div>
                <span className="everyday-kicker">{edition.kicker}</span>
                <h1>
                  {edition.heading}
                  <br />
                  {edition.ending}
                </h1>
                <p className="reading-clue">
                  A note can be a quiet reminder: <mark>Click</mark> into a new
                  thought, follow <mark>the</mark> thread, and let a small{" "}
                  <mark>button</mark> open another page. There’s more{" "}
                  <mark>below</mark>, a little space <mark>for</mark> what
                  matters, and <mark>help</mark> when you choose it.
                </p>
                <button className="demo-entry-button" onClick={onOpen}>
                  Open personal space <ArrowRight size={19} />
                </button>
                <p className="reading-entry-hint">
                  Your next page is one click away.
                </p>
                <div className="editor-note">
                  <span>THE EDITOR’S NOTE</span>
                  <p>
                    {edition.note}
                    <br />
                    {edition.noteEnd}
                  </p>
                </div>
              </div>
              <button
                className="feature-art"
                onClick={() => Selected(stories[0].id)}
                aria-label={"Read " + stories[0].title}
              >
                <Illustration kind={stories[0].art} />
                <span>
                  {stories[0].category.toUpperCase()} /{" "}
                  {stories[0].time.toUpperCase()}
                  <br />
                  <strong>{stories[0].title}</strong>
                  <ArrowUpRight size={22} />
                </span>
              </button>
            </div>
            <div className="reading-section-heading">
              <div>
                <span className="everyday-kicker">{edition.latest}</span>
                <h2>A few things you might enjoy.</h2>
              </div>
              <label className="reading-search">
                <Search size={17} />
                <span className="sr-only">Search stories</span>
                <input
                  placeholder="Find a story"
                  value={query}
                  onChange={(e) => Query(e.target.value)}
                />
              </label>
            </div>
            <nav className="reading-categories" aria-label="Story categories">
              {[
                "All stories",
                ...Array.from(new Set(stories.map((s) => s.category))),
              ].map((c) => (
                <button
                  key={c}
                  aria-pressed={category === c}
                  onClick={() => Category(c)}
                >
                  {c}
                </button>
              ))}
            </nav>
            <div className="reading-grid">
              {filtered.map((s) => (
                <button
                  className="story-card"
                  key={s.id}
                  onClick={() => Selected(s.id)}
                >
                  <div className="story-art">
                    <Illustration kind={s.art} />
                  </div>
                  <span>
                    {s.category} <span>— {s.time}</span>
                  </span>
                  <h3>{s.title}</h3>
                  <p>{s.subtitle}</p>
                  <span className="story-read">
                    Read the story <ArrowUpRight size={17} />
                  </span>
                </button>
              ))}
            </div>
            {!filtered.length && (
              <p className="no-stories" role="status">
                No stories match that search. Try another word or choose All
                stories.
              </p>
            )}
            <aside className="reading-quote">
              <Leaf size={25} />
              <p>
                There’s something lovely
                <br />
                about an ordinary day.
              </p>
              <span>MAKE A LITTLE SPACE FOR IT.</span>
            </aside>
          </>
        )}
      </main>
      <footer className="everyday-footer">
        <span>everyday {edition.name}</span>
        <p>A collection of small ideas. Made to browse at your own pace.</p>
        <button onClick={() => dialog.current?.showModal()}>
          Personal space <ArrowUpRight size={15} />
        </button>
      </footer>
      <dialog
        className="entry-dialog"
        ref={dialog}
        aria-labelledby="entry-title"
        onClose={() => opener.current?.focus()}
      >
        <button
          className="entry-close"
          aria-label="Close personal space"
          onClick={() => dialog.current?.close()}
        >
          <X size={22} />
        </button>
        <span className="everyday-kicker">PERSONAL SPACE</span>
        <h2 id="entry-title">Choose what you need.</h2>
        <p>
          HerVoice support tools include discreet image requests, a conversation
          space, and U.S. resources.
        </p>
        <p className="entry-notice">
          Only open these tools if it feels safe. This reading view does not
          hide browser history, downloads, network activity, or device
          monitoring. Switching tabs or returning to reading closes the tools
          and clears unsaved work. Reloading always returns to reading.
        </p>
        <button
          className="entry-open"
          onClick={() => {
            dialog.current?.close();
            onOpen();
          }}
        >
          Open support tools <ArrowRight size={18} />
        </button>
        <button
          className="entry-continue"
          onClick={() => dialog.current?.close()}
        >
          Continue reading
        </button>
      </dialog>
    </div>
  );
}
