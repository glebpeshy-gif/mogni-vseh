// Окна «Задания дня» и «Серия дней» — поводы заходить каждый день
import { LOGIN_REWARDS } from '../data.js';
import {
  dailyTasks, claimTask, claimTaskBonus, allTasksClaimed, taskReward,
  loginStatus, loginReward, claimLogin, msToMidnight, format,
} from '../state.js';
import { COLORS, HEX, txt, body, button, modal, drawCard, pop } from '../theme.js';
import { t } from '../i18n.js';
import * as sound from '../sound.js';

function hhmmss(ms) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const p = (n) => String(n).padStart(2, '0');
  return `${p(Math.floor(s / 3600))}:${p(Math.floor((s % 3600) / 60))}:${p(s % 60)}`;
}

// ---------- задания дня ----------

export function openTasks(scene, { onChange } = {}) {
  const timer = scene.time.addEvent({ delay: 1000, loop: true, callback: () => reset.setText(t('tasks_reset', { t: hhmmss(msToMidnight()) })) });
  const { panel } = modal(scene, 640, 860, t('tasks_title'), { onClose: () => timer.remove() });
  const rows = [];

  dailyTasks().list.forEach((task, i) => {
    const y = -270 + i * 150;
    const card = scene.add.graphics({ x: 0, y });
    drawCard(card, 580, 130, COLORS.cardLight, { radius: 20, depth: 5 });
    const title = body(scene, -265, y - 34, t(`task_${task.id}`, { n: task.need }), 24, HEX.white).setOrigin(0, 0.5);
    const barBg = scene.add.graphics({ x: -265, y: y + 14 });
    barBg.fillStyle(COLORS.ink, 1).fillRoundedRect(0, -12, 330, 24, 12);
    const bar = scene.add.graphics({ x: -265, y: y + 14 });
    const prog = body(scene, -100, y + 14, '', 16, HEX.white, { stroke: HEX.ink, strokeThickness: 4 }).setOrigin(0.5);
    const reward = body(scene, -265, y + 46, `✨ ${format(taskReward())}`, 18, HEX.yellow).setOrigin(0, 0.5);
    const btn = button(scene, 190, y + 10, 160, 70, '', COLORS.lime, () => {
      const amount = claimTask(i);
      if (!amount) return;
      sound.prize();
      pop(scene, 360, 640 + y, `+${format(amount)} ✨`, 40, HEX.yellow, 100);
      paint();
      onChange?.();
    }, { size: 20, textColor: HEX.ink });
    btn.label.setStroke('#ffffff', 0);
    panel.add([card, title, barBg, bar, prog, reward, btn]);
    rows.push({ task, bar, prog, btn });
  });

  const bonusText = body(scene, 0, 210, t('tasks_bonus'), 22, HEX.cyan).setOrigin(0.5);
  const bonusBtn = button(scene, 0, 285, 380, 76, t('tasks_bonus_btn'), COLORS.purple, () => {
    if (!claimTaskBonus()) return;
    sound.prize();
    pop(scene, 360, 900, '+1 🗿', 56, HEX.lime, 120);
    paint();
    onChange?.();
  }, { size: 24 });
  const reset = body(scene, 0, 370, t('tasks_reset', { t: hhmmss(msToMidnight()) }), 18, '#8f84c2').setOrigin(0.5);
  panel.add([bonusText, bonusBtn, reset]);

  function paint() {
    for (const { task, bar, prog, btn } of rows) {
      const k = task.have / task.need;
      bar.clear();
      if (k > 0) bar.fillStyle(task.claimed ? COLORS.gray : COLORS.lime, 1).fillRoundedRect(0, -12, Math.max(24, 330 * k), 24, 12);
      prog.setText(`${format(task.have)} / ${format(task.need)}`);
      const ready = !task.claimed && task.have >= task.need;
      btn.setEnabled(ready).setLabel(task.claimed ? t('done') : t('take'));
      btn.label.setColor(ready ? HEX.ink : '#9a90c0');
    }
    const tasks = dailyTasks();
    bonusBtn.setEnabled(!tasks.bonus && allTasksClaimed());
    bonusBtn.setVisible(!tasks.bonus);
    if (tasks.bonus) bonusText.setText('🗿 ✓');
  }
  paint();
}

// ---------- серия дней ----------

export function openLogin(scene, { onDone } = {}) {
  const { day } = loginStatus();
  let claimed = false;
  const claimAndClose = () => {
    if (claimed) return;
    claimed = true;
    const r = claimLogin();
    if (r) {
      sound.prize();
      pop(scene, 360, 560, t('login_got', { n: format(r.amount) }) + (r.sigma ? '\n+1 🗿' : ''), 48, HEX.yellow, 120);
    }
    close();
  };
  const { panel, close } = modal(scene, 650, 760, t('login_title'), { onClose: () => onDone?.(), onX: claimAndClose });

  panel.add(body(scene, 0, -270, t('login_text'), 20, HEX.soft, { align: 'center' }).setOrigin(0.5));

  LOGIN_REWARDS.forEach((_, i) => {
    const d = i + 1;
    const big = d === LOGIN_REWARDS.length;
    const col = big ? 0 : i % 3;
    const row = big ? 2 : Math.floor(i / 3);
    const x = big ? 0 : -190 + col * 190;
    const y = -150 + row * 150;
    const w = big ? 560 : 170;
    const g = scene.add.graphics({ x, y });
    const color = d < day ? COLORS.gray : d === day ? COLORS.lime : COLORS.cardLight;
    drawCard(g, w, 126, color, { radius: 18, depth: 5, stroke: d === day ? 0xffffff : null });
    const ink = d === day ? HEX.ink : HEX.white;
    const label = txt(scene, x, y - 34, t('login_day', { n: d }), 18, ink, d === day ? { strokeThickness: 0 } : {}).setOrigin(0.5);
    const amount = body(scene, x, y + 4, `✨ ${format(loginReward(d))}`, 20, d === day ? HEX.ink : HEX.yellow).setOrigin(0.5);
    const extra = body(scene, x, y + 36, d < day ? '✓' : big ? '+1 🗿' : '', 22, d === day ? HEX.ink : HEX.lime).setOrigin(0.5);
    panel.add([g, label, amount, extra]);
    if (d === day) scene.tweens.add({ targets: [label, amount, extra], scale: 1.08, duration: 500, yoyo: true, repeat: -1 });
  });

  const btn = button(scene, 0, 300, 380, 84, t('take'), COLORS.lime, claimAndClose, { size: 28, textColor: HEX.ink });
  btn.label.setStroke('#ffffff', 0);
  panel.add(btn);
}
