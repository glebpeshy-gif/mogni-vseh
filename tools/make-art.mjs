// Генератор артов персонажей в стиле стикерпака (белая «вырубка», толстый контур, тень).
// Запуск:  npm run art   → пишет SVG в src/art/enemies и src/art/player
//
// Все персонажи — архетипы и мемные образы, а не реальные люди, бренды или чужие герои.
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const INK = '#1d1238';
const SW = 7; // толщина контура

// ---------- helpers ----------
const attrs = (a) => Object.entries(a).filter(([, v]) => v != null && v !== false)
  .map(([k, v]) => `${k}="${v}"`).join(' ');
const el = (tag, a = {}, ...kids) => (kids.length ? `<${tag} ${attrs(a)}>${kids.join('')}</${tag}>` : `<${tag} ${attrs(a)}/>`);
const ink = (a) => ({ stroke: INK, 'stroke-width': SW, 'stroke-linejoin': 'round', 'stroke-linecap': 'round', ...a });
const path = (d, fill, extra = {}) => el('path', ink({ d, fill, ...extra }));
const line = (d, w = SW, color = INK) => el('path', { d, fill: 'none', stroke: color, 'stroke-width': w, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });
const circle = (cx, cy, r, fill, extra = {}) => el('circle', ink({ cx, cy, r, fill, ...extra }));
const ellipse = (cx, cy, rx, ry, fill, extra = {}) => el('ellipse', ink({ cx, cy, rx, ry, fill, ...extra }));
const g = (a, ...kids) => el('g', a, ...kids);

const SKIN = { light: ['#ffd8b8', '#f2b48e'], tan: ['#e8b48a', '#cf9467'], warm: ['#f6c79c', '#e0a676'] };

function sparkle(x, y, s = 1, color = '#fff27a') {
  const d = `M${x},${y - 22 * s} Q${x + 4 * s},${y - 4 * s} ${x + 22 * s},${y} Q${x + 4 * s},${y + 4 * s} ${x},${y + 22 * s} Q${x - 4 * s},${y + 4 * s} ${x - 22 * s},${y} Q${x - 4 * s},${y - 4 * s} ${x},${y - 22 * s} Z`;
  return path(d, color, { 'stroke-width': 4 });
}

// ---------- тело ----------
function torso({ color, wide = false, shade }) {
  const d = wide
    ? 'M96,500 C96,388 160,330 256,330 C352,330 416,388 416,500 Z'
    : 'M140,500 C140,392 180,338 256,338 C332,338 372,392 372,500 Z';
  return path(d, color) + (shade ? el('path', { d: wide ? 'M330,345 C385,365 412,420 414,500 L360,500 C356,430 340,380 300,350 Z' : 'M310,348 C350,370 368,420 370,500 L330,500 C326,440 316,390 290,355 Z', fill: shade, opacity: 0.55 }) : '');
}
const neck = (skin) => path('M228,286 L228,346 Q256,360 284,346 L284,286 Z', skin[1]);

// ---------- голова ----------
const HEADS = {
  round: 'M138,200 C138,128 190,88 256,88 C322,88 374,128 374,200 C374,272 322,316 256,316 C190,316 138,272 138,200 Z',
  square: 'M138,190 C138,112 190,86 256,86 C322,86 374,112 374,190 L370,252 C364,294 330,320 256,324 C182,320 148,294 142,252 Z',
  giga: 'M130,184 C130,106 186,82 256,82 C326,82 382,106 382,184 L386,262 C382,316 330,344 256,346 C182,344 130,316 126,262 Z',
};
function head(shape, skin, { ears = true } = {}) {
  const out = [];
  if (ears) out.push(circle(140, 214, 24, skin[0]), circle(372, 214, 24, skin[0]));
  out.push(path(HEADS[shape], skin[0]));
  // мягкая тень по правой стороне лица
  out.push(el('path', { d: 'M330,120 C368,150 378,210 362,262 C350,292 320,312 286,318 C330,290 352,240 346,190 C342,160 336,138 330,120 Z', fill: skin[1], opacity: 0.6 }));
  return out.join('');
}
const blush = (c = '#ff8fb1') => ellipse(196, 250, 22, 12, c, { stroke: 'none', opacity: 0.45 }) + ellipse(316, 250, 22, 12, c, { stroke: 'none', opacity: 0.45 });

// ---------- глаза ----------
function eyes(kind, { iris = '#3b2a6b' } = {}) {
  const pair = (fn) => fn(208, -1) + fn(304, 1);
  switch (kind) {
    case 'dot': return pair((x) => ellipse(x, 204, 9, 12, INK, { 'stroke-width': 0 }));
    case 'normal': return pair((x) => ellipse(x, 204, 25, 29, '#fff') + circle(x + 3, 208, 13, iris, { 'stroke-width': 0 }) + circle(x + 7, 202, 5, '#fff', { stroke: 'none' }));
    case 'tired': return pair((x) => ellipse(x, 206, 24, 26, '#fff') + circle(x, 212, 12, iris, { 'stroke-width': 0 })
      + path(`M${x - 26},200 Q${x},188 ${x + 26},200 L${x + 26},178 L${x - 26},178 Z`, 'var(--skin)', { stroke: 'none' })
      + line(`M${x - 25},200 L${x + 25},200`, 6) + line(`M${x - 18},236 Q${x},242 ${x + 18},236`, 4, '#9b7bd0'));
    case 'smug': return pair((x, s) => ellipse(x, 206, 25, 24, '#fff') + circle(x + 6 * s, 210, 12, iris, { 'stroke-width': 0 })
      + path(`M${x - 27},205 Q${x},196 ${x + 27},201 L${x + 27},178 L${x - 27},178 Z`, 'var(--skin)', { stroke: 'none' })
      + line(`M${x - 26},205 Q${x},194 ${x + 26},201`, 6));
    case 'hunter': return pair((x, s) => path(`M${x - 28},${208 - 4 * s} Q${x},190 ${x + 28},${208 + 4 * s} Q${x},220 ${x - 28},${208 - 4 * s} Z`, '#fff') + circle(x, 206, 9, iris, { 'stroke-width': 0 }));
    case 'anime': return pair((x) => ellipse(x, 202, 30, 40, '#fff') + ellipse(x, 208, 22, 31, iris, { 'stroke-width': 0 })
      + ellipse(x, 214, 14, 18, '#1b1440', { stroke: 'none' }) + ellipse(x - 8, 192, 9, 12, '#fff', { stroke: 'none' }) + circle(x + 9, 222, 4, '#fff', { stroke: 'none' })
      + line(`M${x - 32},170 L${x - 40},162 M${x + 32},170 L${x + 40},162`, 6));
    case 'glasses': return pair((x) => circle(x, 206, 40, '#e8f4ff', { opacity: 1 }) + circle(x + 2, 208, 14, iris, { 'stroke-width': 0 }) + circle(x + 7, 202, 5, '#fff', { stroke: 'none' })
      + line(`M${x - 20},186 L${x - 8},178`, 5, '#fff'))
      + line('M248,204 Q256,196 264,204', 7) + line('M168,200 L140,190 M344,200 L372,190', 7);
    case 'shades': return path('M150,186 L362,186 L356,214 Q350,240 318,240 Q286,240 276,214 L264,198 L248,198 L236,214 Q226,240 194,240 Q162,240 156,214 Z', '#1b1530')
      + el('path', { d: 'M172,196 L200,196 L180,226 Z M286,196 L314,196 L294,226 Z', fill: '#7fe8ff', opacity: 0.8 });
    case 'glow': return pair((x, s) => el('ellipse', { cx: x, cy: 206, rx: 40, ry: 30, fill: '#ffe14d', opacity: 0.55, filter: 'url(#glow)' })
      + path(`M${x - 30},${210 - 6 * s} Q${x},182 ${x + 30},${210 + 6 * s} Q${x},234 ${x - 30},${210 - 6 * s} Z`, '#fffbe0')
      + circle(x, 208, 7, '#ffd23f', { 'stroke-width': 0 }));
    case 'cat': return pair((x, s) => ellipse(x, 204, 24, 22, '#c8ff7a') + ellipse(x + 2 * s, 206, 5, 16, INK, { 'stroke-width': 0 })
      + path(`M${x - 26},202 Q${x},190 ${x + 26},198 L${x + 26},178 L${x - 26},178 Z`, 'var(--skin)', { stroke: 'none' }) + line(`M${x - 25},202 Q${x},190 ${x + 25},198`, 6));
    default: return '';
  }
}

function brows(kind, color = INK) {
  switch (kind) {
    case 'angry': return line('M178,166 L232,180 M334,166 L280,180', 12, color);
    case 'raised': return line('M182,160 Q206,146 232,158 M280,156 Q306,146 330,160', 10, color);
    case 'flat': return line('M182,166 L230,166 M282,166 L330,166', 10, color);
    case 'cocky': return line('M182,164 Q206,156 232,166 M280,170 L332,158', 11, color);
    case 'heavy': return path('M162,176 Q256,140 350,176 L350,190 Q256,166 162,190 Z', color);
    default: return '';
  }
}

// ---------- рты ----------
function mouth(kind) {
  switch (kind) {
    case 'flat': return line('M232,268 L280,268', 7);
    case 'smirk': return line('M226,266 Q262,282 292,256', 7);
    case 'smile': return line('M226,262 Q256,290 286,262', 7);
    case 'mew': return line('M232,270 Q256,262 280,270', 7) + line('M248,298 Q256,302 264,298', 4);
    case 'duck': return path('M232,264 Q244,248 256,258 Q268,248 280,264 Q268,286 256,282 Q244,286 232,264 Z', '#ff5c9a') + line('M236,266 Q256,272 276,266', 4);
    case 'grin': return path('M220,256 L292,256 Q290,300 256,302 Q222,300 220,256 Z', '#7a1f3d') + path('M222,257 L290,257 L288,272 L224,272 Z', '#fff', { 'stroke-width': 4 });
    case 'braces': return path('M220,256 L292,256 Q290,300 256,302 Q222,300 220,256 Z', '#7a1f3d') + path('M222,257 L290,257 L288,274 L224,274 Z', '#fff', { 'stroke-width': 4 })
      + line('M226,266 L286,266', 4, '#9aa3b5') + [234, 248, 262, 276].map((x) => el('rect', { x: x - 4, y: 262, width: 8, height: 8, fill: '#c9d1e0', stroke: INK, 'stroke-width': 2 })).join('');
    case 'gold': return path('M222,258 L292,258 Q288,294 256,296 Q224,294 222,258 Z', '#7a1f3d') + path('M224,259 L290,259 L288,272 L226,272 Z', '#fff', { 'stroke-width': 4 })
      + el('rect', { x: 262, y: 259, width: 14, height: 13, fill: '#ffd23f', stroke: INK, 'stroke-width': 3 });
    case 'shout': return ellipse(256, 276, 30, 26, '#7a1f3d') + ellipse(256, 290, 16, 9, '#ff7a9a', { stroke: 'none' });
    case 'catw': return line('M232,262 Q244,276 256,262 Q268,276 280,262', 6) + path('M248,246 L264,246 L256,256 Z', '#ff8fb1', { 'stroke-width': 4 });
    case 'stone': return path('M226,270 Q256,262 286,270 L282,284 Q256,290 230,284 Z', '#7d7d86');
    default: return '';
  }
}

// ---------- причёски ----------
const HAIR = {
  messy: 'M134,206 C116,118 176,62 262,66 C352,70 398,128 380,206 C368,170 350,150 330,146 L334,170 C312,146 290,138 268,142 L272,164 C246,140 214,140 196,152 L196,174 C172,160 150,176 134,206 Z',
  quiff: 'M136,194 C122,122 166,72 232,58 C258,24 334,26 360,62 C388,94 392,150 378,196 C358,150 318,128 268,132 C222,136 176,152 136,194 Z',
  bowl: 'M130,220 C122,120 178,74 256,74 C334,74 390,120 382,220 L370,224 L366,170 L146,170 L142,224 Z',
  slick: 'M138,180 C136,108 188,74 256,74 C324,74 376,108 374,180 C356,132 312,112 256,114 C200,112 156,132 138,180 Z',
  fringe: 'M134,210 C118,120 180,66 262,68 C344,70 398,120 382,206 C356,170 330,150 300,146 C270,180 220,200 170,196 C154,198 142,204 134,210 Z',
  twinBangs: 'M134,214 C120,118 182,68 256,68 C330,68 392,118 378,214 L360,170 L338,198 L318,158 L292,192 L268,152 L244,192 L220,156 L196,196 L176,162 L152,200 Z',
  buzz: 'M140,176 C140,110 192,84 256,84 C320,84 372,110 372,176 C352,140 310,124 256,124 C202,124 160,140 140,176 Z',
};
const hair = (kind, color) => path(HAIR[kind], color);

// ---------- аксессуары ----------
const acc = {
  ringLight: () => circle(256, 200, 170, 'none', { stroke: '#fff7d6', 'stroke-width': 26, filter: 'url(#glow)' }) + circle(256, 200, 170, 'none', { 'stroke-width': 4 }),
  phone: () => g({},
    path('M392,300 C408,300 420,320 416,350 L404,420 L364,416 L372,340 C376,316 380,300 392,300 Z', 'var(--skin)'),
    el('rect', ink({ x: 360, y: 214, width: 74, height: 124, rx: 14, fill: '#2a2140', transform: 'rotate(10 397 276)' })),
    el('rect', { x: 370, y: 226, width: 54, height: 96, rx: 8, fill: '#ff5ca8', transform: 'rotate(10 397 276)' }),
    circle(398, 238, 6, '#1b1530', { 'stroke-width': 0, transform: 'rotate(10 397 276)' })),
  headset: (c = '#29f0ff') => line('M130,214 C120,90 392,90 382,214', 18, INK) + line('M130,214 C120,96 392,96 382,214', 8, c)
    + el('rect', ink({ x: 104, y: 180, width: 44, height: 74, rx: 18, fill: c })) + el('rect', ink({ x: 364, y: 180, width: 44, height: 74, rx: 18, fill: c }))
    + line('M126,248 Q140,300 210,286', 9) + circle(214, 286, 10, '#1b1530'),
  backpack: () => line('M186,350 L176,500 M326,350 L336,500', 22, '#e85c3a') + line('M186,350 L176,500 M326,350 L336,500', 4, INK),
  tie: (c) => path('M244,342 L268,342 L276,366 L262,440 L250,440 L236,366 Z', c),
  pencil: () => g({ transform: 'rotate(-35 380 140)' }, el('rect', ink({ x: 340, y: 130, width: 80, height: 18, fill: '#ffd23f' })), path('M420,130 L442,139 L420,148 Z', '#ffd8b8', { 'stroke-width': 5 })),
  shaker: () => g({}, path('M400,330 C416,330 428,348 424,374 L416,440 L376,436 L384,360 C388,342 392,330 400,330 Z', 'var(--skin)'),
    el('rect', ink({ x: 372, y: 266, width: 64, height: 100, rx: 12, fill: '#3dd5ff' })), el('rect', ink({ x: 378, y: 248, width: 52, height: 24, rx: 6, fill: '#1b1530' })),
    el('rect', { x: 382, y: 300, width: 44, height: 22, fill: '#fff', opacity: 0.85 })),
  headband: (c) => path('M136,170 Q256,128 376,170 L378,194 Q256,152 134,194 Z', c),
  cap: (c) => path('M140,170 C140,96 194,72 256,72 C318,72 372,96 372,170 Z', c) + path('M136,168 L420,168 Q430,186 400,192 L136,190 Z', c)
    + circle(256, 76, 9, c) + line('M256,82 L256,166', 4, '#00000040'),
  mustache: () => path('M210,252 Q232,238 256,250 Q280,238 302,252 Q296,268 274,262 Q262,258 256,262 Q250,258 238,262 Q216,268 210,252 Z', '#5a3a1e'),
  whistle: () => line('M216,330 Q256,400 300,330', 5, '#ff3355') + el('rect', ink({ x: 238, y: 390, width: 44, height: 24, rx: 10, fill: '#c9d1e0' })) + circle(286, 402, 12, '#c9d1e0'),
  stripes: () => line('M184,380 L176,500 M200,372 L194,500 M328,372 L336,500 M312,380 L318,500', 8, '#fff'),
  sailor: () => path('M168,350 L256,430 L344,350 L372,400 L256,470 L140,400 Z', '#24306e') + line('M160,388 L256,456 L352,388', 5, '#fff')
    + path('M232,430 L280,430 L300,470 L256,452 L212,470 Z', '#ff3355'),
  bows: (c) => [124, 388].map((x) => path(`M${x},132 L${x - 30},112 L${x - 30},152 Z M${x},132 L${x + 30},112 L${x + 30},152 Z`, c) + circle(x, 132, 10, c)).join(''),
  twinTails: (c) => path('M138,170 C70,190 60,320 104,420 C112,360 120,300 150,250 Z', c) + path('M374,170 C442,190 452,320 408,420 C400,360 392,300 362,250 Z', c),
  chain: () => line('M196,346 Q256,430 316,346', 12, '#ffd23f') + line('M196,346 Q256,430 316,346', 3, INK)
    + circle(256, 418, 22, '#ffd23f') + el('text', { x: 256, y: 428, 'text-anchor': 'middle', 'font-family': 'Arial Black, Arial', 'font-weight': 900, 'font-size': 28, fill: INK }, '$'),
  money: () => [-30, -10, 10, 30].map((a) => el('rect', ink({ x: 360, y: 300, width: 56, height: 104, rx: 6, fill: '#5be38f', 'stroke-width': 5, transform: `rotate(${a} 388 404)` })) +
    el('text', { x: 388, y: 360, 'text-anchor': 'middle', 'font-family': 'Arial Black, Arial', 'font-weight': 900, 'font-size': 30, fill: '#1f7a45', transform: `rotate(${a} 388 404)` }, '$')).join('')
    + path('M372,392 C390,388 410,400 410,420 L404,450 L366,446 Z', 'var(--skin)'),
  qBubble: () => path('M396,60 C440,60 470,84 470,116 C470,148 440,170 404,170 L390,196 L384,166 C356,158 340,140 340,116 C340,84 362,60 396,60 Z', '#fff')
    + el('text', { x: 405, y: 140, 'text-anchor': 'middle', 'font-family': 'Arial Black, Arial', 'font-weight': 900, 'font-size': 66, fill: INK }, '?'),
  sweat: () => path('M380,120 Q394,146 388,160 Q378,172 368,160 Q362,146 380,120 Z', '#7fd8ff', { 'stroke-width': 5 }),
  lanyard: () => line('M210,344 L246,420 M302,344 L266,420', 6, '#3d7bff') + el('rect', ink({ x: 232, y: 414, width: 48, height: 60, rx: 6, fill: '#fff', 'stroke-width': 5 })) + el('rect', { x: 242, y: 426, width: 28, height: 22, fill: '#c9d1e0' }),
  crown: () => path('M168,104 L190,30 L226,82 L256,14 L286,82 L322,30 L344,104 Z', '#ffd23f') + path('M168,104 L344,104 L340,128 L172,128 Z', '#ffb000')
    + circle(256, 62, 12, '#ff2e97') + circle(212, 94, 8, '#29f0ff') + circle(300, 94, 8, '#29f0ff'),
  aura: (c1, c2) => g({ filter: 'url(#glow)' },
    el('path', { d: 'M256,20 C300,90 420,80 430,190 C470,150 480,260 450,330 C500,330 470,440 400,480 L112,480 C42,440 12,330 62,330 C32,260 42,150 82,190 C92,80 212,90 256,20 Z', fill: c1, opacity: 0.85 }),
    el('path', { d: 'M256,70 C290,130 380,120 388,210 C420,190 420,280 400,330 C430,340 410,420 360,460 L152,460 C102,420 82,340 112,330 C92,280 92,190 124,210 C132,120 222,130 256,70 Z', fill: c2, opacity: 0.9 })),
  sparkles: (n = 3) => [sparkle(120, 110, 1.2), sparkle(410, 80, 0.9), sparkle(440, 300, 1), sparkle(70, 320, 0.8)].slice(0, n).join(''),
  jacketCollar: (c) => path('M190,344 L236,420 L256,370 L276,420 L322,344 L290,336 L256,360 L222,336 Z', c),
  cape: (c) => path('M120,360 C90,420 80,470 70,500 L442,500 C432,470 422,420 392,360 Z', c),
  hearts: () => path('M88,150 C88,130 112,126 118,142 C124,126 148,130 148,150 C148,170 118,186 118,186 C118,186 88,170 88,150 Z', '#ff4f8b', { 'stroke-width': 5 })
    + path('M410,110 C410,96 426,93 430,104 C434,93 450,96 450,110 C450,124 430,135 430,135 C430,135 410,124 410,110 Z', '#ff4f8b', { 'stroke-width': 5 }),
  rgb: () => line('M150,450 L362,450', 10, '#ff2e97') + line('M146,466 L366,466', 10, '#29f0ff') + line('M144,482 L368,482', 10, '#b6ff3b'),
  bowtie: () => path('M220,336 L256,352 L292,336 L292,372 L256,358 L220,372 Z', '#ff2e97') + circle(256, 354, 9, '#ff2e97'),
  vest: (c) => path('M168,372 L226,350 L256,440 L286,350 L344,372 L352,500 L160,500 Z', c) + line('M212,410 L232,420 M300,420 L280,410', 4, '#00000030'),
};

// ---------- особые головы ----------
function catHead() {
  const fur = '#f6a33c', light = '#ffe2b8';
  return path('M150,150 L150,58 L222,110 Z', fur) + path('M362,150 L362,58 L290,110 Z', fur)
    + path('M160,128 L162,86 L200,114 Z', '#ffb3c7', { 'stroke-width': 4 }) + path('M352,128 L350,86 L312,114 Z', '#ffb3c7', { 'stroke-width': 4 })
    + path('M132,212 C132,128 190,98 256,98 C322,98 380,128 380,212 C380,286 324,318 256,318 C188,318 132,286 132,212 Z', fur)
    + line('M226,104 L232,140 M256,100 L256,140 M286,104 L280,140', 9, '#d97a1e')
    + ellipse(256, 262, 70, 46, light, { 'stroke-width': 0 })
    + line('M190,250 L130,240 M190,262 L128,268 M322,250 L382,240 M322,262 L384,268', 4);
}
function moaiHead() {
  const stone = '#a3a1ab', dark = '#7d7a88';
  return path('M168,120 C168,64 210,40 256,40 C302,40 344,64 344,120 L352,300 C352,338 316,350 256,350 C196,350 160,338 160,300 Z', stone)
    + el('path', { d: 'M300,60 C334,80 344,120 344,170 L348,300 C348,330 324,344 290,348 C320,320 330,250 322,170 C318,120 312,84 300,60 Z', fill: dark, opacity: 0.6 })
    + path('M176,150 L336,150 L330,176 L182,176 Z', dark)
    + path('M246,170 L232,262 Q256,276 280,262 L266,170 Z', stone)
    + circle(200, 96, 7, dark, { stroke: 'none' }) + circle(310, 250, 6, dark, { stroke: 'none' }) + circle(190, 300, 5, dark, { stroke: 'none' });
}
function gorillaHead() {
  const fur = '#3b3746', face = '#77707f';
  return circle(132, 210, 26, face) + circle(380, 210, 26, face)
    + path('M126,196 C126,104 186,66 256,66 C326,66 386,104 386,196 L390,270 C386,324 330,352 256,354 C182,352 126,324 122,270 Z', fur)
    + path('M166,168 C176,140 336,140 346,168 L352,262 C348,306 306,330 256,332 C206,330 164,306 160,262 Z', face)
    + line('M200,300 Q256,320 312,300', 5, '#4e4858') + ellipse(240, 248, 9, 6, INK, { 'stroke-width': 0 }) + ellipse(272, 248, 9, 6, INK, { 'stroke-width': 0 });
}

// ---------- сборка ----------
function sticker(parts, { skin = SKIN.light } = {}) {
  const body = parts.join('').replace(/var\(--skin\)/g, skin[0]);
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="-16 -16 544 544" width="544" height="544">
<defs>
  <filter id="sticker" x="-10%" y="-10%" width="120%" height="125%">
    <feMorphology in="SourceAlpha" operator="dilate" radius="11" result="fat"/>
    <feGaussianBlur in="fat" stdDeviation="7" result="blur"/>
    <feOffset in="blur" dx="0" dy="9" result="drop"/>
    <feFlood flood-color="#12062b" flood-opacity="0.45"/><feComposite in2="drop" operator="in" result="shadow"/>
    <feFlood flood-color="#ffffff"/><feComposite in2="fat" operator="in" result="cut"/>
    <feMerge><feMergeNode in="shadow"/><feMergeNode in="cut"/><feMergeNode in="SourceGraphic"/></feMerge>
  </filter>
  <filter id="glow" x="-30%" y="-30%" width="160%" height="160%">
    <feGaussianBlur stdDeviation="6" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
  </filter>
</defs>
<g filter="url(#sticker)">${body}</g>
</svg>`;
}

const S = SKIN.light, T = SKIN.tan, W = SKIN.warm;

const CHARACTERS = {
  // ---- соперники ----
  'enemies/normis': [ // NPC из очереди за кофе: пустой взгляд, бейджик, «?»
    torso({ color: '#9aa0b4', shade: '#6f7590' }), acc.lanyard(), neck(S), head('round', S), eyes('dot'), brows('flat'), mouth('flat'),
    hair('slick', '#7a6a5a'), acc.qBubble(),
  ],
  'enemies/tiktoker': [ // кольцевая лампа, губы уточкой, телефон в руке
    acc.ringLight(), torso({ color: '#b6ff3b', shade: '#7fc41a' }), neck(S), head('round', S), blush(), eyes('anime', { iris: '#ff4fa3' }),
    mouth('duck'), hair('fringe', '#ff5ca8'), acc.phone(), acc.hearts(),
  ],
  'enemies/streamer': [ // ночной стример: синяки под глазами, гарнитура, RGB-худи
    torso({ color: '#6b3fd1', shade: '#4a2a9c' }), acc.rgb(), neck(S), head('round', S), eyes('tired', { iris: '#29b8ff' }), brows('raised'),
    mouth('grin'), hair('messy', '#2b2238'), acc.headset('#29f0ff'),
  ],
  'enemies/otlichnik': [ // круглые очки, брекеты, жилетка, карандаш за ухом
    torso({ color: '#f2f2f2', shade: '#cfcfdc' }), acc.vest('#3f9e5a'), acc.tie('#ff3355'), acc.backpack(), neck(S), head('round', S), blush(),
    eyes('glasses', { iris: '#3b6bd1' }), brows('raised'), mouth('braces'), hair('bowl', '#5a3a1e'), acc.pencil(),
  ],
  'enemies/kachok': [ // качок: майка, повязка, шейкер с протеином
    torso({ color: '#ff4f4f', wide: true, shade: '#c22f3a' }), neck(T), head('square', T), eyes('normal', { iris: '#3b2a1a' }), brows('angry'),
    mouth('grin'), hair('buzz', '#2b1a10'), acc.headband('#ffffff'), acc.shaker(),
  ],
  'enemies/fizruk': [ // физрук: кепка, усы, свисток, «спортивка» с полосками
    torso({ color: '#2f5fd1', wide: true, shade: '#1f3f9c' }), acc.stripes(), acc.whistle(), neck(W), head('round', W), eyes('normal'), brows('angry'),
    mouth('shout'), acc.mustache(), acc.cap('#ff3355'),
  ],
  'enemies/animetyan': [ // большие глаза, хвостики, бантики, матроска
    acc.twinTails('#5ab8ff'), torso({ color: '#ffffff', shade: '#d8dcf0' }), acc.sailor(), neck(S), head('round', S), blush('#ff6fa8'),
    eyes('anime', { iris: '#3d7bff' }), mouth('smile'), hair('twinBangs', '#5ab8ff'), acc.bows('#ff4fa3'), acc.sparkles(2),
  ],
  'enemies/cat': [ // кот-модель: самодовольный прищур, бабочка
    torso({ color: '#f6a33c', shade: '#d97a1e' }), acc.bowtie(), catHead(), eyes('cat'), mouth('catw'), acc.sparkles(2),
  ],
  'enemies/bloger': [ // блогер-миллионер: тёмные очки, золотой зуб, цепь, веер купюр
    torso({ color: '#ff8fd1', shade: '#d95fa8' }), acc.jacketCollar('#ffb3e2'), acc.chain(), neck(T), head('square', T), eyes('shades'),
    mouth('gold'), hair('slick', '#ffe066'), acc.money(),
  ],
  // ---- боссы ----
  'enemies/boss_sigma': [ // «каменное лицо» в деловом костюме и тёмных очках
    torso({ color: '#1f1d2b', wide: true, shade: '#0f0e18' }), path('M226,340 L256,380 L286,340 Z', '#ffffff'), acc.tie('#d9263f'),
    moaiHead(), eyes('shades'), mouth('stone'), acc.sparkles(1),
  ],
  'enemies/boss_gigachad': [ // горилла-гигачад: квадратная челюсть, бицепс, майка
    torso({ color: '#3b3746', wide: true }),
    path('M176,500 L176,410 C176,380 196,362 210,352 L230,352 C236,380 276,380 282,352 L302,352 C316,362 336,380 336,410 L336,500 Z', '#1b1530'),
    line('M206,420 Q232,436 254,420 M258,420 Q280,436 306,420', 5, '#3a3354'),
    path('M96,500 C92,440 110,392 150,380 C176,400 178,450 170,500 Z', '#4a4558'), path('M416,500 C420,440 402,392 362,380 C336,400 334,450 342,500 Z', '#4a4558'),
    gorillaHead(), eyes('hunter', { iris: '#3a2410' }), brows('heavy', '#26232f'), mouth('smirk'), acc.sparkles(3),
  ],
  'enemies/boss_king': [ // король ауры: корона, мантия, светящиеся глаза, пламя ауры
    acc.aura('#8b5cff', '#ff2e97'), acc.cape('#7a1fb8'), torso({ color: '#2b1a4a', wide: true }), acc.chain(), neck(T), head('giga', T),
    eyes('glow'), brows('cocky'), mouth('smirk'), acc.crown(),
  ],
  // ---- игрок: от нормиса до гигачада ----
  'player/stage1': [
    torso({ color: '#8f96a8', shade: '#6c7286' }), line('M226,346 L222,400 M286,346 L290,400', 6, '#e8ecf5'), neck(S), head('round', S),
    eyes('tired'), brows('flat'), mouth('flat'), hair('messy', '#6b4a2e'), acc.sweat(),
  ],
  'player/stage2': [
    torso({ color: '#5a6bd1', shade: '#3f4ea8' }), line('M226,346 L222,400 M286,346 L290,400', 6, '#e8ecf5'), neck(S), head('square', S),
    eyes('normal'), brows('raised'), mouth('mew'), hair('messy', '#6b4a2e'), acc.sparkles(1),
  ],
  'player/stage3': [
    torso({ color: '#3d7bff', shade: '#2a56c4' }), acc.jacketCollar('#9cc0ff'), neck(S), head('square', S),
    eyes('smug'), brows('cocky'), mouth('smirk'), hair('quiff', '#3a2414'), acc.sparkles(2),
  ],
  'player/stage4': [
    torso({ color: '#1b1530', wide: true }), acc.jacketCollar('#3a2f5a'), path('M232,346 L256,372 L280,346 Z', '#ffffff'), neck(S), head('square', S),
    eyes('shades'), brows('cocky'), mouth('smirk'), hair('quiff', '#f5d06b'), acc.sparkles(3),
  ],
  'player/stage5': [
    acc.aura('#ffd23f', '#ff8a3d'), torso({ color: '#12101c', wide: true }), acc.chain(), neck(S), head('giga', S),
    eyes('glow'), brows('cocky'), mouth('smirk'), hair('quiff', '#2a1a10'), acc.sparkles(4),
  ],
};

const SKINS = { 'enemies/kachok': T, 'enemies/bloger': T, 'enemies/boss_king': T, 'enemies/fizruk': W, 'enemies/cat': ['#f6a33c', '#d97a1e'] };

for (const [name, parts] of Object.entries(CHARACTERS)) {
  const file = join(ROOT, 'src/art', `${name}.svg`);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, sticker(parts, { skin: SKINS[name] || S }));
  console.log('✓', name);
}
