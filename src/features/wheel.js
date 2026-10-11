// Окно «Колесо ауры»: бесплатный спин раз в день + доп. спины за рекламу
import * as Phaser from 'phaser';
import { WHEEL } from '../data.js';
import { wheelStatus, useSpin, rollWheel, applyPrize, msToMidnight, save } from '../state.js';
import { COLORS, HEX, txt, body, button, modal, pop, emoji, askReward } from '../theme.js';
import * as sound from '../sound.js';
import { t, wheelLabel } from '../i18n.js';

const R = 235;
const SEG = 360 / WHEEL.length;
const LIGHT = [COLORS.yellow, COLORS.lime, COLORS.cyan, 0xffffff];

function hhmmss(ms) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const p = (n) => String(n).padStart(2, '0');
  return `${p(Math.floor(s / 3600))}:${p(Math.floor((s % 3600) / 60))}:${p(s % 60)}`;
}

export function openWheel(scene, { onPrize, onClose } = {}) {
  let spinning = false;
  let angle = 0; // накопленный угол (без обрезки до ±180)

  const timer = scene.time.addEvent({ delay: 500, loop: true, callback: () => updateStatus() });
  const { panel, close } = modal(scene, 650, 960, t('wheel_title'), {
    onClose: () => { timer.remove(); onClose?.(); },
  });

  // ----- само колесо -----
  const wheel = scene.add.container(0, -40);
  const g = scene.add.graphics();
  g.fillStyle(COLORS.ink, 1).fillCircle(0, 8, R + 22);
  g.fillStyle(COLORS.pink, 1).fillCircle(0, 0, R + 22);
  WHEEL.forEach((p, i) => {
    const a0 = Phaser.Math.DegToRad(-90 + i * SEG - SEG / 2);
    const a1 = Phaser.Math.DegToRad(-90 + i * SEG + SEG / 2);
    g.fillStyle(p.color, 1);
    g.slice(0, 0, R, a0, a1, false);
    g.fillPath();
    g.lineStyle(4, COLORS.ink, 1);
    g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.cos(a0) * R, Math.sin(a0) * R); g.strokePath();
  });
  wheel.add(g);

  WHEEL.forEach((p, i) => {
    const a = Phaser.Math.DegToRad(-90 + i * SEG);
    const dark = LIGHT.includes(p.color);
    const label = txt(scene, Math.cos(a) * R * 0.66, Math.sin(a) * R * 0.66, wheelLabel(p.id), 21,
      dark ? HEX.ink : HEX.white, { stroke: dark ? '#ffffff' : HEX.ink, strokeThickness: dark ? 0 : 5, lineSpacing: -4 })
      .setOrigin(0.5).setAngle(i * SEG);
    wheel.add(label);
  });

  // лампочки по краю
  const bulbs = [];
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2;
    const b = scene.add.circle(Math.cos(a) * (R + 11), Math.sin(a) * (R + 11), 6, i % 2 ? COLORS.yellow : 0xffffff);
    bulbs.push(b);
    wheel.add(b);
  }
  scene.tweens.add({ targets: bulbs.filter((_, i) => i % 2), alpha: 0.25, duration: 350, yoyo: true, repeat: -1 });

  const hub = scene.add.circle(0, 0, 46, COLORS.ink).setStrokeStyle(6, COLORS.yellow);
  const hubFace = emoji(scene, 0, 0, '🗿', 48);

  // указатель сверху
  const pointer = scene.add.triangle(0, -40 - R - 16, -26, -22, 26, -22, 0, 26, COLORS.yellow)
    .setStrokeStyle(5, COLORS.ink);

  panel.add([wheel, hub, hubFace, pointer]);
  hub.y = hubFace.y = -40;

  // ----- кнопка и статус -----
  const status = body(scene, 0, 262, '', 22, HEX.soft, { align: 'center' }).setOrigin(0.5);
  const btn = button(scene, 0, 345, 520, 92, '', COLORS.lime, () => onButton(), { size: 28, textColor: HEX.ink });
  const hint = body(scene, 0, 420, t('wheel_hint_daily'), 18, '#8f84c2').setOrigin(0.5);
  panel.add([status, btn, hint]);

  function updateStatus() {
    if (spinning) return;
    const s = wheelStatus();
    if (s.free) {
      btn.setColor(COLORS.lime).setEnabled(true).setLabel(t('wheel_free'));
      btn.label.setColor(HEX.ink).setStroke('#ffffff', 0);
      hint.setText(t('wheel_hint_daily'));
    } else if (s.adsLeft > 0) {
      btn.setColor(COLORS.purple).setEnabled(true).setLabel(t('wheel_ad', { n: s.adsLeft }));
      btn.label.setColor(HEX.white).setStroke(HEX.ink, 6);
      hint.setText(t('wheel_hint_next', { t: hhmmss(msToMidnight()) }));
    } else {
      btn.setEnabled(false).setLabel(t('wheel_tomorrow'));
      btn.label.setColor(HEX.white).setStroke(HEX.ink, 6);
      hint.setText(t('wheel_hint_next', { t: hhmmss(msToMidnight()) }));
    }
  }

  async function onButton() {
    if (spinning || !btn.enabled) return;
    const s = wheelStatus();
    const byAd = !s.free;
    if (byAd) {
      if (s.adsLeft <= 0) return;
      btn.setEnabled(false);
      const ok = await askReward(scene);
      if (!ok) { updateStatus(); return; }
    }
    useSpin(byAd);
    save();
    spin();
  }

  function spin() {
    spinning = true;
    btn.setEnabled(false).setLabel(t('wheel_spinning'));
    status.setText('');

    const i = rollWheel();
    const jitter = Phaser.Math.FloatBetween(-SEG * 0.35, SEG * 0.35);
    const toZero = (360 - (((angle % 360) + 360) % 360)) % 360; // докрутить до 0
    const target = angle + toZero + 360 * 6 + ((360 - i * SEG) % 360) + jitter;
    const proxy = { a: angle };
    let lastSeg = Math.floor((angle + SEG / 2) / SEG);

    scene.tweens.add({
      targets: proxy, a: target, duration: 4200, ease: 'Cubic.easeOut',
      onUpdate: () => {
        wheel.angle = proxy.a;
        const seg = Math.floor((proxy.a + SEG / 2) / SEG);
        if (seg !== lastSeg) {
          lastSeg = seg;
          sound.tick();
          pointer.angle = -18;
          scene.tweens.add({ targets: pointer, angle: 0, duration: 90 });
        }
      },
      onComplete: () => {
        angle = target;
        const prize = WHEEL[i];
        const text = applyPrize(prize);
        save();
        sound.prize();
        pop(scene, 360, 600, t('wheel_won'), 56, HEX.yellow, 140);
        status.setText(text).setColor(HEX.lime).setFontSize(26);
        scene.tweens.add({ targets: status, scale: { from: 1.4, to: 1 }, duration: 300, ease: 'Back.easeOut' });
        onPrize?.(prize, text);
        spinning = false;
        updateStatus();
      },
    });
  }

  updateStatus();
  return { close };
}
