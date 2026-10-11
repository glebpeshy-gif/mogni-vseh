import { UPGRADES, ENEMIES, BOSSES, PLAYER_STAGES, BALANCE } from './data.js';
import * as sdk from './sdk.js';

const KEY = 'mogni-vseh-save-v1';

export const state = {
  aura: 0,
  totalAura: 0,
  level: 0,
  kills: 0,
  upgrades: {},
  muted: false,
  savedAt: 0,
  boostUntil: 0,
};

export const lvl = (id) => state.upgrades[id] || 0;

export function cost(u) {
  return Math.ceil(u.baseCost * Math.pow(u.growth, lvl(u.id)));
}

export const isMaxed = (u) => u.max != null && lvl(u.id) >= u.max;

export function stats() {
  let tap = 1, dps = 0, crit = 0, mult = 1;
  for (const u of UPGRADES) {
    const l = lvl(u.id);
    if (!l) continue;
    if (u.type === 'tap') tap += u.value * l;
    else if (u.type === 'dps') dps += u.value * l;
    else if (u.type === 'crit') crit += u.value * l;
    else if (u.type === 'mult') mult *= Math.pow(u.value, l);
  }
  const boost = Date.now() < state.boostUntil ? 2 : 1;
  return {
    tap: tap * mult * boost,
    dps: dps * mult * boost,
    crit: Math.min(crit, BALANCE.critMax),
    boost,
  };
}

export const isBoss = (level) => level % BALANCE.bossEvery === BALANCE.bossEvery - 1;

export function enemyFor(level) {
  if (isBoss(level)) return BOSSES[Math.floor(level / BALANCE.bossEvery) % BOSSES.length];
  return ENEMIES[level % ENEMIES.length];
}

function baseHp(level) {
  return Math.ceil(BALANCE.hpBase * Math.pow(BALANCE.hpGrowth, level));
}

export function enemyHp(level) {
  return baseHp(level) * (isBoss(level) ? BALANCE.bossHpMult : 1);
}

export function enemyReward(level) {
  return Math.ceil(baseHp(level) * BALANCE.rewardRatio) * (isBoss(level) ? BALANCE.bossRewardMult : 1);
}

export function playerStage() {
  const total = Object.values(state.upgrades).reduce((a, b) => a + b, 0);
  let stage = PLAYER_STAGES[0], index = 0;
  PLAYER_STAGES.forEach((s, i) => { if (total >= s.from) { stage = s; index = i; } });
  return { ...stage, index };
}

export function addAura(n) {
  state.aura += n;
  state.totalAura += n;
}

export function buy(u) {
  const c = cost(u);
  if (state.aura < c || isMaxed(u)) return false;
  state.aura -= c;
  state.upgrades[u.id] = lvl(u.id) + 1;
  return true;
}

// ---------- сохранения ----------

function snapshot() {
  const { aura, totalAura, level, kills, upgrades, muted } = state;
  return { aura, totalAura, level, kills, upgrades, muted, savedAt: Date.now() };
}

export function save() {
  const data = snapshot();
  state.savedAt = data.savedAt;
  try { localStorage.setItem(KEY, JSON.stringify(data)); } catch {}
  sdk.cloudSave(data);
}

// Возвращает ауру, накопленную офлайн (её ещё нужно начислить)
export async function load() {
  let local = null;
  try { local = JSON.parse(localStorage.getItem(KEY)); } catch {}
  const cloud = await sdk.cloudLoad();
  const data = [local, cloud]
    .filter((d) => d && d.savedAt)
    .sort((a, b) => b.savedAt - a.savedAt)[0];
  if (!data) return 0;
  Object.assign(state, data, { upgrades: { ...data.upgrades } });

  const sec = Math.min((Date.now() - data.savedAt) / 1000, BALANCE.offlineMaxSec);
  const { dps } = stats();
  return sec > 60 ? Math.floor(dps * sec * BALANCE.offlineRatio) : 0;
}

export function format(n) {
  n = Math.floor(n);
  if (n < 1000) return String(n);
  const units = ['K', 'M', 'B', 'T', 'aa', 'ab', 'ac', 'ad'];
  let i = -1;
  while (n >= 1000 && i < units.length - 1) { n /= 1000; i++; }
  return (n < 10 ? n.toFixed(2) : n < 100 ? n.toFixed(1) : Math.floor(n)) + units[i];
}
