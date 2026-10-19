/** Rebuild README diagrams: node scripts/render_readme_diagrams.mjs */
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import * as icons from 'lucide-react';
import sharp from 'sharp';
import { writeFile, mkdir } from 'node:fs/promises';

const palettes = ['#3976d6', '#1399b9', '#25a879', '#9aab20', '#dd8638', '#bc568f', '#7a67bd', '#d25a60'];
const diagrams = [
  {
    file: 'user-flow', title: 'USER FLOW', subtitle: 'From a few words to a verified, discreet request',
    note: 'HerVoice · Local demo uses synthetic data. A prepared PNG is not a delivered request.',
    steps: [
      ['NotebookPen', ['Enter brief', 'details'], 'You choose what to share'],
      ['TextCursorInput', ['Generate and', 'review text'], 'OpenAI + your edits'],
      ['Image', ['Choose an', 'image cover'], 'Generate, upload or select'],
      ['LockKeyhole', ['Encrypt and', 'encode PNG'], 'Approved message only'],
      ['BadgeCheck', ['Verify the', 'exported image'], 'Decode and check bytes'],
      ['Send', ['Share or send', 'to demo feed'], 'Keep the original PNG'],
    ],
  },
  {
    file: 'authority-flow', title: 'RESPONDER FLOW', subtitle: 'Detect a signal. Verify the message. Review the case.',
    note: 'Demo: controlled feed + SQLite. Live: X + MongoDB require configuration and account-backed verification. No dispatch.',
    steps: [
      ['Radar', ['Scan tagged', 'image feed'], 'Scheduler / cron'],
      ['ScanLine', ['Decode and', 'verify PNG'], 'Recipient + integrity checks'],
      ['ListFilter', ['Structure the', 'reported details'], 'OpenAI advisory analysis'],
      ['Database', ['Store the case', 'in MongoDB'], 'Live mode · encrypted payload'],
      ['LayoutDashboard', ['Review in', 'the dashboard'], 'Severity, status and notes'],
      ['SearchCheck', ['Find related', 'reports'], 'Atlas cosine similarity'],
    ],
  },
  {
    file: 'companion-flow', title: 'MAYA · AI COMPANION', subtitle: 'A moving character, a conversation, and controls that stay with you',
    note: 'Voice and memory are opt-in. Default mouth motion is audio-reactive; timed visemes require optional Rhubarb.',
    steps: [
      ['PersonStanding', ['Load the', 'rigged avatar'], 'Local GLB · useGLTF'],
      ['MessageCircle', ['Type or', 'speak a message'], 'Review voice transcription'],
      ['Sparkles', ['Generate a', 'supportive reply'], 'OpenAI conversation'],
      ['AudioLines', ['Create optional', 'female speech'], 'OpenAI · Nova voice'],
      ['Smile', ['Animate face', 'and mouth'], 'Blink, motion and audio'],
      ['SlidersHorizontal', ['Choose your', 'experience'], 'Pause, text only or memory'],
    ],
  },
  {
    file: 'legal-flow', title: 'LEGAL SEARCH & RESPONSE', subtitle: 'Reviewed U.S. sources → relevant passages → a cited explanation',
    note: 'Atlas path shown; live setup is required. The local demo uses a reviewed registry. Coverage is U.S. / selected Ohio resources.',
    steps: [
      ['Files', ['Review and', 'chunk documents'], 'Official sources + metadata'],
      ['Database', ['Embed and', 'index chunks'], 'OpenAI → MongoDB Atlas'],
      ['MessageCircleQuestion', ['Receive a', 'legal question'], 'Country + state context'],
      ['Network', ['Embed the', 'question'], 'Same embedding model'],
      ['Search', ['Search relevant', 'document chunks'], 'Jurisdiction + review filters'],
      ['ListChecks', ['Check source', 'versions'], 'Reject stale / withdrawn text'],
      ['Sparkles', ['Generate a', 'grounded answer'], 'OpenAI + retrieved passages'],
      ['BookOpenCheck', ['Present answer', 'with citations'], 'Abstain if unsupported'],
    ],
  },
];
const esc = s => s.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
await mkdir('docs/diagrams', { recursive: true });
for (const d of diagrams) {
  const width = d.steps.length === 8 ? 1920 : 1560;
  const height = 780, axis = 400;
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="title desc"><title id="title">HerVoice: ${esc(d.title)}</title><desc id="desc">${esc(d.steps.map(s => s[1].join(' ')).join(' → '))}. ${esc(d.note)}</desc><rect width="100%" height="100%" fill="#fff"/><style>text{font-family:Arial,Helvetica,sans-serif} .heading{font-size:38px;font-weight:700;fill:#354652;letter-spacing:2px}.label{font-size:28px;fill:#364650}.detail{font-size:17px;fill:#536674}</style>`;
  svg += `<text x="${width/2}" y="63" text-anchor="middle" class="heading">${esc(d.title)}</text><text x="${width/2}" y="103" text-anchor="middle" font-size="21" fill="#657580">${esc(d.subtitle)}</text>`;
  svg += `<path d="M38 ${axis} H${width-38} m-14 -13 14 13 -14 13" fill="none" stroke="#53616a" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>`;
  d.steps.forEach(([icon, lines, detail], i) => {
    const x = 140 + i * (width - 280) / (d.steps.length - 1);
    const up = i % 2 === 0, y = up ? 290 : 510, color = palettes[i];
    const labelY = up ? 145 : 602;
    svg += `<path d="M${x} ${axis} V${y}" stroke="${color}" stroke-width="3"/><circle cx="${x}" cy="${y}" r="58" fill="white"/><circle cx="${x}" cy="${y}" r="58" fill="${color}" fill-opacity=".08" stroke="${color}" stroke-width="3"/><circle cx="${x}" cy="${axis}" r="6" fill="white" stroke="${color}" stroke-width="3"/>`;
    const iconSvg = renderToStaticMarkup(React.createElement(icons[icon], { width: 59, height: 59, color, strokeWidth: 1.5 }));
    svg += `<g transform="translate(${x-29.5} ${y-29.5})">${iconSvg}</g>`;
    lines.forEach((line, n) => svg += `<text x="${x}" y="${labelY+n*33}" text-anchor="middle" class="label">${esc(line)}</text>`);
    svg += `<text x="${x}" y="${labelY+lines.length*33+4}" text-anchor="middle" class="detail">${esc(detail)}</text>`;
  });
  svg += `<path d="M42 735 H${width-42}" stroke="#e0e6ea"/><text x="${width/2}" y="763" text-anchor="middle" font-size="17" fill="#536674">${esc(d.note)}</text></svg>`;
  await writeFile(`docs/diagrams/${d.file}.svg`, svg);
  await sharp(Buffer.from(svg)).png().toFile(`docs/diagrams/${d.file}.png`);
}
