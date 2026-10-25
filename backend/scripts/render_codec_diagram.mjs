/** Regenerate: node backend/scripts/render_codec_diagram.mjs */
import { writeFile } from 'node:fs/promises';
import sharp from 'sharp';
const text=(x,y,s,size=20,weight=400,color='#222')=>`<text x="${x}" y="${y}" font-family="Arial, sans-serif" font-size="${size}" font-weight="${weight}" fill="${color}">${s}</text>`;
const arrow=d=>`<path d="${d}" fill="none" stroke="#777" stroke-width="2" marker-end="url(#arrow)"/>`;
const box=(x,y,n,title,line)=>`<rect x="${x}" y="${y}" width="380" height="115" rx="16" fill="white" stroke="#d5d5d5"/><circle cx="${x+30}" cy="${y+34}" r="16" fill="#f2f2f2"/>${text(x+25,y+40,n,17,700)}${text(x+58,y+42,title,23,700)}${text(x+24,y+82,line,18,400,'#555')}`;
let svg=`<svg xmlns="http://www.w3.org/2000/svg" width="1320" height="670" viewBox="0 0 1320 670" role="img" aria-labelledby="title desc"><title id="title">How HerVoice hides a message</title><desc id="desc">Approve, encrypt, pack an HV01 frame, check capacity, embed one bit per PNG pixel, and verify. The frame contains HV01, length, SHA-256, nonce, ciphertext and an authentication tag.</desc><defs><marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0 L10 5 L0 10" fill="#777"/></marker></defs><rect width="1320" height="670" fill="white"/>`;
svg+=text(40,60,'How HerVoice hides a message',34,700);
svg+=box(40,100,'1','Approve','Choose the final message.');
svg+=box(470,100,'2','Encrypt','Protect the message with AES-GCM.');
svg+=box(900,100,'3','Pack','Add the HV01 header and checks.');
svg+=arrow('M420 157 H458')+arrow('M850 157 H888')+arrow('M1090 215 V252');
const fields=[['HV01',140],['Length',170],['SHA-256',220],['Nonce',170],['Ciphertext',300],['Auth tag',240]];
let x=40;
for(const [label,w] of fields){svg+=`<rect x="${x}" y="270" width="${w-4}" height="58" rx="8" fill="#f3f3f3"/>`+text(x+18,306,label,21,700);x+=w;}
svg+=arrow('M230 328 V368');
svg+=box(40,385,'4','Check capacity','Make sure the message fits.');
svg+=box(470,385,'5','Embed','Hide one bit in each PNG pixel.');
svg+=box(900,385,'6','Verify','Recover and check the message.');
svg+=arrow('M420 442 H458')+arrow('M850 442 H888');
svg+=`<rect x="40" y="540" width="1240" height="90" rx="14" fill="#fafafa"/>`;
svg+=text(64,576,'ONE PIXEL',14,700,'#666')+text(64,605,'Only the last red-channel bit changes.',17,400,'#555');
svg+=text(445,596,'10110110 → 1011011<tspan fill="#1769aa">1</tspan>',28,700);
svg+=text(905,576,'Accept valid data.',19,700)+text(905,605,'Reject damaged or unauthorized data.',17,400,'#555');
svg+='</svg>';
await writeFile('docs/diagrams/codec-flow.svg',svg);
await sharp(Buffer.from(svg)).png().toFile('docs/diagrams/codec-flow.png');
