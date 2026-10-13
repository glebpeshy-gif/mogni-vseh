// Окно «Шмот»: кастомизация персонажа за 💅 вайб
import { COSMETICS, STYLE_SLOTS } from '../data.js';
import { state, owns, buyCosmetic, equip, playerStage } from '../state.js';
import { COLORS, HEX, txt, body, button, modal, emoji, drawCard, pop } from '../theme.js';
import { t, cosmeticName, slotName } from '../i18n.js';
import { playerTexture } from '../playerArt.js';
import * as sound from '../sound.js';

export function openWardrobe(scene, { onChange } = {}) {
  const { panel } = modal(scene, 690, 1200, t('style_title'), { onClose: () => onChange?.() });
  let slot = STYLE_SLOTS[0].id;
  let selected = state.equipped[slot] || null; // что примеряем сейчас

  const vibeText = txt(scene, 0, -500, '', 26, HEX.yellow).setOrigin(0.5);
  const previewBg = scene.add.graphics({ x: 0, y: -330 });
  drawCard(previewBg, 330, 270, 0x241452, { radius: 30, depth: 0, stroke: COLORS.purple });
  const preview = scene.add.image(0, -330, '__DEFAULT').setVisible(false);
  const itemName = txt(scene, 0, -172, '', 22).setOrigin(0.5);
  panel.add([vibeText, previewBg, preview, itemName]);

  // вкладки слотов
  const tabs = STYLE_SLOTS.map((s, i) => {
    const x = -260 + i * 130;
    const g = scene.add.graphics({ x, y: -95 });
    const ic = emoji(scene, x, -103, s.emoji, 30);
    const lb = body(scene, x, -71, slotName(s.id), 14, HEX.white).setOrigin(0.5);
    const hit = scene.add.zone(x, -91, 120, 76).setInteractive({ useHandCursor: true });
    hit.on('pointerdown', () => {
      slot = s.id;
      selected = state.equipped[slot] || null;
      sound.click();
      paint();
    });
    panel.add([g, ic, lb, hit]);
    return { id: s.id, g };
  });

  // сетка вещей: «ничего» + 5 вещей слота
  const cards = [...Array(6)].map((_, i) => {
    const x = i % 2 ? 160 : -160;
    const y = 30 + Math.floor(i / 2) * 128;
    const g = scene.add.graphics({ x, y });
    const ic = emoji(scene, x - 100, y, '', 44);
    const name = body(scene, x - 60, y - 16, '', 18, HEX.white, { wordWrap: { width: 190 } }).setOrigin(0, 0.5);
    const info = body(scene, x - 60, y + 24, '', 16, HEX.yellow).setOrigin(0, 0.5);
    const hit = scene.add.zone(x, y, 310, 114).setInteractive({ useHandCursor: true });
    const card = { g, ic, name, info, id: null };
    hit.on('pointerdown', () => {
      selected = card.id;
      sound.click();
      paint();
    });
    panel.add([g, ic, name, info, hit]);
    return card;
  });

  const action = button(scene, 0, 420, 460, 84, '', COLORS.lime, () => onAction(), { size: 24, textColor: HEX.ink });
  const hint = body(scene, 0, 520, t('style_hint'), 16, '#8f84c2', { align: 'center' }).setOrigin(0.5);
  panel.add([action, hint]);

  function onAction() {
    if (!action.enabled) return;
    if (!selected) { equip(slot, null); sound.click(); }
    else if (owns(selected)) {
      if (state.equipped[slot] === selected) equip(slot, null); else equip(slot, selected);
      sound.buy();
    } else if (buyCosmetic(selected)) {
      sound.prize();
      pop(scene, 360, 300, cosmeticName(selected), 34, HEX.lime, 100);
    }
    paint();
    onChange?.();
  }

  async function updatePreview() {
    const eq = { ...state.equipped };
    if (selected) eq[slot] = selected; else delete eq[slot];
    const key = await playerTexture(scene, { stage: playerStage().index, eq, mood: 'idle', size: 300 });
    if (!key || !preview.active) return;
    preview.setTexture(key).setVisible(true).setDisplaySize(260, 260);
  }

  function paint() {
    vibeText.setText(`💅 ${state.vibe}`);
    for (const tb of tabs) {
      tb.g.clear();
      const on = tb.id === slot;
      tb.g.fillStyle(on ? COLORS.purple : 0x241452, 1).fillRoundedRect(-58, -42, 116, 84, 18);
      if (state.equipped[tb.id]) tb.g.fillStyle(COLORS.lime, 1).fillCircle(44, -30, 7);
    }
    const items = [null, ...COSMETICS.filter((x) => x.slot === slot)];
    items.forEach((item, i) => {
      const c = cards[i];
      c.id = item?.id ?? null;
      const isSel = selected === c.id;
      const worn = item ? state.equipped[slot] === item.id : !state.equipped[slot];
      c.g.clear();
      c.g.fillStyle(isSel ? 0x3a2480 : 0x221448, 1).fillRoundedRect(-155, -57, 310, 114, 20);
      c.g.lineStyle(3, isSel ? COLORS.lime : 0x3a2b6e, 1).strokeRoundedRect(-155, -57, 310, 114, 20);
      c.ic.setText(item ? item.emoji : '🚫');
      c.name.setText(item ? cosmeticName(item.id) : t('style_none'));
      if (!item) c.info.setText(worn ? t('style_worn') : '').setColor(HEX.lime);
      else if (worn) c.info.setText(t('style_worn')).setColor(HEX.lime);
      else if (owns(item.id)) c.info.setText(t('style_owned')).setColor(HEX.cyan);
      else c.info.setText(`💅 ${item.price}`).setColor(state.vibe >= item.price ? HEX.yellow : '#7d70b0');
    });

    const item = COSMETICS.find((x) => x.id === selected);
    itemName.setText(item ? cosmeticName(item.id) : slotName(slot));
    if (!item) {
      action.setLabel(t('style_off')).setEnabled(!!state.equipped[slot]);
    } else if (owns(item.id)) {
      action.setLabel(state.equipped[slot] === item.id ? t('style_off') : t('style_wear')).setEnabled(true);
    } else {
      const can = state.vibe >= item.price;
      action.setLabel(can ? t('style_buy', { n: item.price }) : t('style_need', { n: item.price })).setEnabled(can);
    }
    action.label.setColor(action.enabled ? HEX.ink : '#9a90c0');
    updatePreview();
  }
  paint();
}
