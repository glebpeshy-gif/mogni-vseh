// Окно «Перерождение»: сброс прогресса за вечные сигма-очки (+10% урона за очко)
import { BALANCE } from '../data.js';
import { state, prestigeGain, doPrestige } from '../state.js';
import { COLORS, HEX, txt, body, button, modal, emoji } from '../theme.js';
import { t } from '../i18n.js';
import * as sound from '../sound.js';

const pct = (n) => Math.round(n * BALANCE.sigmaBonus * 100);

export function openPrestige(scene, { onRebirth }) {
  const gain = prestigeGain();
  const { panel, close } = modal(scene, 640, 760, t('rebirth_title'));

  panel.add(emoji(scene, 0, -250, '🗿', 90));
  panel.add(txt(scene, 0, -160, t('rebirth_have', { n: state.sigma, p: pct(state.sigma) }), 22, HEX.yellow).setOrigin(0.5));
  panel.add(body(scene, 0, -60, t('rebirth_text'), 22, HEX.soft, { align: 'center' }).setOrigin(0.5));

  if (gain > 0) {
    panel.add(txt(scene, 0, 50, t('rebirth_gain', { n: gain, p: pct(gain) }), 24, HEX.lime).setOrigin(0.5));
  } else {
    panel.add(txt(scene, 0, 50, t('rebirth_locked', { n: BALANCE.prestigeLevel }), 24, '#ff5a7a').setOrigin(0.5));
  }
  panel.add(body(scene, 0, 100, t('rebirth_hint'), 18, '#8f84c2').setOrigin(0.5));

  const btn = button(scene, 0, 210, 420, 90, t('rebirth_btn'), COLORS.purple, () => {
    if (!btn.enabled) return;
    const got = doPrestige();
    if (!got) return;
    sound.prize();
    close();
    onRebirth(got);
  }, { size: 28 });
  btn.setEnabled(gain > 0);
  panel.add(btn);
}
