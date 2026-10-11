// Окно «Топ по ауре». Пока боты — потом можно заменить на лидерборд Яндекс SDK
import { leaderboard, format } from '../state.js';
import { COLORS, HEX, txt, body, modal, drawCard } from '../theme.js';

const MEDALS = ['🥇', '🥈', '🥉'];

export function openLeaderboard(scene) {
  const { panel } = modal(scene, 650, 1040, '🏆 ТОП ПО АУРЕ');
  const list = leaderboard();
  const me = list.find((e) => e.me);

  let rows;
  if (me.rank <= 10) {
    rows = list.slice(0, 10);
  } else {
    const around = list.slice(me.rank - 2, me.rank + 1);
    rows = [...list.slice(0, 7), null, ...around];
  }

  rows.forEach((e, i) => {
    const y = -400 + 30 + i * 72;
    if (!e) {
      panel.add(txt(scene, 0, y, '• • •', 26, '#8f84c2').setOrigin(0.5));
      return;
    }
    const g = scene.add.graphics();
    g.setPosition(0, y);
    drawCard(g, 580, 60, e.me ? COLORS.lime : (e.rank <= 3 ? COLORS.cardLight : 0x241452), { radius: 16, depth: 4 });
    const ink = e.me ? HEX.ink : HEX.white;
    const rank = e.rank <= 3
      ? scene.add.text(-255, y, MEDALS[e.rank - 1], { fontSize: '32px', padding: { y: 6 } }).setOrigin(0.5)
      : body(scene, -255, y, `#${e.rank}`, 22, e.me ? HEX.ink : HEX.soft).setOrigin(0.5);
    const name = body(scene, -215, y, e.me ? 'ТЫ 😎' : e.name, 24, ink).setOrigin(0, 0.5);
    const score = txt(scene, 270, y, `✨ ${format(e.score)}`, 20, e.me ? HEX.ink : HEX.yellow,
      e.me ? { stroke: HEX.ink, strokeThickness: 0 } : {}).setOrigin(1, 0.5);
    panel.add([g, rank, name, score]);
  });

  const ahead = list[me.rank - 2];
  const footer = ahead
    ? `Набери ещё ✨ ${format(ahead.score - me.score + 1)},\nчтобы обогнать ${ahead.name}`
    : 'Ты №1. Абсолютный мог 🗿';
  panel.add(body(scene, 0, 445, footer, 22, HEX.cyan, { align: 'center' }).setOrigin(0.5));
}
