// Окно настроек: язык, звуки, музыка, вибрация, тряска, сброс прогресса
import { state, save, resetProgress } from '../state.js';
import { COLORS, HEX, body, button, modal } from '../theme.js';
import { t, lang, LANGS } from '../i18n.js';
import * as sound from '../sound.js';

const VERSION = 'v0.4';

// Применить звуковые настройки (вызывается и при старте игры)
export function applySettings() {
  sound.setSfx(state.settings.sfx);
  sound.setMusic(state.settings.music);
}

export function vibrate(ms) {
  if (state.settings.vibro && navigator.vibrate) navigator.vibrate(ms);
}

const canVibrate = () => typeof navigator.vibrate === 'function' && navigator.maxTouchPoints > 0;

// onRestart — перезапустить сцену (после смены языка или сброса)
export function openSettings(scene, { onRestart }) {
  const toggles = [
    { key: 'sfx', label: 'set_sfx' },
    { key: 'music', label: 'set_music' },
    ...(canVibrate() ? [{ key: 'vibro', label: 'set_vibro' }] : []),
    { key: 'shake', label: 'set_shake' },
  ];
  const H = 360 + toggles.length * 96 + 120;
  const { panel, close } = modal(scene, 640, H, t('settings_title'));
  let y = -H / 2 + 140;

  // ----- язык: названия на родном языке (рекомендация 6.9) -----
  panel.add(body(scene, -270, y, t('set_lang'), 26, HEX.white).setOrigin(0, 0.5));
  LANGS.forEach((l, i) => {
    const active = lang() === l.code;
    const b = button(scene, 60 + i * 170, y, 156, 64, l.name, active ? COLORS.lime : COLORS.cardLight, () => {
      if (lang() === l.code) return;
      sound.click();
      state.settings.lang = l.code;
      save();
      close();
      onRestart();
    }, { size: 18, textColor: active ? HEX.ink : HEX.white });
    if (active) b.label.setStroke('#ffffff', 0);
    panel.add(b);
  });
  y += 110;

  // ----- переключатели -----
  for (const tg of toggles) {
    panel.add(body(scene, -270, y, t(tg.label), 26, HEX.white).setOrigin(0, 0.5));
    const b = button(scene, 190, y, 170, 64, '', COLORS.lime, () => {
      state.settings[tg.key] = !state.settings[tg.key];
      applySettings();
      if (tg.key === 'vibro') vibrate(40);
      sound.click();
      save();
      paint();
    }, { size: 22 });
    const paint = () => {
      const on = state.settings[tg.key];
      b.setColor(on ? COLORS.lime : COLORS.gray).setLabel(on ? t('on') : t('off'));
      b.label.setColor(on ? HEX.ink : HEX.white).setStroke(on ? '#ffffff' : HEX.ink, on ? 0 : 5);
    };
    paint();
    panel.add(b);
    y += 96;
  }

  // ----- сброс прогресса -----
  y += 30;
  const reset = button(scene, 0, y, 460, 76, t('reset'), 0xd9264f, () => confirmReset(scene, () => {
    close();
    onRestart();
  }), { size: 22 });
  panel.add(reset);
  panel.add(body(scene, 0, H / 2 - 36, VERSION, 16, '#6f64a3').setOrigin(0.5));
}

function confirmReset(scene, onDone) {
  const { panel, close } = modal(scene, 580, 460, t('reset_title'));
  panel.add(body(scene, 0, -50, t('reset_text'), 24, HEX.soft, { align: 'center' }).setOrigin(0.5));
  panel.add(button(scene, 0, 70, 400, 76, t('reset_yes'), 0xd9264f, () => {
    resetProgress();
    close();
    onDone();
  }, { size: 22 }));
  const cancel = button(scene, 0, 165, 300, 64, t('cancel'), COLORS.cardLight, () => close(), { size: 20 });
  panel.add(cancel);
}
