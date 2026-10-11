// Оформление: неоновые цвета, шрифты и общие элементы интерфейса
import * as Phaser from 'phaser';
import * as sdk from './sdk.js';

export const COLORS = {
  bgTop: '#2a0a5e',
  bgBottom: '#07163f',
  pink: 0xff2e97,
  lime: 0xb6ff3b,
  cyan: 0x29f0ff,
  yellow: 0xffe14d,
  purple: 0x8b5cff,
  orange: 0xff8a3d,
  card: 0x1d1046,
  cardLight: 0x2c1a66,
  gray: 0x463d66,
  ink: 0x12062b,
};

export const HEX = {
  pink: '#ff2e97', lime: '#b6ff3b', cyan: '#29f0ff', yellow: '#ffe14d',
  purple: '#8b5cff', white: '#ffffff', soft: '#c9bcff', ink: '#12062b',
};

export const FONT_DISPLAY = '"Unbounded", "Arial Black", sans-serif';
export const FONT_BODY = '"Rubik", Arial, sans-serif';
export const FONT_EMOJI = '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif';

// Заголовочный текст с жирной обводкой «как стикер»
export function txt(scene, x, y, str, size, color = HEX.white, extra = {}) {
  return scene.add.text(x, y, str, {
    fontFamily: FONT_DISPLAY, fontStyle: '800', fontSize: `${size}px`, color, align: 'center',
    stroke: HEX.ink, strokeThickness: Math.max(4, Math.round(size / 6)),
    ...extra,
  });
}

export function body(scene, x, y, str, size, color = HEX.soft, extra = {}) {
  return scene.add.text(x, y, str, {
    fontFamily: FONT_BODY, fontStyle: '600', fontSize: `${size}px`, color, ...extra,
  });
}

export function emoji(scene, x, y, str, size) {
  return scene.add.text(x, y, str, {
    fontFamily: FONT_EMOJI, fontSize: `${size}px`, padding: { x: 4, y: Math.round(size / 5) },
  }).setOrigin(0.5);
}

// Скруглённая плашка с «3D»-тенью снизу
export function drawCard(g, w, h, color, { radius = 18, depth = 6, stroke = null } = {}) {
  g.clear();
  g.fillStyle(COLORS.ink, 0.9);
  g.fillRoundedRect(-w / 2, -h / 2 + depth, w, h, radius);
  g.fillStyle(color, 1);
  g.fillRoundedRect(-w / 2, -h / 2, w, h, radius);
  g.fillStyle(0xffffff, 0.18);
  g.fillRoundedRect(-w / 2 + 6, -h / 2 + 4, w - 12, h * 0.38, { tl: radius - 4, tr: radius - 4, bl: 6, br: 6 });
  if (stroke != null) {
    g.lineStyle(3, stroke, 1);
    g.strokeRoundedRect(-w / 2, -h / 2, w, h, radius);
  }
}

// Кнопка-стикер. Возвращает контейнер с методами setLabel / setEnabled
export function button(scene, x, y, w, h, label, color, onClick, { size = 24, textColor = HEX.white } = {}) {
  const c = scene.add.container(x, y);
  const g = scene.add.graphics();
  const t = txt(scene, 0, -2, label, size, textColor).setOrigin(0.5);
  const hit = scene.add.zone(0, 0, w, h + 8).setInteractive({ useHandCursor: true });
  c.add([g, t, hit]);
  c.label = t;
  c.enabled = true;
  c.color = color;
  const redraw = () => drawCard(g, w, h, c.enabled ? c.color : COLORS.gray);
  redraw();

  c.setLabel = (s) => { t.setText(s); return c; };
  c.setEnabled = (v) => { if (c.enabled !== v) { c.enabled = v; redraw(); } return c; };
  c.setColor = (col) => { c.color = col; redraw(); return c; };

  hit.on('pointerdown', () => {
    scene.tweens.add({ targets: c, scaleX: 0.93, scaleY: 0.9, duration: 60, yoyo: true });
    onClick(c);
  });
  return c;
}

// Модальное окно: затемнение + карточка + крестик. Возвращает { box, panel, close }
// Пока окно открыто, бой стоит на паузе (GameplayAPI.stop).
// onX — своё действие на крестик (по умолчанию просто закрыть)
export function modal(scene, w, h, title, { onClose, onX } = {}) {
  sdk.menu(true);
  const box = scene.add.container(0, 0).setDepth(200);
  const shade = scene.add.rectangle(360, 640, 720, 1280, 0x05010f, 0.82).setInteractive();
  const panel = scene.add.container(360, 640);
  const g = scene.add.graphics();
  drawCard(g, w, h, COLORS.card, { radius: 28, depth: 10, stroke: COLORS.pink });
  const head = txt(scene, 0, -h / 2 + 50, title, 34, HEX.yellow).setOrigin(0.5);
  const x = txt(scene, w / 2 - 36, -h / 2 + 34, '✕', 30, HEX.pink).setOrigin(0.5)
    .setInteractive({ useHandCursor: true });
  panel.add([g, head, x]);
  box.add([shade, panel]);

  panel.setScale(0.6).setAlpha(0);
  scene.tweens.add({ targets: panel, scale: 1, alpha: 1, duration: 260, ease: 'Back.easeOut' });

  let closed = false;
  const close = () => {
    if (closed) return;
    closed = true;
    sdk.menu(false);
    onClose?.();
    scene.tweens.add({ targets: panel, scale: 0.7, alpha: 0, duration: 150, onComplete: () => box.destroy() });
    shade.disableInteractive();
  };
  x.on('pointerdown', () => (onX ? onX() : close()));
  return { box, panel, close };
}

// Летящий текст-стикер (наклонён, выпрыгивает и улетает)
export function pop(scene, x, y, str, size, color = HEX.white, rise = 100) {
  const t = txt(scene, x, y, str, size, color).setOrigin(0.5).setDepth(150)
    .setAngle(Phaser.Math.Between(-12, 12)).setScale(0.4);
  scene.tweens.add({ targets: t, scale: 1, duration: 140, ease: 'Back.easeOut' });
  scene.tweens.add({
    targets: t, y: y - rise, alpha: 0, delay: 250, duration: 650, ease: 'Cubic.easeIn',
    onComplete: () => t.destroy(),
  });
  return t;
}

// Фон и служебные текстуры генерируются в коде — без файлов
export function makeTextures(scene) {
  if (!scene.textures.exists('bg_gradient')) {
    const tex = scene.textures.createCanvas('bg_gradient', 720, 1280);
    const ctx = tex.getContext();
    const grad = ctx.createLinearGradient(0, 0, 0, 1280);
    grad.addColorStop(0, COLORS.bgTop);
    grad.addColorStop(0.55, '#1a0d4f');
    grad.addColorStop(1, COLORS.bgBottom);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 720, 1280);
    // неоновое пятно за соперником
    const glow = ctx.createRadialGradient(360, 450, 20, 360, 450, 380);
    glow.addColorStop(0, 'rgba(255,46,151,0.45)');
    glow.addColorStop(1, 'rgba(255,46,151,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, 720, 900);
    tex.refresh();
  }
  if (!scene.textures.exists('dot')) {
    const tex = scene.textures.createCanvas('dot', 24, 24);
    const ctx = tex.getContext();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.arc(12, 12, 11, 0, Math.PI * 2); ctx.fill();
    tex.refresh();
  }
  if (!scene.textures.exists('star')) {
    const tex = scene.textures.createCanvas('star', 32, 32);
    const ctx = tex.getContext();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const r = i % 2 ? 5 : 16;
      const a = (i / 8) * Math.PI * 2 - Math.PI / 2;
      ctx.lineTo(16 + Math.cos(a) * r, 16 + Math.sin(a) * r);
    }
    ctx.fill();
    tex.refresh();
  }
}

// Короткое уведомление внизу экрана
export function toast(scene, str) {
  const c = scene.add.container(360, 1150).setDepth(300);
  const t = body(scene, 0, 0, str, 22, HEX.white, { align: 'center', wordWrap: { width: 560 } }).setOrigin(0.5);
  const g = scene.add.graphics();
  drawCard(g, Math.min(640, t.width + 60), t.height + 34, COLORS.ink, { radius: 22, depth: 0, stroke: COLORS.pink });
  c.add([g, t]).setAlpha(0);
  scene.tweens.add({ targets: c, alpha: 1, y: 1120, duration: 200 });
  scene.tweens.add({ targets: c, alpha: 0, delay: 2600, duration: 300, onComplete: () => c.destroy() });
}

// Показать рекламу за награду; true — награду можно выдавать
export async function askReward(scene) {
  const r = await sdk.showRewarded();
  if (r === 'skipped') toast(scene, 'Досмотри рекламу до конца, чтобы получить награду');
  else if (r === 'error') toast(scene, 'Реклама сейчас недоступна, попробуй чуть позже');
  return r === 'ok';
}
