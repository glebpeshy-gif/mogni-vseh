// Только для разработки: готовые сцены для скриншотов (?shot=main|tasks|prestige|login)
import { state, dailyTasks } from '../state.js';
import { closeTopModal } from '../theme.js';
import { openTasks } from '../features/daily.js';
import { openPrestige } from '../features/prestige.js';

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

export async function run(game, shot) {
  let g = null;
  while (!g?.rows) {
    try { g = game.scene.getScene('Game'); } catch { g = null; } // сцены ещё не созданы
    await wait(100);
  }
  await wait(300);
  if (shot === 'login') return;
  if (shot === 'fresh') { closeTopModal(); await wait(400); state.aura = 6; g.refresh(); return; }
  if (shot === 'mid') {
    closeTopModal(); await wait(400);
    Object.assign(state, { level: 14, aura: 2600, buyMode: 1 });
    state.upgrades = { mewing: 6, gym: 2, jaw: 2, eyes: 1 };
    g.spawnEnemy(); g.refresh(); return;
  }
  closeTopModal();
  await wait(300);
  Object.assign(state, { level: 35, aura: 5e7, sigma: 4, buyMode: 10 });
  state.upgrades = { mewing: 26, gym: 30, jaw: 12, eyes: 6, subs: 8 };
  g.spawnEnemy();
  if (shot === 'main') {
    g.spawnGolden();
    g.combo = 34; g.lastTapAt = g.time.now + 100000; g.updateCombo(false);
  }
  if (shot === 'tasks') {
    const tk = dailyTasks().list;
    tk[0].have = tk[0].need; tk[1].have = Math.floor(tk[1].need / 2);
    openTasks(g);
  }
  if (shot === 'prestige') openPrestige(g, { onRebirth() {} });
  g.refresh();
}
