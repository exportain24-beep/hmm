// Colourful round platform icons for the photo-card handle row, built from the simple-icons library
// (CC0 brand glyphs, https://simpleicons.org). Glyphs are used unmodified, white on each brand's own colour.
// A platform the library does not carry falls back to a text label on the card.
import {mkdirSync, writeFileSync} from 'node:fs';
import * as si from 'simple-icons';

const want = {youtube: ['siYoutube'], facebook: ['siFacebook'], instagram: ['siInstagram'], tiktok: ['siTiktok'], linkedin: ['siLinkedin'], x: ['siX', 'siTwitter']};
const bg = {instagram: 'url(#ig)', tiktok: '#000000', x: '#000000'};
mkdirSync('public/brand/social', {recursive: true});
for (const [name, keys] of Object.entries(want)) {
  const icon = keys.map((k) => si[k]).find(Boolean);
  if (!icon) { console.log(`no icon for ${name}`); continue; }
  const fill = bg[name] ?? `#${icon.hex}`;
  const grad = name === 'instagram' ? '<defs><radialGradient id="ig" cx="30%" cy="107%" r="150%"><stop offset="0" stop-color="#fdf497"/><stop offset="0.05" stop-color="#fdf497"/><stop offset="0.45" stop-color="#fd5949"/><stop offset="0.6" stop-color="#d6249f"/><stop offset="0.9" stop-color="#285AEB"/></radialGradient></defs>' : '';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">${grad}<circle cx="24" cy="24" r="24" fill="${fill}"/><g transform="translate(12 12)"><path d="${icon.path}" fill="#FFFFFF"/></g></svg>`;
  writeFileSync(`public/brand/social/${name}.svg`, svg);
  console.log(`icon ${name}`);
}
