import { UPGRADES, ENEMIES, BOSSES, PLAYER_STAGES, BALANCE, WHEEL, GOLDEN, TASKS, LOGIN_REWARDS } from './data.js';
import { t, upgradeName, wheelText, botNames } from './i18n.js';
import * as sdk from './sdk.js';

const KEY = 'mogni-vseh-save-v1';

export const state = {
  aura: 0,
  totalAura: 0,
  level: 0,
  kills: 0,
  upgrades: {},
  settings: { lang: null, sfx: true, music: true, vibro: true, shake: true },
  savedAt: 0,
  firstPlay: 0,
  effects: [],   // временные бонусы: { id, type, mult, rate, until, text }
  wheel: { day: '', freeUsed: false, ads: 0 },
  sigma: 0,        // сигма-очки за перерождения (навсегда)
  prestiges: 0,
  tasks: { day: '', list: [], bonus: false },
  login: { last: '', streak: 0 },
  buyMode: 1,      // 1 | 10 | 'max'
};

export const lvl = (id) => state.upgrades[id] || 0;

export function cost(u) {
  return Math.ceil(u.baseCost * Math.pow(u.growth, lvl(u.id)));
}

export const isMaxed = (u) => u.max != null && lvl(u.id) >= u.max;

// Сколько уровней ещё можно купить (с учётом потолка улучшения)
const roomLeft = (u) => (u.max != null ? u.max - lvl(u.id) : Infinity);

// Цена n уровней подряд (сумма геометрической прогрессии)
export function costN(u, n) {
  if (n <= 1) return cost(u);
  const first = u.baseCost * Math.pow(u.growth, lvl(u.id));
  return Math.ceil(first * (Math.pow(u.growth, n) - 1) / (u.growth - 1));
}

// Сколько уровней можно купить на текущую ауру
export function maxAffordable(u) {
  let n = 0;
  const room = roomLeft(u);
  while (n < room && n < 1000 && costN(u, n + 1) <= state.aura) n++;
  return n;
}

// Что покупаем в текущем режиме ×1 / ×10 / MAX: { n, price }
export function buyPlan(u) {
  const room = roomLeft(u);
  let n = state.buyMode === 'max' ? Math.max(1, maxAffordable(u)) : Math.min(state.buyMode, room);
  n = Math.max(1, Math.min(n, room));
  return { n, price: costN(u, n) };
}

export const sigmaMult = () => 1 + BALANCE.sigmaBonus * state.sigma;

// Следующая веха (×2) для улучшения
export const nextMilestone = (l) => (Math.floor(l / BALANCE.milestoneEvery) + 1) * BALANCE.milestoneEvery;

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
    const ms = Math.pow(2, Math.floor(l / BALANCE.milestoneEvery)); // вехи: ×2 каждые 25 уровней
    if (u.type === 'tap') tap += u.value * l * ms;
    else if (u.type === 'dps') dps += u.value * l * ms;
    else if (u.type === 'crit') crit += u.value * l;
    else if (u.type === 'mult') mult *= Math.pow(u.value, l);
  }
  const sm = sigmaMult();
  return {
    tap: tap * mult * tapM * sm,
    dps: dps * mult * dpsM * sm,
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

export function addEffect(effect, id = null) {
  state.effects.push({ ...effect, id, until: Date.now() + effect.sec * 1000 });
}

export const hasEffect = (id) => activeEffects().some((e) => e.id === id);

// ---------- колесо ауры (раз в день бесплатно + за рекламу) ----------

const today = () => new Date(sdk.now()).toLocaleDateString('sv'); // 2026-10-11

export function wheelStatus() {
  if (state.wheel.day !== today()) state.wheel = { day: today(), freeUsed: false, ads: 0 };
  return { free: !state.wheel.freeUsed, adsLeft: BALANCE.wheelAdSpins - state.wheel.ads };
}

export function useSpin(byAd) {
  wheelStatus();
  track('spin');
  if (byAd) state.wheel.ads++;
  else state.wheel.freeUsed = true;
}

export function msToMidnight() {
  const t = sdk.now();
  const d = new Date(t);
  d.setHours(24, 0, 0, 0);
  return d - t;
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
    return t('prize_upgrade', { e: u.emoji, name: upgradeName(u.id) });
  }
  addEffect(prize.effect);
  return wheelText(prize.id);
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
  const names = botNames();
  const n = names.length;
  const days = Math.max(0, (Date.now() - (state.firstPlay || Date.now())) / 86400000);
  const grow = 1 + 0.05 * days; // боты тоже «качаются» со временем
  const list = names.map((name, k) => {
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
  const normalBefore = level - Math.floor(level / BALANCE.bossEvery); // сколько обычных было до этого
  return ENEMIES[normalBefore % ENEMIES.length];
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

// Покупка в текущем режиме. Возвращает, сколько уровней куплено (0 — не хватило)
export function buy(u) {
  if (isMaxed(u)) return 0;
  const { n, price } = buyPlan(u);
  if (state.aura < price) return 0;
  state.aura -= price;
  state.upgrades[u.id] = lvl(u.id) + n;
  track('buys', n);
  return n;
}

export function cycleBuyMode() {
  state.buyMode = state.buyMode === 1 ? 10 : state.buyMode === 10 ? 'max' : 1;
  return state.buyMode;
}

// ---------- перерождение ----------

export function prestigeGain() {
  if (state.level < BALANCE.prestigeLevel) return 0;
  return Math.floor((state.level - 20) / 2);
}

export function doPrestige() {
  const gain = prestigeGain();
  if (!gain) return 0;
  state.sigma += gain;
  state.prestiges++;
  Object.assign(state, { aura: 0, level: 0, upgrades: {}, effects: [] });
  saveNow();
  return gain;
}

// ---------- золотая аура ----------

function pickWeighted(list) {
  const total = list.reduce((a, p) => a + p.weight, 0);
  let r = Math.random() * total;
  for (const p of list) { r -= p.weight; if (r <= 0) return p; }
  return list[0];
}

// Выдаёт награду, возвращает { id, amount }
export function catchGolden() {
  const g = pickWeighted(GOLDEN);
  track('golden');
  if (g.aura) {
    const amount = enemyReward(state.level) * g.aura;
    addAura(amount);
    return { id: g.id, amount };
  }
  addEffect(g.effect);
  return { id: g.id, amount: 0 };
}

// ---------- задания дня ----------

function hashStr(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619);
  return h >>> 0;
}

export function dailyTasks() {
  const day = today();
  if (state.tasks.day !== day) {
    const rand = rng(hashStr(day));
    const pool = [...TASKS];
    const list = [];
    while (list.length < 3) list.push(pool.splice(Math.floor(rand() * pool.length), 1)[0]);
    state.tasks = { day, bonus: false, list: list.map((tk) => ({ id: tk.id, need: tk.need, have: 0, claimed: false })) };
  }
  return state.tasks;
}

export function track(id, n = 1) {
  const task = dailyTasks().list.find((tk) => tk.id === id);
  if (task && !task.claimed) task.have = Math.min(task.need, task.have + n);
}

export function trackMax(id, value) {
  const task = dailyTasks().list.find((tk) => tk.id === id);
  if (task && !task.claimed) task.have = Math.min(task.need, Math.max(task.have, value));
}

export const taskReward = () => enemyReward(state.level) * BALANCE.taskReward;

export function claimTask(i) {
  const task = dailyTasks().list[i];
  if (!task || task.claimed || task.have < task.need) return 0;
  task.claimed = true;
  const amount = taskReward();
  addAura(amount);
  saveNow();
  return amount;
}

export const allTasksClaimed = () => dailyTasks().list.every((tk) => tk.claimed);

export function claimTaskBonus() {
  const tasks = dailyTasks();
  if (tasks.bonus || !allTasksClaimed()) return false;
  tasks.bonus = true;
  state.sigma += 1;
  saveNow();
  return true;
}

export function tasksClaimable() {
  const tasks = dailyTasks();
  return tasks.list.some((tk) => !tk.claimed && tk.have >= tk.need) || (!tasks.bonus && allTasksClaimed());
}

// ---------- серия дней ----------

const yesterday = () => new Date(sdk.now() - 86400000).toLocaleDateString('sv');

export function loginStatus() {
  if (state.login.last === today()) return { claimable: false, day: state.login.streak };
  const day = state.login.last === yesterday() ? (state.login.streak % LOGIN_REWARDS.length) + 1 : 1;
  return { claimable: true, day };
}

export const loginReward = (day) => enemyReward(Math.max(state.level, 3)) * LOGIN_REWARDS[day - 1];

export function claimLogin() {
  const { claimable, day } = loginStatus();
  if (!claimable) return null;
  const amount = loginReward(day);
  addAura(amount);
  const sigma = day === LOGIN_REWARDS.length ? 1 : 0;
  state.sigma += sigma;
  state.login = { last: today(), streak: day };
  saveNow();
  return { day, amount, sigma };
}

// ---------- сохранения ----------

function snapshot() {
  const { aura, totalAura, level, kills, upgrades, settings, firstPlay, effects, wheel, sigma, prestiges, tasks, login, buyMode } = state;
  return {
    aura, totalAura, level, kills, upgrades, settings, firstPlay, effects, wheel,
    sigma, prestiges, tasks, login, buyMode, savedAt: Date.now(),
  };
}

// Требование 1.9: прогресс сохраняется сразу после действия.
// Локально — мгновенно, в облако — не чаще раза в 5 секунд (последнее состояние не теряется).
const CLOUD_EVERY = 5000;
let cloudTimer = null;
let lastCloud = 0;
let loaded = false; // пока сохранение не загружено — ничего не пишем, чтобы не затереть его

function flushCloud() {
  cloudTimer = null;
  lastCloud = Date.now();
  sdk.cloudSave(snapshot());
}

export function save() {
  if (!loaded) return;
  const data = snapshot();
  state.savedAt = data.savedAt;
  try { localStorage.setItem(KEY, JSON.stringify(data)); } catch {}
  if (cloudTimer) return;
  const wait = Math.max(0, CLOUD_EVERY - (Date.now() - lastCloud));
  cloudTimer = setTimeout(flushCloud, wait);
}

// При сворачивании/закрытии — сразу в облако
export function saveNow() {
  if (!loaded) return;
  clearTimeout(cloudTimer);
  const data = snapshot();
  state.savedAt = data.savedAt;
  try { localStorage.setItem(KEY, JSON.stringify(data)); } catch {}
  flushCloud();
}

document.addEventListener('visibilitychange', () => { if (document.hidden) saveNow(); });
window.addEventListener('pagehide', saveNow);

// Возвращает ауру, накопленную офлайн (её ещё нужно начислить)
export async function load() {
  let local = null;
  try { local = JSON.parse(localStorage.getItem(KEY)); } catch {}
  const cloud = await sdk.cloudLoad();
  const data = [local, cloud]
    .filter((d) => d && d.savedAt)
    .sort((a, b) => b.savedAt - a.savedAt)[0];
  loaded = true;
  if (!data) {
    state.firstPlay = Date.now();
    return 0;
  }
  const settings = { ...state.settings, ...data.settings };
  if (data.muted) { settings.sfx = false; settings.music = false; } // старые сохранения
  delete data.muted;
  Object.assign(state, data, {
    settings,
    upgrades: { ...data.upgrades },
    effects: data.effects || [],
    wheel: data.wheel || state.wheel,
    firstPlay: data.firstPlay || Date.now(),
    sigma: data.sigma || 0,
    prestiges: data.prestiges || 0,
    tasks: data.tasks || state.tasks,
    login: data.login || state.login,
    buyMode: data.buyMode || 1,
  });

  const sec = Math.min((Date.now() - data.savedAt) / 1000, BALANCE.offlineMaxSec);
  const { dps } = stats();
  return sec > 60 ? Math.floor(dps * sec * BALANCE.offlineRatio) : 0;
}

// Сброс всего прогресса (настройки остаются)
export function resetProgress() {
  Object.assign(state, {
    aura: 0, totalAura: 0, level: 0, kills: 0, upgrades: {}, effects: [],
    firstPlay: Date.now(), wheel: { day: '', freeUsed: false, ads: 0 },
    sigma: 0, prestiges: 0, tasks: { day: '', list: [], bonus: false }, login: { last: '', streak: 0 },
  });
  saveNow();
}

export function format(n) {
  n = Math.floor(n);
  if (n < 1000) return String(n);
  const units = ['K', 'M', 'B', 'T', 'aa', 'ab', 'ac', 'ad'];
  let i = -1;
  while (n >= 1000 && i < units.length - 1) { n /= 1000; i++; }
  return (n < 10 ? n.toFixed(2) : n < 100 ? n.toFixed(1) : Math.floor(n)) + units[i];
}
