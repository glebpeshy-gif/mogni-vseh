// Сборщик персонажей в стиле стикеров ВК (SVG-строки).
// Используется и скриптом tools/make-art.mjs (соперники → файлы), и самой игрой
// (персонаж игрока собирается на лету: стадия + настроение + шмот).
// Все персонажи и вещи — архетипы и мемные образы, а не реальные люди, бренды или чужие герои.
const LINE = '#3d2420';   // контур
const LW = 5.5;           // толщина контура
const PINK = '#f59aa8';
const BLUSH = '#f7a3a3';

// ---------- helpers ----------
const attrs = (a) => Object.entries(a).filter(([, v]) => v != null && v !== false)
  .map(([k, v]) => `${k}="${v}"`).join(' ');
const el = (tag, a = {}, ...kids) => (kids.length ? `<${tag} ${attrs(a)}>${kids.join('')}</${tag}>` : `<${tag} ${attrs(a)}/>`);
const ink = (a) => ({ stroke: LINE, 'stroke-width': LW, 'stroke-linejoin': 'round', 'stroke-linecap': 'round', ...a });
const P = (d, fill, extra = {}) => el('path', ink({ d, fill, ...extra }));
const L = (d, w = LW, color = LINE, extra = {}) => el('path', { d, fill: 'none', stroke: color, 'stroke-width': w, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', ...extra });
const C = (cx, cy, r, fill, extra = {}) => el('circle', ink({ cx, cy, r, fill, ...extra }));
const E = (cx, cy, rx, ry, fill, extra = {}) => el('ellipse', ink({ cx, cy, rx, ry, fill, ...extra }));
const G = (a, ...kids) => el('g', a, ...kids);
const soft = (d, fill, op = 0.5) => el('path', { d, fill, opacity: op });
const lerp = (a, b, t) => a + (b - a) * t;
const f = (n) => Math.round(n * 10) / 10;

function sparkle(x, y, s = 1, color = '#fff3a8') {
  const d = `M${x},${y - 20 * s} Q${x + 4 * s},${y - 4 * s} ${x + 20 * s},${y} Q${x + 4 * s},${y + 4 * s} ${x},${y + 20 * s} Q${x - 4 * s},${y + 4 * s} ${x - 20 * s},${y} Q${x - 4 * s},${y - 4 * s} ${x},${y - 20 * s} Z`;
  return P(d, color, { 'stroke-width': 3.5 });
}
const SPARKLES = [[78, 120, 1.2], [440, 96, 0.9], [452, 300, 1], [62, 330, 0.8], [120, 40, 0.7]];
const sparkles = (n) => SPARKLES.slice(0, n).map(([x, y, s]) => sparkle(x, y, s)).join('');

// ---------- палитры ----------
const SKIN = {
  cream: ['#fde6d2', '#f2c6a8'],
  peach: ['#f9d3b4', '#e9ad86'],
  tan: ['#e9b58c', '#cf9068'],
};

// ---------- каркас чиби-человечка ----------
// Голова: центр (256, 196). Тело — «булочка» под головой. Всё зависит от c.
const HX = 256, HY = 196;

function headPath(c, rx = 132, ry = 118) {
  const k = ry * 1.32;
  const jy = HY + ry * lerp(0.62, 0.72, c);          // угол челюсти
  const jx = rx * lerp(0.86, 0.98, c);                // ширина челюсти
  const cby = HY + ry * lerp(0.98, 1.1, c);           // низ подбородка
  const cw = rx * lerp(0.28, 0.5, c);                 // ширина подбородка
  return `M${HX - rx},${HY} C${HX - rx},${HY - k} ${HX + rx},${HY - k} ${HX + rx},${HY}`
    + ` C${HX + rx},${f(HY + ry * 0.35)} ${f(HX + jx + 4)},${f(jy - 26)} ${f(HX + jx)},${f(jy)}`
    + ` Q${f(HX + cw + 30 * c + 10)},${f(cby)} ${f(HX + cw)},${f(cby)}`
    + ` L${f(HX - cw)},${f(cby)}`
    + ` Q${f(HX - cw - 30 * c - 10)},${f(cby)} ${f(HX - jx)},${f(jy)}`
    + ` C${f(HX - jx - 4)},${f(jy - 26)} ${HX - rx},${f(HY + ry * 0.35)} ${HX - rx},${HY} Z`;
}
const chinY = (c, ry = 118) => HY + ry * lerp(0.98, 1.1, c);

function body(c, { cloth, clothShade, shoes = '#f2a0ae', wide = 0 }) {
  const cw = c + wide;
  const sw = lerp(78, 150, Math.min(1, cw));   // плечи
  const bw = lerp(96, 120, Math.min(1, cw));   // низ
  const top = 292;
  const d = `M${f(HX - sw)},${top + 18} Q${f(HX - sw - 22)},392 ${f(HX - bw)},456 L${f(HX + bw)},456 Q${f(HX + sw + 22)},392 ${f(HX + sw)},${top + 18} Q${HX},${top - 18} ${f(HX - sw)},${top + 18} Z`;
  const shade = `M${f(HX + sw * 0.35)},${top + 4} Q${f(HX + sw + 10)},${top + 30} ${f(HX + sw + 14)},400 Q${f(HX + bw + 6)},440 ${f(HX + bw)},456 L${f(HX + bw * 0.45)},456 Q${f(HX + sw * 0.7)},380 ${f(HX + sw * 0.35)},${top + 4} Z`;
  return P(d, cloth) + soft(shade, clothShade, 0.6)
    + E(HX - 56, 462, 38, 22, shoes) + E(HX + 56, 462, 38, 22, shoes)
    + L(`M${HX - 70},458 L${HX - 70},468 M${HX - 52},460 L${HX - 52},470 M${HX + 42},460 L${HX + 42},470 M${HX + 60},458 L${HX + 60},468`, 3);
}

// Руки: опущенные «варежки» или, при большой гигачадности, напряжённый бицепс
function arms(c, skin, sleeve, { flex = false, wide = 0 } = {}) {
  const sw = lerp(78, 150, Math.min(1, c + wide));
  const left = P(`M${f(HX - sw + 6)},318 Q${f(HX - sw - 40)},360 ${f(HX - sw - 26)},410 Q${f(HX - sw - 8)},420 ${f(HX - sw + 12)},404 Q${f(HX - sw - 4)},366 ${f(HX - sw + 24)},336 Z`, sleeve)
    + C(f(HX - sw - 12), 412, 22, skin[0]);
  if (!flex) {
    return left + P(`M${f(HX + sw - 6)},318 Q${f(HX + sw + 40)},360 ${f(HX + sw + 26)},410 Q${f(HX + sw + 8)},420 ${f(HX + sw - 12)},404 Q${f(HX + sw + 4)},366 ${f(HX + sw - 24)},336 Z`, sleeve)
      + C(f(HX + sw + 12), 412, 22, skin[0]);
  }
  // флекс: плечо → бицепс вверх → кулак
  const x = HX + sw;
  return left
    + P(`M${f(x - 20)},318 Q${f(x + 40)},300 ${f(x + 70)},330 Q${f(x + 96)},300 ${f(x + 92)},250 Q${f(x + 70)},236 ${f(x + 52)},252 Q${f(x + 60)},290 ${f(x + 30)},300 Q${f(x + 6)},304 ${f(x - 20)},300 Z`, skin[0])
    + soft(`M${f(x + 20)},300 Q${f(x + 60)},284 ${f(x + 74)},262 Q${f(x + 84)},290 ${f(x + 66)},318 Q${f(x + 44)},316 ${f(x + 20)},300 Z`, skin[1], 0.7)
    + C(f(x + 74), 238, 26, skin[0])
    + L(`M${f(x + 62)},230 L${f(x + 86)},230 M${f(x + 60)},242 L${f(x + 88)},242`, 3);
}

function neck(c, skin) {
  if (c < 0.45) return '';
  const w = lerp(26, 70, (c - 0.45) / 0.55);
  return P(`M${f(HX - w)},280 L${f(HX - w - 6)},322 Q${HX},336 ${f(HX + w + 6)},322 L${f(HX + w)},280 Z`, skin[1])
    + (c > 0.7 ? L(`M${f(HX - w + 10)},290 Q${f(HX - 12)},318 ${f(HX - 6)},326 M${f(HX + w - 10)},290 Q${f(HX + 12)},318 ${f(HX + 6)},326`, 3, '#b07a5c') : '');
}

function headBase(c, skin, { ears = true, freckles = false, blush = true } = {}) {
  const rx = 132, ry = 118;
  const out = [];
  if (ears) out.push(E(HX - rx + 4, HY + 22, 22, 28, skin[0]), E(HX + rx - 4, HY + 22, 22, 28, skin[0]),
    L(`M${HX - rx + 2},${HY + 14} Q${HX - rx + 12},${HY + 22} ${HX - rx + 4},${HY + 34} M${HX + rx - 2},${HY + 14} Q${HX + rx - 12},${HY + 22} ${HX + rx - 4},${HY + 34}`, 3));
  out.push(P(headPath(c, rx, ry), skin[0]));
  // мягкая тень по правой стороне
  out.push(soft(`M${HX + 70},${HY - 96} C${HX + 140},${HY - 50} ${HX + 140},${HY + 40} ${HX + 118},${HY + 80} C${HX + 100},${HY + 110} ${HX + 70},${chinY(c) - 6} ${HX + 30},${chinY(c) - 4} C${HX + 96},${HY + 80} ${HX + 112},${HY - 20} ${HX + 70},${HY - 96} Z`, skin[1], 0.55));
  if (blush) out.push(E(HX - 80, HY + 52, 26, 14, BLUSH, { stroke: 'none', opacity: lerp(0.7, 0.25, c) }), E(HX + 78, HY + 52, 26, 14, BLUSH, { stroke: 'none', opacity: lerp(0.7, 0.25, c) }));
  if (freckles) out.push(...[[-92, 44], [-78, 56], [-100, 60], [86, 44], [72, 58], [96, 62]].map(([x, y]) => C(HX + x, HY + y, 3.2, '#e5a98e', { stroke: 'none' })));
  // признаки гигачада
  const cy = chinY(c);
  if (c > 0.55) out.push(L(`M${HX - 6},${f(cy - 18)} Q${HX},${f(cy - 8)} ${HX + 6},${f(cy - 18)}`, 3.5));
  if (c > 0.55) out.push(L(`M${f(HX - 104 * lerp(0.86, 0.98, c))},${f(HY + 74)} Q${HX - 70},${f(cy - 4)} ${HX - 36},${f(cy - 2)}`, 3, skin[1]));
  return out.join('');
}

// Глаза: огромные глянцевые; lid (0…1) — тяжесть век («хантер-айз»)
function eyes({ c = 0, lid = null, iris = '#3b1f2b', look = -4, size = 1, skin = SKIN.cream, sparkle: spark = false }) {
  lid = lid ?? lerp(0, 0.75, c);
  const one = (x, side) => {
    const rx = 32 * size, ry = lerp(40, 22, lid) * size;
    const y = HY + 6;
    let s = E(x, y, rx, ry, '#fff');
    s += E(x + look, y + 2, rx * 0.78, ry * 0.82, iris, { 'stroke-width': 0 });
    s += E(f(x + look - rx * 0.28), f(y - ry * 0.35), f(rx * 0.32), f(ry * 0.24), '#fff', { stroke: 'none', transform: `rotate(-20 ${x} ${y})` });
    s += C(f(x + look + rx * 0.3), f(y + ry * 0.4), f(4.5 * size), '#fff', { stroke: 'none' });
    if (spark) s += sparkle(f(x + look + 2), f(y + 4), 0.35, '#ffffff');
    if (lid > 0.05) {
      // веко: внутренний угол ниже — уверенный прищур
      const tilt = 8 * lid * side;
      const ly = y - ry * lerp(1.05, 0.3, lid);
      s += P(`M${f(x - rx - 6)},${f(ly + tilt)} Q${x},${f(ly - 10)} ${f(x + rx + 6)},${f(ly - tilt)} L${f(x + rx + 6)},${f(y - ry - 16)} L${f(x - rx - 6)},${f(y - ry - 16)} Z`, skin[0], { stroke: 'none' });
      s += L(`M${f(x - rx - 4)},${f(ly + tilt)} Q${x},${f(ly - 10)} ${f(x + rx + 4)},${f(ly - tilt)}`, LW + 2);
    }
    return s;
  };
  return one(HX - 58, 1) + one(HX + 56, -1);
}

// Брови: от приподнятых «)(» у милых до тяжёлых прямых у чада
function brows(c, color = LINE) {
  const w = lerp(4, 13, c);
  const y = HY - lerp(52, 30, c);
  const inner = lerp(-8, 8, c);   // внутренний край опускается
  return L(`M${HX - 96},${f(y - 4)} Q${HX - 66},${f(y - lerp(16, 6, c))} ${HX - 30},${f(y + inner)}`, w, color)
    + L(`M${HX + 28},${f(y + inner)} Q${HX + 64},${f(y - lerp(16, 6, c))} ${HX + 94},${f(y - 4)}`, w, color);
}

function nose(c) {
  if (c < 0.5) return P(`M${HX - 12},${HY + 40} Q${HX - 2},${HY + 32} ${HX + 10},${HY + 40} Q${HX},${HY + 50} ${HX - 12},${HY + 40} Z`, PINK, { 'stroke-width': 3.5 });
  return L(`M${HX + 4},${HY + 4} L${HX - 6},${HY + 42} Q${HX + 2},${HY + 50} ${HX + 14},${HY + 44}`, 4);
}

function mouth(kind, c = 0) {
  const y = HY + lerp(68, 78, c);
  switch (kind) {
    case 'tongue': return P(`M${HX - 34},${y - 6} Q${HX},${y + 40} ${HX + 34},${y - 6} Q${HX},${y + 6} ${HX - 34},${y - 6} Z`, '#7a2f3a')
      + P(`M${HX - 14},${y + 6} Q${HX - 18},${y + 40} ${HX},${y + 42} Q${HX + 18},${y + 40} ${HX + 14},${y + 6} Z`, '#f27f8f') + L(`M${HX},${y + 12} L${HX},${y + 30}`, 3);
    case 'wobble': return L(`M${HX - 26},${y} Q${HX - 13},${y - 6} ${HX},${y} Q${HX + 13},${y + 6} ${HX + 26},${y}`, 4.5);
    case 'o': return E(HX, y + 2, 10, 12, '#7a2f3a');
    case 'smile': return L(`M${HX - 26},${y - 4} Q${HX},${y + 18} ${HX + 26},${y - 4}`, 4.5);
    case 'shy': return L(`M${HX - 16},${y} Q${HX},${y + 10} ${HX + 16},${y}`, 4);
    case 'smirk': return L(`M${HX - 26},${y + 2} Q${HX + 4},${y + 14} ${HX + 34},${y - 10}`, 5);
    case 'grin': return P(`M${HX - 46},${y - 8} Q${HX},${y + 46} ${HX + 46},${y - 8} Q${HX},${y + 4} ${HX - 46},${y - 8} Z`, '#fff')
      + L(`M${HX - 28},${y - 2} L${HX - 26},${y + 16} M${HX - 10},${y + 1} L${HX - 9},${y + 24} M${HX + 10},${y + 1} L${HX + 9},${y + 24} M${HX + 28},${y - 2} L${HX + 26},${y + 16}`, 2.5, '#c9b9b0');
    case 'open': return P(`M${HX - 30},${y - 6} Q${HX},${y + 36} ${HX + 30},${y - 6} Q${HX},${y + 2} ${HX - 30},${y - 6} Z`, '#7a2f3a')
      + P(`M${HX - 22},${y - 3} L${HX + 22},${y - 3} L${HX + 18},${y + 6} L${HX - 18},${y + 6} Z`, '#fff', { 'stroke-width': 2.5 });
    case 'pout': return P(`M${HX - 22},${y} Q${HX - 10},${y - 12} ${HX},${y - 4} Q${HX + 10},${y - 12} ${HX + 22},${y} Q${HX + 10},${y + 14} ${HX},${y + 12} Q${HX - 10},${y + 14} ${HX - 22},${y} Z`, '#f27f8f', { 'stroke-width': 4 });
    case 'flat': return L(`M${HX - 22},${y} L${HX + 22},${y}`, 5);
    default: return '';
  }
}

function stubble(c) {
  if (c < 0.7) return '';
  const pts = [];
  for (let i = 0; i < 22; i++) {
    const a = (i / 21) * Math.PI;
    const r = 96 + (i % 3) * 8;
    pts.push(C(f(HX - Math.cos(a) * r * 0.9), f(HY + 70 + Math.sin(a) * 40), 2.2, '#b08a74', { stroke: 'none' }));
  }
  return pts.join('');
}

// ---------- причёски (под голову rx=132) ----------
function hairFringe(color, { fringeY = HY - 52, spikes = 7, side = 0, shade = '#00000022' } = {}) {
  // шапка волос с зубчатой чёлкой
  let d = `M${HX - 142},${HY + 24} C${HX - 158},${HY - 172} ${HX + 158},${HY - 172} ${HX + 142},${HY + 24}`;
  d += ` C${HX + 134},${HY - 10} ${HX + 120},${fringeY - 4} ${HX + 104},${fringeY - 10}`;
  for (let i = spikes; i >= 0; i--) {
    const x = HX - 104 + (208 * i) / spikes + side * 10;
    const y = fringeY + (i % 2 ? 30 : 0) - Math.abs(i - spikes / 2) * 2;
    d += ` L${f(x)},${f(y)}`;
  }
  d += ` C${HX - 120},${fringeY - 4} ${HX - 134},${HY - 10} ${HX - 142},${HY + 24} Z`;
  return P(d, color) + L(`M${HX - 60},${HY - 108} Q${HX - 20},${HY - 124} ${HX + 30},${HY - 116}`, 4, '#ffffff55');
}
function hairSlick(color, { line = '#00000030', height = 0 } = {}) {
  const d = `M${HX - 140},${HY + 4} C${HX - 156},${HY - 172 - height} ${HX + 156},${HY - 172 - height} ${HX + 140},${HY + 4}`
    + ` C${HX + 124},${HY - 50} ${HX + 70},${HY - 76} ${HX},${HY - 74} C${HX - 70},${HY - 76} ${HX - 124},${HY - 50} ${HX - 140},${HY + 4} Z`;
  return P(d, color) + L(`M${HX - 70},${HY - 80} Q${HX - 40},${HY - 120} ${HX + 10},${HY - 124} M${HX - 20},${HY - 78} Q${HX + 10},${HY - 116} ${HX + 70},${HY - 112} M${HX + 40},${HY - 76} Q${HX + 70},${HY - 100} ${HX + 110},${HY - 86}`, 3.5, line);
}
function hairBowl(color) {
  return P(`M${HX - 142},${HY + 40} C${HX - 160},${HY - 180} ${HX + 160},${HY - 180} ${HX + 142},${HY + 40} L${HX + 130},${HY + 40} L${HX + 124},${HY - 36} Q${HX + 20},${HY - 10} ${HX - 90},${HY - 44} L${HX - 128},${HY + 40} Z`, color)
    + L(`M${HX - 90},${HY - 44} Q${HX - 20},${HY - 90} ${HX + 80},${HY - 70}`, 3.5, '#00000025');
}

// ---------- сборка SVG ----------
function svg(parts, size = 544) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="-16 -16 544 544" width="${size}" height="${size}">
<defs>
  <filter id="sticker" x="-10%" y="-10%" width="120%" height="125%">
    <feMorphology in="SourceAlpha" operator="dilate" radius="7" result="fat"/>
    <feGaussianBlur in="fat" stdDeviation="6" result="blur"/>
    <feOffset in="blur" dx="0" dy="7" result="drop"/>
    <feFlood flood-color="#12062b" flood-opacity="0.35"/><feComposite in2="drop" operator="in" result="shadow"/>
    <feFlood flood-color="#fffaf4"/><feComposite in2="fat" operator="in" result="cut"/>
    <feMerge><feMergeNode in="shadow"/><feMergeNode in="cut"/><feMergeNode in="SourceGraphic"/></feMerge>
  </filter>
  <filter id="glow" x="-40%" y="-40%" width="180%" height="180%">
    <feGaussianBlur stdDeviation="8" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
  </filter>
</defs>
<g filter="url(#sticker)">${parts.join('')}</g>
</svg>`;
}

// Голова с наклоном: чем больше c, тем выше задран подбородок
const tilt = (c, ...kids) => G({ transform: `rotate(${f(-7 * c)} ${HX} ${HY + 60})` }, ...kids);

function aura(c1, c2) {
  return G({ filter: 'url(#glow)' },
    el('path', { d: 'M256,6 C302,80 420,70 432,182 C472,140 486,256 452,330 C504,330 474,444 402,486 L110,486 C38,444 8,330 60,330 C26,256 40,140 80,182 C92,70 210,80 256,6 Z', fill: c1, opacity: 0.8 }),
    el('path', { d: 'M256,60 C292,124 384,112 392,206 C426,186 424,282 402,330 C434,342 412,424 360,462 L152,462 C100,424 78,342 110,330 C88,282 86,186 120,206 C128,112 220,124 256,60 Z', fill: c2, opacity: 0.85 }));
}

// ---------- персонажи ----------
// c — гигачадность. Порядок в игре идёт по возрастанию.

function human({ c, skin = SKIN.cream, cloth, clothShade, sleeve, shoes, hair = '', back = '', front = '', onBody = '', face = {}, mouthKind = 'smile', extraHead = '', flex = false, wide = 0, freckles = false, behind = '', noseOff = false, beard = '', eyesSvg = null, browsSvg = null, faceOver = '', headTop = '', size = 544, spark = null }) {
  return svg([
    behind,
    back,
    body(c, { cloth, clothShade, shoes, wide }),
    arms(c, skin, sleeve || cloth, { flex, wide }),
    onBody,
    neck(c, skin),
    tilt(c,
      headBase(c, skin, { freckles }),
      stubble(beard ? 0 : c),
      beard,
      eyesSvg ?? eyes({ c, skin, ...face }),
      browsSvg ?? brows(face.browC ?? c, face.browColor),
      noseOff ? '' : nose(c),
      mouth(mouthKind, c),
      faceOver,
      hair,
      extraHead,
      headTop),
    front,
    sparkles(spark ?? Math.round(c * 4)),
  ], size);
}

export function buildEnemies() {
const CHARS = {};

// 0.00 — Нормис Петя: растерянный, капля пота, вопрос над головой
CHARS['enemies/normis'] = human({
  c: 0, cloth: '#c7c9d6', clothShade: '#a3a6b8', shoes: '#9aa0b4', mouthKind: 'wobble', freckles: true,
  hair: hairFringe('#b08766', { spikes: 6 }),
  front: P('M380,96 Q394,124 388,138 Q378,150 368,138 Q362,124 380,96 Z', '#9fdcff', { 'stroke-width': 4 })
    + P('M410,22 C450,22 478,44 478,72 C478,100 452,118 420,118 L408,140 L402,114 C378,108 364,92 364,72 C364,44 384,22 410,22 Z', '#fff')
    + el('text', { x: 420, y: 94, 'text-anchor': 'middle', 'font-family': 'Arial Black, Arial', 'font-weight': 900, 'font-size': 58, fill: LINE }, '?'),
  face: { look: 0 },
});

// 0.10 — Очкарик: огромные квадратные очки, чёлка набок, свитер с воротничком
CHARS['enemies/otlichnik'] = human({
  c: 0.1, cloth: '#2b2533', clothShade: '#16121c', shoes: '#5a4a3e', mouthKind: 'shy', freckles: true,
  back: '',
  onBody: P('M206,300 Q232,314 252,312 L240,346 Q214,336 206,300 Z', '#fffaf4') + P('M306,300 Q280,314 260,312 L272,346 Q298,336 306,300 Z', '#fffaf4'),
  hair: hairBowl('#c49a6c'),
  extraHead: el('rect', ink({ x: HX - 104, y: HY - 36, width: 92, height: 84, rx: 18, fill: '#e8f4ff', 'fill-opacity': 0.25, stroke: '#8a5a32', 'stroke-width': 10 }))
    + el('rect', ink({ x: HX + 12, y: HY - 36, width: 92, height: 84, rx: 18, fill: '#e8f4ff', 'fill-opacity': 0.25, stroke: '#8a5a32', 'stroke-width': 10 }))
    + L(`M${HX - 12},${HY} L${HX + 12},${HY}`, 9, '#8a5a32') + L(`M${HX - 84},${HY - 22} L${HX - 62},${HY - 28} M${HX + 32},${HY - 22} L${HX + 54},${HY - 28}`, 5, '#ffffff'),
  face: { size: 0.8, lid: 0.15 },
});

// 0.20 — Стример: синяки от ночных стримов, гарнитура, RGB-худи
CHARS['enemies/streamer'] = human({
  c: 0.2, cloth: '#7b56d6', clothShade: '#5a3cb0', shoes: '#2b2238', mouthKind: 'open',
  onBody: L('M190,420 L322,420', 9, '#ff5ca8') + L('M186,436 L326,436', 9, '#5cd6ff') + L('M184,452 L328,452', 9, '#c4ff6b'),
  hair: hairFringe('#3b2d44', { spikes: 8, side: 1 }),
  extraHead: L(`M${HX - 146},${HY + 10} C${HX - 150},${HY - 150} ${HX + 150},${HY - 150} ${HX + 146},${HY + 10}`, 16, LINE) + L(`M${HX - 146},${HY + 10} C${HX - 150},${HY - 146} ${HX + 150},${HY - 146} ${HX + 146},${HY + 10}`, 8, '#5cd6ff')
    + el('rect', ink({ x: HX - 170, y: HY - 22, width: 46, height: 76, rx: 20, fill: '#5cd6ff' })) + el('rect', ink({ x: HX + 124, y: HY - 22, width: 46, height: 76, rx: 20, fill: '#5cd6ff' }))
    + L(`M${HX - 150},${HY + 52} Q${HX - 130},${HY + 100} ${HX - 50},${HY + 84}`, 7) + C(HX - 46, HY + 84, 9, '#2b2238')
    + L(`M${HX - 80},${HY + 40} Q${HX - 58},${HY + 48} ${HX - 36},${HY + 40} M${HX + 36},${HY + 40} Q${HX + 56},${HY + 48} ${HX + 78},${HY + 40}`, 4, '#a68ad8'),
  face: { iris: '#2a6fa8', lid: 0.35 },
});

// 0.30 — Пацан с района: бини, пуховик, щёки, чупа-чупс
CHARS['enemies/patsan'] = human({
  c: 0.3, cloth: '#2b3a5c', clothShade: '#1b2640', shoes: '#ececec', mouthKind: 'o', skin: SKIN.peach,
  onBody: L('M186,380 L326,380 M180,410 L332,410 M176,440 L336,440', 4, '#3c4e78') + L('M256,300 L256,456', 4, '#1b2640')
    + P('M196,300 L316,300 L322,334 Q256,348 190,334 Z', '#34466e'),
  hair: P(`M${HX - 140},${HY - 20} C${HX - 154},${HY - 176} ${HX + 154},${HY - 176} ${HX + 140},${HY - 20} Z`, '#30364a')
    + [...Array(9)].map((_, i) => L(`M${HX - 110 + i * 27},${HY - 108 + Math.abs(i - 4) * 9} L${HX - 110 + i * 27},${HY - 36}`, 4, '#454c66')).join('')
    + P(`M${HX - 148},${HY - 46} L${HX + 148},${HY - 46} L${HX + 150},${HY - 8} Q${HX},${HY - 20} ${HX - 150},${HY - 8} Z`, '#454c66'),
  extraHead: L(`M${HX + 8},${HY + 80} L${HX + 86},${HY + 112}`, 7, '#fffaf4') + C(HX + 96, HY + 116, 24, '#ff7ab0')
    + L(`M${HX + 84},${HY + 108} Q${HX + 96},${HY + 98} ${HX + 108},${HY + 112} Q${HX + 100},${HY + 128} ${HX + 88},${HY + 122}`, 4, '#fff'),
  face: { iris: '#5a3a2a', lid: 0.45, skin: SKIN.peach },
});

// 0.35 — Альтушка: тёмные корни и синие пряди, подводка, колечко в носу
CHARS['enemies/tiktoker'] = human({
  c: 0.35, cloth: '#24202c', clothShade: '#121018', shoes: '#24202c', mouthKind: 'pout',
  back: P(`M${HX - 150},${HY - 10} C${HX - 176},${HY + 120} ${HX - 160},${HY + 240} ${HX - 120},${HY + 270} L${HX + 120},${HY + 270} C${HX + 160},${HY + 240} ${HX + 176},${HY + 120} ${HX + 150},${HY - 10} Z`, '#3f6fd8'),
  hair: P(`M${HX - 144},${HY + 30} C${HX - 162},${HY - 178} ${HX + 162},${HY - 178} ${HX + 144},${HY + 30} C${HX + 130},${HY - 30} ${HX + 70},${HY - 64} ${HX + 22},${HY - 66} Q${HX + 6},${HY - 70} ${HX},${HY - 90} Q${HX - 6},${HY - 70} ${HX - 22},${HY - 66} C${HX - 70},${HY - 64} ${HX - 130},${HY - 30} ${HX - 144},${HY + 30} Z`, '#5a3a2e')
    + P(`M${HX - 136},${HY - 30} C${HX - 156},${HY + 50} ${HX - 140},${HY + 120} ${HX - 110},${HY + 150} L${HX - 104},${HY + 70} C${HX - 108},${HY + 20} ${HX - 104},${HY - 10} ${HX - 96},${HY - 40} Z`, '#3f6fd8')
    + P(`M${HX + 136},${HY - 30} C${HX + 156},${HY + 50} ${HX + 140},${HY + 120} ${HX + 110},${HY + 150} L${HX + 104},${HY + 70} C${HX + 108},${HY + 20} ${HX + 104},${HY - 10} ${HX + 96},${HY - 40} Z`, '#3f6fd8'),
  extraHead: C(HX + 14, HY + 48, 7, 'none', { stroke: '#c9d1e0', 'stroke-width': 4 })
    + L(`M${HX - 92},${HY - 4} L${HX - 108},${HY - 14} M${HX + 90},${HY - 4} L${HX + 106},${HY - 14}`, 6),
  onBody: L('M216,300 Q236,312 256,312 Q276,312 296,300', 3.5, '#5a5468') + [222, 238, 256, 274, 290].map((x) => C(x, 308, 3, '#5a5468', { stroke: 'none' })).join(''),
  face: { iris: '#3a2418', lid: 0.4 },
  noseOff: true,
});

// 0.40 — Аниме-тян: огромные искрящиеся глаза, хвостики, бантики, матроска
CHARS['enemies/animetyan'] = human({
  c: 0.4, cloth: '#fffaf4', clothShade: '#e6dcef', shoes: '#3a3f7a', mouthKind: 'smile',
  back: P(`M${HX - 130},${HY - 60} C${HX - 220},${HY - 30} ${HX - 230},${HY + 130} ${HX - 170},${HY + 250} C${HX - 166},${HY + 160} ${HX - 150},${HY + 80} ${HX - 112},${HY + 30} Z`, '#7cc6ff')
    + P(`M${HX + 130},${HY - 60} C${HX + 220},${HY - 30} ${HX + 230},${HY + 130} ${HX + 170},${HY + 250} C${HX + 166},${HY + 160} ${HX + 150},${HY + 80} ${HX + 112},${HY + 30} Z`, '#7cc6ff'),
  onBody: P('M178,300 L256,370 L334,300 L360,348 L256,410 L152,348 Z', '#3a4a8a') + L('M170,332 L256,394 L342,332', 4, '#fffaf4')
    + P('M234,368 L278,368 L298,404 L256,388 L214,404 Z', '#ff6f8f'),
  hair: hairFringe('#7cc6ff', { spikes: 8 }),
  extraHead: [HX - 132, HX + 132].map((x) => P(`M${x},${HY - 92} L${x - 30},${HY - 112} L${x - 30},${HY - 72} Z M${x},${HY - 92} L${x + 30},${HY - 112} L${x + 30},${HY - 72} Z`, '#ff7ab0') + C(x, HY - 92, 10, '#ff7ab0')).join(''),
  face: { iris: '#3d6fe0', lid: 0.1, size: 1.1, sparkle: true },
});

// 0.55 — Кот-красавчик: пухлый котик, но с точёными скулами, прищуром и губками
CHARS['enemies/cat'] = (() => {
  const fur = '#f6b25a', shade = '#e08a32', light = '#fde4c0', c = 0.55;
  return svg([
    P('M330,420 C420,430 470,380 462,330 C458,300 430,300 432,326 C436,360 400,388 330,392 Z', fur) + L('M440,330 L452,324 M446,350 L460,348 M430,370 L444,374', 4, shade),
    P('M110,300 C90,380 140,466 256,468 C372,466 422,380 402,300 C390,250 330,226 256,226 C182,226 122,250 110,300 Z', fur),
    soft('M330,240 C392,264 412,330 398,390 C386,440 340,464 300,466 C360,420 378,330 330,240 Z', shade, 0.5),
    E(256, 380, 92, 72, light, { stroke: 'none' }),
    L('M206,330 Q218,370 206,410 M306,330 Q294,370 306,410', 3.5, shade),
    E(186, 462, 34, 20, PINK) + E(326, 462, 34, 20, PINK) + L('M176,458 L176,468 M196,458 L196,468 M316,458 L316,468 M336,458 L336,468', 3),
    tilt(c,
      P('M138,128 L132,34 L212,86 Z', fur), P('M374,128 L380,34 L300,86 Z', fur),
      P('M152,108 L150,62 L190,90 Z', PINK, { 'stroke-width': 3.5 }), P('M360,108 L362,62 L322,90 Z', PINK, { 'stroke-width': 3.5 }),
      P(`M${HX - 150},${HY + 6} C${HX - 156},${HY - 110} ${HX + 156},${HY - 110} ${HX + 150},${HY + 6} C${HX + 150},${HY + 80} ${HX + 120},${HY + 118} ${HX + 60},${HY + 128} L${HX - 60},${HY + 128} C${HX - 120},${HY + 118} ${HX - 150},${HY + 80} ${HX - 150},${HY + 6} Z`, fur),
      L(`M${HX - 30},${HY - 104} L${HX - 24},${HY - 70} M${HX},${HY - 108} L${HX},${HY - 70} M${HX + 30},${HY - 104} L${HX + 24},${HY - 70}`, 7, shade),
      E(HX, HY + 76, 82, 52, light, { stroke: 'none' }),
      L(`M${HX - 128},${HY + 4} Q${HX - 118},${HY + 70} ${HX - 60},${HY + 110} M${HX + 128},${HY + 4} Q${HX + 118},${HY + 70} ${HX + 60},${HY + 110}`, 4.5, shade),
      L(`M${HX - 108},${HY + 50} Q${HX - 92},${HY + 84} ${HX - 64},${HY + 94} M${HX + 108},${HY + 50} Q${HX + 92},${HY + 84} ${HX + 64},${HY + 94}`, 3.5, shade),
      L(`M${HX - 28},${HY + 118} Q${HX},${HY + 128} ${HX + 28},${HY + 118}`, 4, shade),
      eyes({ c, lid: 0.7, iris: '#7a9a2a', skin: [fur, shade] }),
      L(`M${HX - 94},${HY - 34} L${HX - 30},${HY - 26} M${HX + 28},${HY - 26} L${HX + 92},${HY - 34}`, 8, shade),
      P(`M${HX - 12},${HY + 40} L${HX + 12},${HY + 40} L${HX},${HY + 54} Z`, PINK, { 'stroke-width': 3.5 }),
      mouth('pout', 0.4),
      L(`M${HX - 70},${HY + 66} L${HX - 150},${HY + 52} M${HX - 70},${HY + 80} L${HX - 152},${HY + 86} M${HX + 70},${HY + 66} L${HX + 150},${HY + 52} M${HX + 70},${HY + 80} L${HX + 152},${HY + 86}`, 3.5)),
    sparkles(2),
  ]);
})();

// 0.65 — Блогер-миллионер: тёмные очки, зачёс, золотая цепь, веер купюр
CHARS['enemies/bloger'] = human({
  c: 0.65, skin: SKIN.tan, cloth: '#ff9fd0', clothShade: '#e070a8', sleeve: '#ff9fd0', shoes: '#fffaf4', mouthKind: 'smirk',
  onBody: L('M196,304 Q256,388 316,304', 11, '#ffd23f') + L('M196,304 Q256,388 316,304', 2.5, LINE) + C(256, 376, 22, '#ffd23f')
    + el('text', { x: 256, y: 386, 'text-anchor': 'middle', 'font-family': 'Arial Black, Arial', 'font-weight': 900, 'font-size': 26, fill: LINE }, '$')
    ,
  front: [-30, -10, 10, 30].map((a) => el('rect', ink({ x: 92, y: 330, width: 50, height: 92, rx: 6, fill: '#7be3a0', 'stroke-width': 4, transform: `rotate(${a} 117 422)` }))).join(''),
  hair: hairSlick('#ffe08a', { height: 10 }),
  extraHead: P(`M${HX - 116},${HY - 18} L${HX + 114},${HY - 18} L${HX + 108},${HY + 16} Q${HX + 100},${HY + 40} ${HX + 62},${HY + 40} Q${HX + 26},${HY + 40} ${HX + 16},${HY + 14} L${HX + 6},${HY - 2} L${HX - 6},${HY - 2} L${HX - 16},${HY + 14} Q${HX - 26},${HY + 40} ${HX - 62},${HY + 40} Q${HX - 100},${HY + 40} ${HX - 110},${HY + 16} Z`, '#23202c')
    + el('path', { d: `M${HX - 96},${HY - 8} L${HX - 66},${HY - 8} L${HX - 86},${HY + 26} Z M${HX + 34},${HY - 8} L${HX + 64},${HY - 8} L${HX + 44},${HY + 26} Z`, fill: '#9fe8ff', opacity: 0.8 }),
  face: { lid: 0.6, skin: SKIN.tan },
});

// 0.75 — Качок из зала: повязка, майка, бицепс, шейкер
CHARS['enemies/kachok'] = human({
  c: 0.75, skin: SKIN.tan, cloth: '#ff6b6b', clothShade: '#d94a55', sleeve: SKIN.tan[0], shoes: '#fffaf4', mouthKind: 'grin', flex: true,
  onBody: P('M186,300 L186,330 M326,300 L326,330', 'none') + L('M206,350 Q232,366 252,350 M260,350 Q280,366 306,350', 4, '#c23a48'),
  hair: hairFringe('#3a2618', { spikes: 10, fringeY: HY - 70 }),
  extraHead: P(`M${HX - 140},${HY - 66} Q${HX},${HY - 104} ${HX + 140},${HY - 66} L${HX + 142},${HY - 40} Q${HX},${HY - 78} ${HX - 142},${HY - 40} Z`, '#fffaf4')
    + L(`M${HX - 40},${HY - 86} L${HX - 34},${HY - 62} M${HX + 34},${HY - 86} L${HX + 40},${HY - 62}`, 3, '#ff6b6b'),
  face: { skin: SKIN.tan, iris: '#4a2a18' },
});

// 0.85 — Чад-викинг («Yes»-чад): светлый андеркат, огромная борода, задранный подбородок
CHARS['enemies/chad'] = human({
  c: 0.85, cloth: '#2b2833', clothShade: '#16141c', shoes: '#4a3a2a', mouthKind: 'flat', skin: SKIN.cream,
  beard: P(`M${HX - 130},${HY + 30} C${HX - 136},${HY + 140} ${HX - 70},${HY + 190} ${HX},${HY + 196} C${HX + 70},${HY + 190} ${HX + 136},${HY + 140} ${HX + 130},${HY + 30} C${HX + 110},${HY + 80} ${HX + 60},${HY + 96} ${HX},${HY + 92} C${HX - 60},${HY + 96} ${HX - 110},${HY + 80} ${HX - 130},${HY + 30} Z`, '#e0a54a')
    + L(`M${HX - 90},${HY + 100} Q${HX - 84},${HY + 140} ${HX - 60},${HY + 168} M${HX - 40},${HY + 112} Q${HX - 36},${HY + 150} ${HX - 20},${HY + 180} M${HX + 20},${HY + 112} Q${HX + 24},${HY + 150} ${HX + 34},${HY + 180} M${HX + 76},${HY + 104} Q${HX + 84},${HY + 140} ${HX + 70},${HY + 164}`, 4, '#b57b2a')
    + P(`M${HX - 56},${HY + 64} Q${HX - 28},${HY + 46} ${HX},${HY + 58} Q${HX + 28},${HY + 46} ${HX + 56},${HY + 64} Q${HX + 30},${HY + 80} ${HX},${HY + 72} Q${HX - 30},${HY + 80} ${HX - 56},${HY + 64} Z`, '#e0a54a'),
  hair: P(`M${HX - 120},${HY - 50} C${HX - 130},${HY - 150} ${HX + 130},${HY - 150} ${HX + 120},${HY - 50} C${HX + 90},${HY - 78} ${HX - 90},${HY - 78} ${HX - 120},${HY - 50} Z`, '#f2cc6e')
    + L(`M${HX - 90},${HY - 92} Q${HX - 20},${HY - 128} ${HX + 80},${HY - 104} M${HX - 70},${HY - 74} Q${HX},${HY - 108} ${HX + 100},${HY - 82} M${HX - 100},${HY - 112} Q${HX - 30},${HY - 140} ${HX + 50},${HY - 128}`, 3.5, '#c99a3a')
    + el('path', { d: `M${HX - 138},${HY - 40} Q${HX - 130},${HY - 60} ${HX - 118},${HY - 54} L${HX - 126},${HY + 10} Z M${HX + 138},${HY - 40} Q${HX + 130},${HY - 60} ${HX + 118},${HY - 54} L${HX + 126},${HY + 10} Z`, fill: '#f6e2a8', opacity: 0.9 }),
  face: { iris: '#4a8fe0', lid: 0.75, browColor: '#c99a3a' },
});

// 0.90 — Сигма-босс: зализанные волосы, костюм, красный галстук, наушники, пустой взгляд
CHARS['enemies/boss_sigma'] = human({
  c: 0.9, cloth: '#1d1c26', clothShade: '#0c0b12', sleeve: '#1d1c26', shoes: '#1d1c26', mouthKind: 'flat',
  onBody: P('M214,300 L256,372 L298,300 Z', '#fffaf4') + P('M244,312 L268,312 L276,334 L264,420 L248,420 L236,334 Z', '#d0213a')
    + [[252, 344], [262, 364], [250, 384], [260, 402]].map(([x, y]) => C(x, y, 3, '#7a0a1c', { stroke: 'none' })).join('')
    + P('M214,300 L252,388 L228,456 L166,456 C166,380 186,320 214,300 Z', '#2a2936') + P('M298,300 L260,388 L284,456 L346,456 C346,380 326,320 298,300 Z', '#2a2936')
    + L('M120,230 Q130,330 230,350', 3.5, '#111'),
  hair: hairSlick('#3b2416', { height: 16 }),
  extraHead: L(`M${HX - 146},${HY + 20} C${HX - 156},${HY - 150} ${HX + 156},${HY - 150} ${HX + 146},${HY + 20}`, 7, '#15141c')
    + E(HX - 142, HY + 22, 22, 34, '#1d1c26') + E(HX + 142, HY + 22, 22, 34, '#1d1c26'),
  face: { iris: '#2a1a12', lid: 0.6, look: 0, size: 0.75 },
});

// 1.00 — Гигачад: борода, огромная улыбка, зачёс, плечи-шкаф, бицепс
CHARS['enemies/boss_gigachad'] = human({
  c: 1, skin: SKIN.tan, cloth: '#1f1c26', clothShade: '#0e0c14', sleeve: SKIN.tan[0], shoes: '#1f1c26', mouthKind: 'grin', flex: true, wide: 0.2,
  beard: P(`M${HX - 132},${HY + 30} C${HX - 134},${HY + 120} ${HX - 80},${HY + 160} ${HX},${HY + 164} C${HX + 80},${HY + 160} ${HX + 134},${HY + 120} ${HX + 132},${HY + 30} C${HX + 112},${HY + 64} ${HX + 80},${HY + 72} ${HX + 60},${HY + 70} C${HX + 40},${HY + 110} ${HX - 40},${HY + 110} ${HX - 60},${HY + 70} C${HX - 80},${HY + 72} ${HX - 112},${HY + 64} ${HX - 132},${HY + 30} Z`, '#4a2c1c')
    + P(`M${HX - 50},${HY + 66} Q${HX},${HY + 48} ${HX + 50},${HY + 66} Q${HX + 26},${HY + 74} ${HX},${HY + 68} Q${HX - 26},${HY + 74} ${HX - 50},${HY + 66} Z`, '#4a2c1c'),
  hair: hairSlick('#2e1c12', { height: 20 }),
  onBody: L('M200,352 Q228,372 252,356 M260,356 Q284,372 312,352', 4, '#3a3646'),
  face: { skin: SKIN.tan, iris: '#4a2a18', lid: 0.55 },
});

// 1.00+ — Король ауры: корона, мантия, светящиеся глаза, пламя ауры
CHARS['enemies/boss_king'] = human({
  c: 1, skin: SKIN.peach, cloth: '#3a2466', clothShade: '#24154a', shoes: '#ffd23f', mouthKind: 'smirk', wide: 0.1,
  behind: aura('#9b6bff', '#ff5ca8') + P('M110,310 C80,380 70,440 64,470 L448,470 C442,440 432,380 402,310 Z', '#8a2fd0'),
  onBody: L('M196,304 Q256,388 316,304', 11, '#ffd23f') + L('M196,304 Q256,388 316,304', 2.5, LINE) + C(256, 376, 20, '#ff5ca8'),
  hair: hairSlick('#2a1a12', { height: 6 }),
  extraHead: P(`M${HX - 96},${HY - 96} L${HX - 76},${HY - 178} L${HX - 36},${HY - 122} L${HX},${HY - 196} L${HX + 36},${HY - 122} L${HX + 76},${HY - 178} L${HX + 96},${HY - 96} Z`, '#ffd23f')
    + P(`M${HX - 96},${HY - 96} L${HX + 96},${HY - 96} L${HX + 92},${HY - 72} L${HX - 92},${HY - 72} Z`, '#ffb000')
    + C(HX, HY - 146, 12, '#ff5ca8') + C(HX - 50, HY - 112, 8, '#5cd6ff') + C(HX + 50, HY - 112, 8, '#5cd6ff')
    + [HX - 58, HX + 56].map((x) => el('ellipse', { cx: x, cy: HY + 2, rx: 38, ry: 22, fill: '#fff3a8', opacity: 0.6, filter: 'url(#glow)' })).join(''),
  face: { skin: SKIN.peach, iris: '#ffd23f', lid: 0.6 },
});
return CHARS;
}


// =====================================================================
// ИГРОК: стадии прокачки + настроение + шмот
// =====================================================================

// Где левая рука («в руке» держит предмет)
const handPos = (c, wide = 0) => [HX - lerp(78, 150, Math.min(1, c + wide)) - 12, 412];

// Стадии: каждая — отдельный узнаваемый образ
export const PLAYER_STAGE_LOOKS = [
  { // 1. Нормис: сутулый, серое худи с капюшоном, синяки, капля пота
    c: 0, cloth: '#a9adbd', shade: '#8a8ea2', hair: ['fringe', '#8a5a3a'], mouth: 'wobble', lid: 0.35, freckles: true,
    back: P(`M${HX - 120},300 C${HX - 150},250 ${HX - 120},220 ${HX - 80},230 L${HX + 80},230 C${HX + 120},220 ${HX + 150},250 ${HX + 120},300 Z`, '#999db0'),
    onBody: L('M226,306 L222,360 M286,306 L290,360', 5, '#e8ecf5') + P('M200,410 L312,410 L306,450 L206,450 Z', '#9a9eb2'),
    face: L(`M${HX - 80},${HY + 40} Q${HX - 58},${HY + 48} ${HX - 36},${HY + 40} M${HX + 36},${HY + 40} Q${HX + 56},${HY + 48} ${HX + 78},${HY + 40}`, 4, '#b9a3d6'),
    front: P('M384,100 Q398,128 392,142 Q382,154 372,142 Q366,128 384,100 Z', '#9fdcff', { 'stroke-width': 4 }),
  },
  { // 2. Мьюер: спортивка, палец у челюсти, губы «мьюинг»
    c: 0.2, cloth: '#3f6fd8', shade: '#2c52b0', hair: ['fringe', '#7a4e30'], mouth: 'mew', lid: 0.2,
    onBody: L('M256,300 L256,456', 4, '#2c52b0') + L('M150,330 L166,456 M362,330 L346,456', 6, '#ffffff'),
    front: P(`M${HX + 150},330 Q${HX + 120},360 ${HX + 70},340 Q${HX + 50},328 ${HX + 40},${HY + 128}`, 'none', { stroke: '#3f6fd8', 'stroke-width': 22 })
      + C(HX + 40, HY + 122, 18, SKIN.cream[0]) + L(`M${HX + 36},${HY + 104} L${HX + 44},${HY + 84}`, 9, SKIN.cream[0]) + L(`M${HX + 36},${HY + 104} L${HX + 44},${HY + 84}`, 3),
  },
  { // 3. Луксмаксер: патчи под глазами, повязка для ухода, зеркальце
    c: 0.4, cloth: '#ffb3d1', shade: '#e98fb2', hair: ['fringe', '#5e3a22'], mouth: 'smile', lid: 0.3,
    onBody: P('M206,300 L256,380 L306,300', 'none', { stroke: '#e98fb2', 'stroke-width': 8 }),
    face: [HX - 58, HX + 56].map((x) => P(`M${x - 30},${HY + 34} Q${x},${HY + 64} ${x + 30},${HY + 34} Q${x},${HY + 48} ${x - 30},${HY + 34} Z`, '#ff9fc2', { 'stroke-width': 3.5 })).join(''),
    top: P(`M${HX - 140},${HY - 66} Q${HX},${HY - 108} ${HX + 140},${HY - 66} L${HX + 142},${HY - 36} Q${HX},${HY - 78} ${HX - 142},${HY - 36} Z`, '#fffaf4')
      + P(`M${HX + 96},${HY - 84} Q${HX + 130},${HY - 120} ${HX + 150},${HY - 92} Q${HX + 130},${HY - 70} ${HX + 96},${HY - 84} Z M${HX + 96},${HY - 84} Q${HX + 70},${HY - 124} ${HX + 50},${HY - 96} Q${HX + 70},${HY - 74} ${HX + 96},${HY - 84} Z`, '#fffaf4'),
    item: (x, y) => L(`M${x},${y + 4} L${x},${y + 46}`, 10, '#ffb3d1') + L(`M${x},${y + 4} L${x},${y + 46}`, 3) + C(x, y - 30, 34, '#ffd6e6') + C(x, y - 30, 24, '#d6f2ff', { 'stroke-width': 3 }) + L(`M${x - 12},${y - 42} L${x - 2},${y - 50}`, 4, '#fff'),
  },
  { // 4. Красавчик: кок, джинсовка, ухмылка
    c: 0.6, cloth: '#5b86d6', shade: '#3f66b4', hair: ['quiff', '#4a2c18'], mouth: 'smirk', lid: 0.45,
    onBody: P('M206,300 L240,370 L256,326 L272,370 L306,300 L282,294 L256,318 L230,294 Z', '#8fb0ec') + L('M256,330 L256,456', 4, '#3f66b4')
      + L('M186,380 L222,380 M290,380 L326,380', 4, '#8fb0ec'),
  },
  { // 5. Чад: тёмные очки, кожанка, бицепс
    c: 0.8, cloth: '#26222e', shade: '#121018', hair: ['quiff', '#f0c96a'], mouth: 'smirk', lid: 0.6, flex: true, shades: true,
    onBody: P('M206,300 L240,370 L256,330 L272,370 L306,300 L282,294 L256,318 L230,294 Z', '#3c3646') + L('M262,330 L270,456', 4, '#9a9aa8')
      + P('M232,300 L256,326 L280,300 Z', '#fffaf4'),
  },
  { // 6. Гигачад: борода, улыбка до ушей, цепь, золотая аура
    c: 1, cloth: '#16141c', shade: '#08070c', hair: ['slick', '#2a1a12'], mouth: 'grin', lid: 0.55, flex: true, wide: 0.15, aura: true, iris: '#ffb000',
    onBody: L('M196,304 Q256,388 316,304', 11, '#ffd23f') + L('M196,304 Q256,388 316,304', 2.5, LINE) + C(256, 376, 20, '#ffd23f'),
    beard: true,
  },
];

const SHADES = P(`M${HX - 116},${HY - 18} L${HX + 114},${HY - 18} L${HX + 108},${HY + 16} Q${HX + 100},${HY + 40} ${HX + 62},${HY + 40} Q${HX + 26},${HY + 40} ${HX + 16},${HY + 14} L${HX + 6},${HY - 2} L${HX - 6},${HY - 2} L${HX - 16},${HY + 14} Q${HX - 26},${HY + 40} ${HX - 62},${HY + 40} Q${HX - 100},${HY + 40} ${HX - 110},${HY + 16} Z`, '#23202c')
  + el('path', { d: `M${HX - 96},${HY - 8} L${HX - 66},${HY - 8} L${HX - 86},${HY + 26} Z M${HX + 34},${HY - 8} L${HX + 64},${HY - 8} L${HX + 44},${HY + 26} Z`, fill: '#9fe8ff', opacity: 0.8 });

const GIGA_BEARD = P(`M${HX - 132},${HY + 30} C${HX - 134},${HY + 120} ${HX - 80},${HY + 160} ${HX},${HY + 164} C${HX + 80},${HY + 160} ${HX + 134},${HY + 120} ${HX + 132},${HY + 30} C${HX + 112},${HY + 64} ${HX + 80},${HY + 72} ${HX + 60},${HY + 70} C${HX + 40},${HY + 110} ${HX - 40},${HY + 110} ${HX - 60},${HY + 70} C${HX - 80},${HY + 72} ${HX - 112},${HY + 64} ${HX - 132},${HY + 30} Z`, '#3a2416')
  + P(`M${HX - 50},${HY + 66} Q${HX},${HY + 48} ${HX + 50},${HY + 66} Q${HX + 26},${HY + 74} ${HX},${HY + 68} Q${HX - 26},${HY + 74} ${HX - 50},${HY + 66} Z`, '#3a2416');

// ---------- настроения ----------
function moodFace(mood, look) {
  const out = {};
  if (mood === 'mog') {
    out.face = { lid: Math.max(look.lid ?? 0, 0.6), look: 8 };
    out.browC = Math.min(1, look.c + 0.4);
    out.mouth = 'smirk';
  } else if (mood === 'win') {
    out.eyesSvg = [HX - 58, HX + 56].map((x) => L(`M${x - 28},${HY + 12} Q${x},${HY - 22} ${x + 28},${HY + 12}`, 8)).join('');
    out.mouth = look.c < 0.7 ? 'tongue' : 'grin';
    out.spark = 4;
  } else if (mood === 'sad') {
    out.face = { lid: 0, look: 0, size: 1.05 };
    out.browsSvg = L(`M${HX - 98},${HY - 30} Q${HX - 66},${HY - 34} ${HX - 32},${HY - 58}`, 7) + L(`M${HX + 30},${HY - 58} Q${HX + 64},${HY - 34} ${HX + 96},${HY - 30}`, 7);
    out.mouth = 'wobble';
    out.tear = P(`M${HX - 76},${HY + 40} Q${HX - 64},${HY + 64} ${HX - 70},${HY + 76} Q${HX - 82},${HY + 82} ${HX - 86},${HY + 68} Q${HX - 86},${HY + 54} ${HX - 76},${HY + 40} Z`, '#9fdcff', { 'stroke-width': 3.5 });
    out.spark = 0;
  }
  return out;
}

// ---------- ШМОТ: мемы СНГ 2025–26 (образы, без брендов и реальных людей) ----------
const HATS = {
  ushanka: () => P(`M${HX - 150},${HY - 10} C${HX - 162},${HY - 196} ${HX + 162},${HY - 196} ${HX + 150},${HY - 10} Z`, '#6b4a3a')
    + el('rect', ink({ x: HX - 172, y: HY - 30, width: 44, height: 120, rx: 22, fill: '#d8c3a5' }))
    + el('rect', ink({ x: HX + 128, y: HY - 30, width: 44, height: 120, rx: 22, fill: '#d8c3a5' }))
    + P(`M${HX - 156},${HY - 54} Q${HX},${HY - 108} ${HX + 156},${HY - 54} L${HX + 158},${HY - 14} Q${HX},${HY - 66} ${HX - 158},${HY - 14} Z`, '#d8c3a5')
    + L(`M${HX - 120},${HY - 60} L${HX - 116},${HY - 40} M${HX - 70},${HY - 76} L${HX - 68},${HY - 54} M${HX + 70},${HY - 76} L${HX + 68},${HY - 54} M${HX + 120},${HY - 60} L${HX + 116},${HY - 40}`, 3, '#b39b7a')
    + C(HX, HY - 72, 14, '#ffd23f'),
  cap_back: () => P(`M${HX + 96},${HY - 116} Q${HX + 196},${HY - 150} ${HX + 214},${HY - 106} Q${HX + 176},${HY - 90} ${HX + 118},${HY - 86} Z`, '#2b2b3a')
    + P(`M${HX - 140},${HY - 30} C${HX - 150},${HY - 182} ${HX + 150},${HY - 182} ${HX + 140},${HY - 30} Q${HX},${HY - 70} ${HX - 140},${HY - 30} Z`, '#ff4f6b')
    + el('rect', ink({ x: HX - 26, y: HY - 74, width: 52, height: 18, rx: 6, fill: '#2b2b3a', 'stroke-width': 4 }))
    + C(HX, HY - 160, 9, '#ff4f6b'),
  cat_ears: () => L(`M${HX - 130},${HY - 30} C${HX - 136},${HY - 160} ${HX + 136},${HY - 160} ${HX + 130},${HY - 30}`, 12, '#2b2238')
    + P(`M${HX - 110},${HY - 100} L${HX - 128},${HY - 186} L${HX - 52},${HY - 132} Z`, '#2b2238') + P(`M${HX - 106},${HY - 112} L${HX - 116},${HY - 162} L${HX - 72},${HY - 132} Z`, '#ff8fb1', { 'stroke-width': 3 })
    + P(`M${HX + 110},${HY - 100} L${HX + 128},${HY - 186} L${HX + 52},${HY - 132} Z`, '#2b2238') + P(`M${HX + 106},${HY - 112} L${HX + 116},${HY - 162} L${HX + 72},${HY - 132} Z`, '#ff8fb1', { 'stroke-width': 3 }),
  pompom: () => P(`M${HX - 142},${HY - 34} C${HX - 152},${HY - 196} ${HX + 152},${HY - 196} ${HX + 142},${HY - 34} Z`, '#e8574f')
    + L(`M${HX - 120},${HY - 100} Q${HX},${HY - 140} ${HX + 120},${HY - 100}`, 10, '#fffaf4')
    + P(`M${HX - 150},${HY - 60} Q${HX},${HY - 104} ${HX + 150},${HY - 60} L${HX + 152},${HY - 20} Q${HX},${HY - 64} ${HX - 152},${HY - 20} Z`, '#fffaf4')
    + C(HX, HY - 168, 30, '#fffaf4') + L(`M${HX - 14},${HY - 176} L${HX + 10},${HY - 160} M${HX + 12},${HY - 180} L${HX - 6},${HY - 156}`, 3, '#d8d0c8'),
  halo: () => G({ filter: 'url(#glow)' }, el('ellipse', { cx: HX, cy: HY - 156, rx: 92, ry: 24, fill: 'none', stroke: '#ffe066', 'stroke-width': 14 }))
    + el('ellipse', { cx: HX, cy: HY - 156, rx: 92, ry: 24, fill: 'none', stroke: LINE, 'stroke-width': 3 })
    + el('text', { x: HX + 112, y: HY - 170, 'font-family': 'Arial Black, Arial', 'font-weight': 900, 'font-size': 28, fill: '#ffe066', stroke: LINE, 'stroke-width': 2 }, '+1000'),
};

const GLASSES = {
  pixel: () => el('rect', { x: HX - 118, y: HY - 16, width: 236, height: 14, fill: '#111' })
    + [HX - 108, HX + 22].map((x) => el('rect', { x, y: HY - 4, width: 86, height: 16, fill: '#111' }) + el('rect', { x: x + 8, y: HY + 12, width: 70, height: 14, fill: '#111' }) + el('rect', { x: x + 18, y: HY + 26, width: 50, height: 10, fill: '#111' })
      + el('rect', { x: x + 12, y: HY - 2, width: 12, height: 8, fill: '#fff' }) + el('rect', { x: x + 26, y: HY + 8, width: 10, height: 8, fill: '#fff' })).join(''),
  hearts: () => [HX - 58, HX + 56].map((x) => P(`M${x},${HY + 36} C${x - 60},${HY} ${x - 44},${HY - 46} ${x},${HY - 20} C${x + 44},${HY - 46} ${x + 60},${HY} ${x},${HY + 36} Z`, '#ff4f8b', { 'fill-opacity': 0.9 })
    + L(`M${x - 26},${HY - 8} Q${x - 18},${HY - 20} ${x - 6},${HY - 14}`, 4, '#fff')).join('') + L(`M${HX - 14},${HY - 8} Q${HX},${HY - 16} ${HX + 14},${HY - 8}`, 5),
  tiny: () => [HX - 58, HX + 56].map((x) => E(x, HY + 6, 30, 18, '#1d1a26') + L(`M${x - 16},${HY} L${x - 4},${HY - 4}`, 3, '#9fe8ff')).join('')
    + L(`M${HX - 28},${HY + 2} Q${HX},${HY - 10} ${HX + 26},${HY + 2} M${HX - 88},${HY + 2} L${HX - 132},${HY - 8} M${HX + 86},${HY + 2} L${HX + 130},${HY - 8}`, 3.5),
  nerd: () => [HX - 58, HX + 56].map((x) => C(x, HY + 6, 46, '#e8f4ff', { 'fill-opacity': 0.2, 'stroke-width': 7 }) + L(`M${x - 26},${HY - 16} L${x - 12},${HY - 26}`, 4, '#fff')).join('')
    + L(`M${HX - 12},${HY + 2} L${HX + 10},${HY + 2} M${HX - 104},${HY} L${HX - 132},${HY - 10} M${HX + 102},${HY} L${HX + 130},${HY - 10}`, 7),
  laser: () => G({ filter: 'url(#glow)' }, ...[[HX - 58, -1], [HX + 56, 1]].map(([x, s]) => el('path', { d: `M${x},${HY + 4} L${x + s * 260},${HY - 60} L${x + s * 260},${HY - 20} Z`, fill: '#ff2e2e', opacity: 0.85 }) + el('circle', { cx: x, cy: HY + 4, r: 20, fill: '#ff6b6b' }))),
};

const TOPS = {
  hoodie_sigma: { cloth: '#1b1922', shade: '#0c0b12', decor: L('M236,306 L232,350 M276,306 L280,350', 5, '#d8d4e4')
    + el('text', { x: 256, y: 428, 'text-anchor': 'middle', 'font-family': 'Arial Black, Arial', 'font-weight': 900, 'font-size': 64, fill: '#fffaf4' }, 'Σ') },
  tracksuit: { cloth: '#26369c', shade: '#18237a', decor: L('M256,306 L256,456', 4, '#c9cfe8') + L('M150,330 L166,456 M362,330 L346,456', 7, '#fffaf4') + L('M164,330 L180,456 M348,330 L332,456', 7, '#fffaf4')
    + P('M214,298 L298,298 L292,320 L220,320 Z', '#26369c') },
  grandpa: { cloth: '#c23a3a', shade: '#962a2a', decor: L('M150,372 L176,392 L202,372 L228,392 L256,372 L282,392 L308,372 L334,392 L362,372', 7, '#fffaf4')
    + [[190, 420], [256, 424], [322, 420]].map(([x, y]) => P(`M${x},${y - 14} L${x + 12},${y} L${x},${y + 14} L${x - 12},${y} Z`, '#fffaf4', { 'stroke-width': 3 })).join('')
    + P('M210,298 Q256,318 302,298 L298,316 Q256,334 214,316 Z', '#962a2a') },
  suit: { cloth: '#24232e', shade: '#121119', decor: P('M214,300 L256,372 L298,300 Z', '#fffaf4') + P('M244,312 L268,312 L276,334 L264,420 L248,420 L236,334 Z', '#7b4fd6')
    + P('M214,300 L252,388 L228,456 L166,456 C166,380 186,320 214,300 Z', '#2e2c3a') + P('M298,300 L260,388 L284,456 L346,456 C346,380 326,320 298,300 Z', '#2e2c3a') },
  tee67: { cloth: '#ffd23f', shade: '#e0ad1e', decor: el('text', { x: 256, y: 432, 'text-anchor': 'middle', 'font-family': 'Arial Black, Arial', 'font-weight': 900, 'font-size': 70, fill: LINE }, '67') },
};

const HAND = {
  dubai: (x, y) => G({ transform: `rotate(-18 ${x} ${y})` },
    el('rect', ink({ x: x - 30, y: y - 92, width: 60, height: 100, rx: 6, fill: '#6b3a24' })),
    P(`M${x - 30},${y - 92} L${x - 18},${y - 104} L${x - 4},${y - 92} L${x + 10},${y - 106} L${x + 30},${y - 92} L${x + 30},${y - 70} L${x - 30},${y - 70} Z`, '#8fd14f'),
    L(`M${x - 24},${y - 82} L${x - 12},${y - 78} M${x},${y - 84} L${x + 10},${y - 80}`, 3, '#5a9a2a'),
    el('rect', ink({ x: x - 32, y: y - 30, width: 64, height: 40, rx: 4, fill: '#ffd23f', 'stroke-width': 4 }))),
  matcha: (x, y) => P(`M${x - 30},${y - 90} L${x + 30},${y - 90} L${x + 22},${y + 6} L${x - 22},${y + 6} Z`, '#e8f6e0', { 'fill-opacity': 0.9 })
    + P(`M${x - 27},${y - 60} L${x + 27},${y - 60} L${x + 22},${y + 4} L${x - 22},${y + 4} Z`, '#8cc56a', { stroke: 'none' })
    + P(`M${x - 34},${y - 92} Q${x},${y - 122} ${x + 34},${y - 92} Z`, '#fffaf4') + L(`M${x + 6},${y - 110} L${x + 20},${y - 150}`, 7, '#7bc85a'),
  bag: (x, y) => P(`M${x - 46},${y - 80} L${x + 46},${y - 80} L${x + 52},${y + 10} L${x - 52},${y + 10} Z`, '#f4f4f8')
    + L(`M${x - 30},${y - 80} Q${x - 30},${y - 116} ${x - 10},${y - 116} M${x + 30},${y - 80} Q${x + 30},${y - 116} ${x + 10},${y - 116}`, 6)
    + P(`M${x - 34},${y - 80} Q${x - 26},${y - 106} ${x - 8},${y - 92} L${x - 6},${y - 80} Z`, '#ff8fb1', { 'stroke-width': 3.5 }) + P(`M${x + 4},${y - 80} Q${x + 14},${y - 104} ${x + 32},${y - 90} L${x + 30},${y - 80} Z`, '#7cc6ff', { 'stroke-width': 3.5 })
    + L(`M${x - 20},${y - 40} L${x + 20},${y - 40}`, 3, '#c9c9d4'),
  seeds: (x, y) => P(`M${x - 40},${y - 90} L${x + 40},${y - 90} L${x},${y + 14} Z`, '#f2e6c8')
    + E(x, y - 90, 40, 12, '#3a2a20') + [[-18, -94], [-4, -98], [12, -92], [24, -96], [4, -88]].map(([dx, dy]) => E(x + dx, y + dy, 5, 8, '#1d1a26', { 'stroke-width': 1.5, stroke: '#fffaf4' })).join('')
    + L(`M${x - 22},${y - 60} L${x + 22},${y - 60}`, 3, '#d6c69e'),
  shawarma: (x, y) => G({ transform: `rotate(-12 ${x} ${y})` },
    el('rect', ink({ x: x - 30, y: y - 100, width: 60, height: 110, rx: 26, fill: '#f0c98a' })),
    P(`M${x - 26},${y - 90} Q${x - 10},${y - 112} ${x},${y - 92} Q${x + 12},${y - 116} ${x + 26},${y - 90} Z`, '#7cc04a', { 'stroke-width': 3.5 }),
    C(x - 10, y - 92, 7, '#e8483f', { 'stroke-width': 3 }), C(x + 12, y - 96, 6, '#a0522d', { 'stroke-width': 3 }),
    P(`M${x - 32},${y - 30} L${x + 32},${y - 30} L${x + 30},${y + 12} Q${x},${y + 22} ${x - 30},${y + 12} Z`, '#fffaf4')),
};

// эффекты: [сзади, спереди]
const EFFECTS = {
  aura_farm: () => [aura('#ffd23f', '#ff8a3d'),
    L('M40,200 Q90,180 120,210 M30,260 Q80,240 110,268 M400,200 Q440,180 480,206 M410,262 Q450,244 486,264', 6, '#fffaf4', { opacity: 0.85 })],
  brainrot: () => [G({ filter: 'url(#glow)' }, el('circle', { cx: 256, cy: 250, r: 230, fill: '#7cf0c8', opacity: 0.25 }), el('circle', { cx: 256, cy: 250, r: 170, fill: '#ff8fd1', opacity: 0.25 })),
    [[70, 110, '?', '#7cf0c8'], [440, 90, '!?', '#ffd23f'], [460, 300, '?', '#ff8fd1'], [50, 330, '??', '#9fdcff']].map(([x, y, s, col]) => el('text', { x, y, 'text-anchor': 'middle', 'font-family': 'Arial Black, Arial', 'font-weight': 900, 'font-size': 48, fill: col, stroke: LINE, 'stroke-width': 3, transform: `rotate(${x > 256 ? 14 : -14} ${x} ${y})` }, s)).join('')],
  phonk: () => [aura('#3a1d6e', '#8b2fd0'),
    [[64, 130], [448, 110], [460, 320]].map(([x, y]) => C(x, y, 22, '#fffaf4') + C(x - 8, y - 2, 6, LINE, { stroke: 'none' }) + C(x + 8, y - 2, 6, LINE, { stroke: 'none' }) + L(`M${x - 8},${y + 14} L${x + 8},${y + 14}`, 3)).join('')
      + P('M60,330 L60,280 L84,272 L84,318', 'none', { 'stroke-width': 5 }) + C(52, 332, 10, LINE) + C(76, 320, 10, LINE)],
  slay: () => [G({ filter: 'url(#glow)' }, el('circle', { cx: 256, cy: 260, r: 220, fill: '#ff5ca8', opacity: 0.25 })),
    [[70, 110, 1.2], [440, 90, 1], [460, 300, 1.1], [52, 320, 0.9], [130, 40, 0.8], [390, 30, 0.7]].map(([x, y, s]) => sparkle(x, y, s, '#ff8fd1')).join('')],
  sigma_bolt: () => [aura('#1d2a5c', '#3d7bff'),
    [[70, 90, 1], [440, 120, -1]].map(([x, y, s]) => P(`M${x},${y} L${x + s * 30},${y + 70} L${x + s * 6},${y + 74} L${x + s * 36},${y + 160} L${x - s * 12},${y + 70} L${x + s * 12},${y + 66} Z`, '#9fe8ff')).join('')],
};

// Собрать игрока. stage — индекс стадии, mood — idle/mog/win/sad, eq — надетый шмот
export function playerSVG({ stage = 0, mood = 'idle', eq = {}, size = 544 } = {}) {
  const look = PLAYER_STAGE_LOOKS[Math.min(stage, PLAYER_STAGE_LOOKS.length - 1)];
  const c = look.c;
  const m = moodFace(mood, look);
  const top = TOPS[eq.top];
  const eff = EFFECTS[eq.effect]?.() ?? [look.aura ? aura('#ffd23f', '#ff8a3d') : '', ''];
  const [hx, hy] = handPos(c, look.wide || 0);
  const [hairKind, hairColor] = look.hair;
  const hair = hairKind === 'slick' ? hairSlick(hairColor, { height: 14 }) : hairKind === 'quiff'
    ? P(`M${HX - 142},${HY + 10} C${HX - 156},${HY - 150} ${HX - 60},${HY - 196} ${HX + 30},${HY - 176} C${HX + 120},${HY - 196} ${HX + 166},${HY - 120} ${HX + 142},${HY + 10} C${HX + 126},${HY - 40} ${HX + 70},${HY - 70} ${HX},${HY - 66} C${HX - 70},${HY - 70} ${HX - 126},${HY - 40} ${HX - 142},${HY + 10} Z`, hairColor)
      + L(`M${HX - 40},${HY - 150} Q${HX + 10},${HY - 186} ${HX + 70},${HY - 160} M${HX - 80},${HY - 110} Q${HX - 20},${HY - 150} ${HX + 60},${HY - 130}`, 3.5, '#00000030')
    : hairFringe(hairColor, { spikes: 7, side: stage % 2 });
  const glasses = GLASSES[eq.glasses]?.() ?? (look.shades && mood !== 'win' ? SHADES : '');
  const handItem = HAND[eq.hand] ? HAND[eq.hand](hx, hy) : (look.item ? look.item(hx, hy) : '');
  return human({
    c, cloth: top?.cloth ?? look.cloth, clothShade: top?.shade ?? look.shade, sleeve: top?.cloth ?? look.cloth,
    shoes: '#fffaf4', mouthKind: m.mouth ?? look.mouth, flex: !!look.flex, wide: look.wide || 0, freckles: !!look.freckles,
    behind: eff[0],
    back: top ? '' : (look.back || ''),
    onBody: (top ? top.decor : (look.onBody || '')) + (look.c === 1 && top ? L('M196,304 Q256,388 316,304', 11, '#ffd23f') + L('M196,304 Q256,388 316,304', 2.5, LINE) + C(256, 376, 20, '#ffd23f') : ''),
    beard: look.beard ? GIGA_BEARD : '',
    hair,
    face: { lid: look.lid, iris: look.iris, ...(m.face || {}) },
    eyesSvg: m.eyesSvg ?? null,
    browsSvg: m.browsSvg ?? (m.browC != null ? brows(m.browC) : null),
    faceOver: (mood === 'sad' ? '' : (look.face || '')) + glasses + (m.tear || ''),
    extraHead: eq.hat ? '' : (look.top || ''),
    headTop: HATS[eq.hat]?.() ?? '',
    front: (look.front && mood !== 'win' ? look.front : '') + handItem + eff[1],
    spark: m.spark,
    size,
  });
}
