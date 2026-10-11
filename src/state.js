import { UPGRADES, ENEMIES, BOSSES, PLAYER_STAGES, BALANCE, WHEEL, BOT_NAMES } from './data.js';
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
  firstPlay: 0,
  effects: [],   // временные бонусы: { id, type, mult, rate, until, text }
  wheel: { day: '', freeUsed: false, ads: 0 },
};

export const lvl = (id) => state.upgrades[id] || 0;

export function cost(u) {
  return Math.ceil(u.baseCost * Math.pow(u.growth, lvl(u.id)));
}

export const isMaxed = (u) => u.max != null && lvl(u.id) >= u.max;

export function stats() {
  let tap = 1, dps = 0, crit = 0, mult = 1;
  let tapM = 1, dpsM = 1, critAll = false, autotap = 0;
  for (const e of activeEffects()) {
    if (e.type === 'tap') tapM *= e.mult;
    else if (e.type === 'dps') dpsM *= e.mult;
    else if (e.type === 'all') { tapM *= e.mult; dpsM *= e.mult; }
    else if (e.type === 'crit') critAll = true;
    else if (e.type === 'autotap') autotap += e.rate;
  }
  for (const u of UPGRADES) {
    const l = lvl(u.id);
    if (!l) continue;
    if (u.type === 'tap') tap += u.value * l;
    else if (u.type === 'dps') dps += u.value * l;
    else if (u.type === 'crit') crit += u.value * l;
    else if (u.type === 'mult') mult *= Math.pow(u.value, l);
  }
  return {
    tap: tap * mult * tapM,
    dps: dps * mult * dpsM,
    crit: critAll ? 1 : Math.min(crit, BALANCE.critMax),
    autotap,
  };
}

// ---------- временные эффекты ----------

export function activeEffects() {
  const now = Date.now();
  if (state.effects.some((e) => e.until <= now)) state.effects = state.effects.filter((e) => e.until > now);
  return state.effects;
}

export function addEffect(effect, text, id = null) {
  state.effects.push({ ...effect, id, text, until: Date.now() + effect.sec * 1000 });
}

export const hasEffect = (id) => activeEffects().some((e) => e.id === id);

// ---------- колесо ауры (раз в день бесплатно + за рекламу) ----------

const today = () => new Date().toLocaleDateString('sv'); // 2026-10-11

export function wheelStatus() {
  if (state.wheel.day !== today()) state.wheel = { day: today(), freeUsed: false, ads: 0 };
  return { free: !state.wheel.freeUsed, adsLeft: BALANCE.wheelAdSpins - state.wheel.ads };
}

export function useSpin(byAd) {
  wheelStatus();
  if (byAd) state.wheel.ads++;
  else state.wheel.freeUsed = true;
}

export function msToMidnight() {
  const d = new Date();
  d.setHours(24, 0, 0, 0);
  return d - Date.now();
}

export function rollWheel() {
  const total = WHEEL.reduce((a, p) => a + p.weight, 0);
  let r = Math.random() * total;
  for (let i = 0; i < WHEEL.length; i++) {
    r -= WHEEL[i].weight;
    if (r <= 0) return i;
  }
  return 0;
}

// Выдаёт приз, возвращает текст для показа
export function applyPrize(prize) {
  if (prize.aura) {
    const n = enemyReward(state.level) * prize.aura;
    addAura(n);
    return `+${format(n)} ✨`;
  }
  if (prize.upgrade) {
    const pool = UPGRADES.filter((u) => !isMaxed(u));
    const u = pool[Math.floor(Math.random() * pool.length)];
    state.upgrades[u.id] = lvl(u.id) + 1;
    return `${u.emoji} ${u.name} +1 ур.`;
  }
  addEffect(prize.effect, prize.text);
  return prize.text;
}

// ---------- таблица лидеров (боты + игрок) ----------

function rng(seed) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function leaderboard() {
  const rand = rng(1337);
  const n = BOT_NAMES.length;
  const days = Math.max(0, (Date.now() - (state.firstPlay || Date.now())) / 86400000);
  const grow = 1 + 0.05 * days; // боты тоже «качаются» со временем
  const list = BOT_NAMES.map((name, k) => {
    const exp = 1.6 + 8.1 * Math.pow(k / (n - 1), 1.2);
    return { name, score: Math.floor(Math.pow(10, exp) * (0.8 + 0.45 * rand()) * grow) };
  });
  list.push({ name: 'ТЫ', score: Math.floor(state.totalAura), me: true });
  list.sort((a, b) => b.score - a.score);
  list.forEach((e, i) => { e.rank = i + 1; });
  return list;
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
  const { aura, totalAura, level, kills, upgrades, muted, firstPlay, effects, wheel } = state;
  return { aura, totalAura, level, kills, upgrades, muted, firstPlay, effects, wheel, savedAt: Date.now() };
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
  if (!data) {
    state.firstPlay = Date.now();
    return 0;
  }
  Object.assign(state, data, {
    upgrades: { ...data.upgrades },
    effects: data.effects || [],
    wheel: data.wheel || state.wheel,
    firstPlay: data.firstPlay || Date.now(),
  });

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
