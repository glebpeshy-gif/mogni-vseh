// Окно «Топ могеров». На Яндекс Играх — настоящий лидерборд SDK,
// в тестовом режиме (локально, GitHub Pages) — боты, чтобы окно было что смотреть.
import { state, leaderboard, format } from '../state.js';
import { COLORS, HEX, txt, body, button, modal, drawCard } from '../theme.js';
import { t } from '../i18n.js';
import * as sdk from '../sdk.js';

const MEDALS = ['🥇', '🥈', '🥉'];

export function openLeaderboard(scene) {
  const { panel } = modal(scene, 650, 1040, t('lb_title'));
  panel.add(body(scene, 0, -400, t('lb_sub'), 18, '#8f84c2').setOrigin(0.5));
  if (sdk.hasLeaderboard()) showReal(scene, panel);
  else showBots(scene, panel);
}

// Строки таблицы; null — разделитель «• • •»
function drawRows(scene, panel, rows) {
  const items = [];
  rows.forEach((e, i) => {
    const y = -340 + i * 72;
    if (!e) {
      items.push(txt(scene, 0, y, '• • •', 26, '#8f84c2').setOrigin(0.5));
      return;
    }
    const g = scene.add.graphics();
    g.setPosition(0, y);
    drawCard(g, 580, 60, e.me ? COLORS.lime : (e.rank <= 3 ? COLORS.cardLight : 0x241452), { radius: 16, depth: 4 });
    const ink = e.me ? HEX.ink : HEX.white;
    const rank = e.rank <= 3
      ? scene.add.text(-255, y, MEDALS[e.rank - 1], { fontSize: '32px', padding: { y: 6 } }).setOrigin(0.5)
      : body(scene, -255, y, `#${e.rank}`, 20, e.me ? HEX.ink : HEX.soft).setOrigin(0.5);
    const shown = e.me ? t('lb_you') : (e.name || '🗿 ' + t('lb_anon'));
    const name = body(scene, -215, y, shown.slice(0, 18), 24, ink).setOrigin(0, 0.5);
    const score = txt(scene, 270, y, `🗿 ${format(e.score)}`, 20, e.me ? HEX.ink : HEX.yellow,
      e.me ? { stroke: HEX.ink, strokeThickness: 0 } : {}).setOrigin(1, 0.5);
    items.push(g, rank, name, score);
  });
  panel.add(items);
  return items;
}

// Топ-10, а если игрок ниже — топ-7, «• • •» и игрок с соседями
function pickRows(list, myRank) {
  const top = list.filter((e) => e.rank <= 10);
  if (!myRank || myRank <= 10) return top;
  const around = list.filter((e) => e.rank > 10);
  return [...top.slice(0, 7), null, ...around.slice(0, 3)];
}

function showBots(scene, panel) {
  const list = leaderboard();
  const me = list.find((e) => e.me);
  drawRows(scene, panel, me.rank <= 10
    ? list.slice(0, 10)
    : [...list.slice(0, 7), null, ...list.slice(me.rank - 2, me.rank + 1)]);
  const ahead = list[me.rank - 2];
  const footer = ahead
    ? t('lb_ahead', { n: format(ahead.score - me.score + 1), name: ahead.name })
    : t('lb_first');
  panel.add(body(scene, 0, 445, footer, 22, HEX.cyan, { align: 'center' }).setOrigin(0.5));
}

async function showReal(scene, panel) {
  const status = body(scene, 0, -100, t('lb_loading'), 22, HEX.soft, { align: 'center' }).setOrigin(0.5);
  panel.add(status);
  sdk.submitScore(state.kills);

  let data = null;
  try { data = await sdk.leaderboardEntries(); } catch { data = null; }
  if (!panel.active) return; // окно уже закрыли
  if (!data) { status.setText(t('lb_error')); return; }
  if (!data.entries.length) status.setText(t('lb_empty'));
  else { status.destroy(); drawRows(scene, panel, pickRows(data.entries, data.myRank)); }

  if (!sdk.isAuthorized()) {
    panel.add(body(scene, 0, 370, t('lb_login_hint'), 18, '#8f84c2', { align: 'center' }).setOrigin(0.5));
    const btn = button(scene, 0, 450, 460, 80, t('lb_login'), COLORS.lime, async () => {
      if (!btn.enabled) return;
      btn.setEnabled(false);
      const ok = await sdk.login();
      if (!panel.active) return;
      if (ok && sdk.isAuthorized()) {
        sdk.submitScore(state.kills);
        btn.setLabel('✓').label.setColor(HEX.ink);
      } else btn.setEnabled(true);
    }, { size: 22, textColor: HEX.ink });
    panel.add(btn);
  } else if (data.myRank) {
    panel.add(txt(scene, 0, 445, t('lb_rank', { n: data.myRank }), 24, HEX.cyan).setOrigin(0.5));
  }
}
