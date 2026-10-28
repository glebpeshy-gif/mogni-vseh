// Иконка 512×512 и обложка 800×470 для Консоли Яндекс Игр (ru и en) → promo/
// Запуск: node tools/make-promo.mjs      (нужен Google Chrome)
import { writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildEnemies, playerSVG } from '../src/art/builder.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'promo');
const TMP = join(OUT, '.tmp');
mkdirSync(TMP, { recursive: true });

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const FONT = join(ROOT, 'node_modules/@fontsource/unbounded/files');
const img = (svg) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
const enemies = buildEnemies();
const hero = img(playerSVG({ stage: 5, mood: 'mog', eq: { glasses: 'pixel', effect: 'sigma_bolt' }, size: 600 }));

const css = `
@font-face { font-family: U; font-weight: 800; src: url('file://${FONT}/unbounded-cyrillic-800-normal.woff2'); }
@font-face { font-family: U; font-weight: 800; src: url('file://${FONT}/unbounded-latin-800-normal.woff2'); unicode-range: U+0000-00FF; }
* { margin: 0; box-sizing: border-box; }
body { width: var(--w); height: var(--h); overflow: hidden; position: relative; font-family: U; font-weight: 800;
  background: radial-gradient(circle at 30% 45%, #7b2cff 0%, #3a1680 38%, #140f26 75%); }
.rays { position: absolute; inset: -50%; background: repeating-conic-gradient(from 0deg at 30% 45%, #ffffff10 0 8deg, transparent 8deg 20deg); }
img { position: absolute; }
.title { position: absolute; color: #d8ff3a; text-transform: uppercase; line-height: .95; letter-spacing: -1px;
  -webkit-text-stroke: 10px #1a0b3a; paint-order: stroke fill; text-shadow: 0 7px 0 #1a0b3a, 0 0 30px #ff3ea5aa; transform: rotate(-4deg); }
.title span { color: #ff3ea5; }
.tag { position: absolute; background: #ff3ea5; color: #fff; border: 5px solid #1a0b3a; border-radius: 18px; padding: 8px 16px; font-size: 18px; white-space: nowrap; transform: rotate(3deg); box-shadow: 0 6px 0 #1a0b3a; }
`;

function page(w, h, inner) {
  return `<!doctype html><html><head><meta charset="utf-8"><style>:root{--w:${w}px;--h:${h}px}${css}</style></head>
<body><div class="rays"></div>${inner}</body></html>`;
}

function render(name, w, h, html) {
  const file = join(TMP, `${name}.html`);
  writeFileSync(file, html);
  execFileSync(CHROME, ['--headless=new', '--hide-scrollbars', '--force-device-scale-factor=1', '--allow-file-access-from-files',
    `--window-size=${w},${h}`, '--virtual-time-budget=3000', `--screenshot=${join(OUT, name + '.png')}`, `file://${file}`], { stdio: 'ignore' });
  console.log('✓', name);
}

const icon = page(512, 512, `
  <img src="${img(enemies['enemies/normis'])}" style="width:210px; right:-20px; bottom:-10px; transform:rotate(14deg); opacity:.95">
  <img src="${hero}" style="width:470px; left:-10px; top:20px">
`);
render('icon-512', 512, 512, icon);

const TITLES = { ru: ['Могни', 'всех', 'ТАПАЙ • КАЧАЙСЯ • МОГАЙ'], en: ['Mog', 'everyone', 'TAP • LOOKSMAX • MOG'] };
for (const [lang, [a, b, tag]] of Object.entries(TITLES)) {
  const cover = page(800, 470, `
    <img src="${img(enemies['enemies/boss_gigachad'])}" style="width:220px; right:-30px; top:-30px; transform:rotate(10deg); opacity:.9">
    <img src="${img(enemies['enemies/streamer'])}" style="width:200px; right:120px; bottom:-30px; transform:rotate(-8deg)">
    <img src="${img(enemies['enemies/normis'])}" style="width:190px; right:-20px; bottom:-20px; transform:rotate(12deg)">
    <img src="${hero}" style="width:430px; left:-20px; top:30px">
    <div class="title" style="left:370px; top:110px; font-size:${lang === 'ru' ? 76 : 56}px">${a}<br><span>${b}</span></div>
    <div class="tag" style="left:380px; top:300px">${tag}</div>
  `);
  render(`cover-800x470-${lang}`, 800, 470, cover);
}
rmSync(TMP, { recursive: true, force: true });
