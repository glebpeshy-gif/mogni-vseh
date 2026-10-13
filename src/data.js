// Все игровые данные в одном месте — баланс правится здесь.
// Названия и тексты — в i18n.js. emoji — временная картинка, пока нет файла в src/art/
//
// bg — фон соперника: градиент сверху вниз, цвет свечения и стикеры на фоне.
// pattern: stripes / dots / grid — узор поверх градиента.

// Порядок — по росту гигачадности: от растерянного нормиса до чада-викинга
export const ENEMIES = [
  { id: 'normis',    emoji: '😐', bg: { top: '#3b4266', bottom: '#151827', glow: '#8fa3ff', pattern: 'grid',    stickers: ['😐', '📄', '☕', '🥱', '💤'] } },
  { id: 'otlichnik', emoji: '🤓', bg: { top: '#1f5a40', bottom: '#0a1f17', glow: '#b6ff3b', pattern: 'grid',    stickers: ['📚', '✏️', '📐', '🧮', '💯'] } },
  { id: 'streamer',  emoji: '🎧', bg: { top: '#3b1f7a', bottom: '#0d0a22', glow: '#9146ff', pattern: 'grid',    stickers: ['🎮', '🎧', '💬', '🕹️', '🔴'] } },
  { id: 'patsan',    emoji: '🧢', bg: { top: '#3a3f4a', bottom: '#121419', glow: '#ff8a3d', pattern: 'grid',    stickers: ['🍭', '🧢', '🛹', '👟', '🏚️'] } },
  { id: 'tiktoker',  emoji: '🤳', bg: { top: '#1e2a5c', bottom: '#0a0a1a', glow: '#4f7bff', pattern: 'stripes', stickers: ['🖤', '⛓️', '🎧', '🦇', '💙'] } },
  { id: 'animetyan', emoji: '🌸', bg: { top: '#6b1f58', bottom: '#1e0b2e', glow: '#ffb7e0', pattern: 'dots',    stickers: ['🌸', '✨', '🎀', '💖', '🍡'] } },
  { id: 'cat',       emoji: '😼', bg: { top: '#5a3f15', bottom: '#160e04', glow: '#ffd27a', pattern: 'dots',    stickers: ['🐟', '🧶', '🐾', '😼', '🥛'] } },
  { id: 'bloger',    emoji: '💸', bg: { top: '#0f4a39', bottom: '#03140f', glow: '#3dff9a', pattern: 'dots',    stickers: ['💸', '💰', '🤑', '💎', '📈'] } },
  { id: 'kachok',    emoji: '💪', bg: { top: '#6a1d0b', bottom: '#1a0804', glow: '#ff8a3d', pattern: 'stripes', stickers: ['🏋️', '💪', '🥩', '🔥', '🥤'] } },
  { id: 'chad',      emoji: '🧔', bg: { top: '#1f3a5a', bottom: '#0a1626', glow: '#7fd8ff', pattern: 'stripes', stickers: ['👍', '🛡️', '❄️', '🏔️', '🗿'] } },
];

export const BOSSES = [
  { id: 'boss_sigma',    emoji: '🕴️', bg: { top: '#2a2f3a', bottom: '#05070c', glow: '#ff2e2e', pattern: 'stripes', stickers: ['💼', '🕶️', '🎧', '📈', '💀'] } },
  { id: 'boss_gigachad', emoji: '🧔', bg: { top: '#3a3a3a', bottom: '#050505', glow: '#ffffff', pattern: 'stripes', stickers: ['🦍', '💪', '🗿', '🔥', '🏆'] } },
  { id: 'boss_king',     emoji: '👑', bg: { top: '#4a3300', bottom: '#120b00', glow: '#ffd700', pattern: 'dots',    stickers: ['👑', '💎', '✨', '🏆', '💰'] } },
];

// type: tap — сила тапа, dps — автомог в секунду,
//       crit — шанс крита, mult — множитель всего урона
export const UPGRADES = [
  { id: 'mewing', emoji: '👅', type: 'tap',  value: 1,    baseCost: 10,    growth: 1.15 },
  { id: 'gym',    emoji: '🏋️', type: 'dps',  value: 1,    baseCost: 40,    growth: 1.15 },
  { id: 'jaw',    emoji: '🦴', type: 'tap',  value: 6,    baseCost: 150,   growth: 1.17 },
  { id: 'eyes',   emoji: '👁️', type: 'crit', value: 0.02, baseCost: 300,   growth: 1.6, max: 25 },
  { id: 'subs',   emoji: '📱', type: 'dps',  value: 10,   baseCost: 900,   growth: 1.17 },
  { id: 'hair',   emoji: '💇', type: 'tap',  value: 45,   baseCost: 3000,  growth: 1.19 },
  { id: 'outfit', emoji: '🧥', type: 'mult', value: 1.3,  baseCost: 5000,  growth: 2.2 },
  { id: 'photo',  emoji: '📸', type: 'dps',  value: 80,   baseCost: 15000, growth: 1.19 },
];

// Внешность игрока меняется от суммы уровней прокачки
export const PLAYER_STAGES = [
  { from: 0,   emoji: '😩' }, // Нормис
  { from: 8,   emoji: '👅' }, // Мьюер
  { from: 20,  emoji: '🧖' }, // Луксмаксер
  { from: 40,  emoji: '😏' }, // Красавчик
  { from: 70,  emoji: '😎' }, // Чад
  { from: 110, emoji: '🗿' }, // Гигачад
];

export const BALANCE = {
  hpBase: 15,
  hpGrowth: 1.32,      // во сколько раз сильнее каждый следующий соперник
  rewardRatio: 0.6,    // аура за победу = HP * rewardRatio
  bossEvery: 10,       // каждый 10-й — босс
  bossHpMult: 8,
  bossRewardMult: 4,
  bossTime: 30,        // секунд на босса
  critMult: 5,
  critMax: 0.5,
  offlineMaxSec: 2 * 60 * 60,
  offlineRatio: 0.5,
  adBoostSec: 60,
  bossRetryBonus: 15,  // +секунд к таймеру босса за рекламу
  wheelAdSpins: 3,     // доп. прокрутов колеса за рекламу в день

  // перерождение
  prestigeLevel: 30,   // с какого уровня можно переродиться
  sigmaBonus: 0.1,     // +10% урона за каждое сигма-очко
  // вехи: каждые 25 уровней улучшения его сила ×2
  milestoneEvery: 25,
  // комбо: тапы чаще чем раз в comboWindow мс копят серию
  comboWindow: 650,
  combo: [[60, 3], [30, 2], [10, 1.5]], // [от скольки тапов, множитель]
  // золотая аура: появляется раз в 40–100 сек, живёт 9 сек
  goldenMin: 40,
  goldenMax: 100,
  goldenLife: 9,
  taskReward: 8,       // награда за задание = 8 наград за текущего соперника
};

// Что даёт пойманная золотая аура
export const GOLDEN = [
  { id: 'pack',   weight: 45, aura: 10 },
  { id: 'frenzy', weight: 30, effect: { type: 'tap', mult: 7, sec: 15 } },
  { id: 'storm',  weight: 25, effect: { type: 'autotap', rate: 15, sec: 12 } },
];

// Задания дня: каждый день выбираются 3 случайных
export const TASKS = [
  { id: 'kills',  need: 25 },
  { id: 'taps',   need: 300 },
  { id: 'buys',   need: 15 },
  { id: 'boss',   need: 1 },
  { id: 'spin',   need: 1 },
  { id: 'golden', need: 1 },
  { id: 'combo',  need: 40 },
];

// Серия дней: множитель награды (× награда за соперника) по дням 1–7; на 7-й ещё +1 сигма-очко
export const LOGIN_REWARDS = [3, 5, 8, 12, 18, 25, 50];

// Колесо ауры. weight — вероятность (чем больше, тем чаще)
// effect.type: tap / dps / all — множитель, crit — каждый тап крит, autotap — автотапы в секунду
// aura — сколько наград за текущего соперника выдать
export const WHEEL = [
  { id: 'tap3',    color: 0xff2e97, weight: 18, effect: { type: 'tap', mult: 3, sec: 30 } },
  { id: 'aura',    color: 0xffe14d, weight: 20, aura: 5 },
  { id: 'dps5',    color: 0x29f0ff, weight: 15, effect: { type: 'dps', mult: 5, sec: 30 } },
  { id: 'crit',    color: 0xb6ff3b, weight: 12, effect: { type: 'crit', sec: 30 } },
  { id: 'storm',   color: 0x8b5cff, weight: 12, effect: { type: 'autotap', rate: 12, sec: 20 } },
  { id: 'upgrade', color: 0xff8a3d, weight: 12, upgrade: true },
  { id: 'mega',    color: 0xff2e97, weight: 8,  aura: 25 },
  { id: 'jackpot', color: 0xffffff, weight: 3,  effect: { type: 'all', mult: 10, sec: 15 } },
];

export const EFFECT_ICONS = { tap: '👆', dps: '⚙️', all: '💎', crit: '💥', autotap: '🌪️' };

// Шмот: мемы СНГ 2025–26. price — в 💅 вайбе
export const STYLE_SLOTS = [
  { id: 'hat', emoji: '🧢' },
  { id: 'glasses', emoji: '🕶️' },
  { id: 'top', emoji: '👕' },
  { id: 'hand', emoji: '🍫' },
  { id: 'effect', emoji: '✨' },
];
export const COSMETICS = [
  { id: 'cap_back',     slot: 'hat',     emoji: '🧢', price: 40 },
  { id: 'pompom',       slot: 'hat',     emoji: '🧶', price: 90 },
  { id: 'ushanka',      slot: 'hat',     emoji: '❄️', price: 160 },
  { id: 'cat_ears',     slot: 'hat',     emoji: '🐱', price: 250 },
  { id: 'halo',         slot: 'hat',     emoji: '😇', price: 600 },
  { id: 'tiny',         slot: 'glasses', emoji: '🕶️', price: 50 },
  { id: 'nerd',         slot: 'glasses', emoji: '🤓', price: 80 },
  { id: 'hearts',       slot: 'glasses', emoji: '😍', price: 150 },
  { id: 'pixel',        slot: 'glasses', emoji: '😎', price: 300 },
  { id: 'laser',        slot: 'glasses', emoji: '🔴', price: 700 },
  { id: 'tee67',        slot: 'top',     emoji: '👕', price: 67 },
  { id: 'tracksuit',    slot: 'top',     emoji: '🏃', price: 120 },
  { id: 'grandpa',      slot: 'top',     emoji: '🦌', price: 180 },
  { id: 'hoodie_sigma', slot: 'top',     emoji: '🖤', price: 350 },
  { id: 'suit',         slot: 'top',     emoji: '👔', price: 550 },
  { id: 'seeds',        slot: 'hand',    emoji: '🌻', price: 30 },
  { id: 'bag',          slot: 'hand',    emoji: '🛍️', price: 70 },
  { id: 'shawarma',     slot: 'hand',    emoji: '🌯', price: 140 },
  { id: 'matcha',       slot: 'hand',    emoji: '🍵', price: 220 },
  { id: 'dubai',        slot: 'hand',    emoji: '🍫', price: 400 },
  { id: 'slay',         slot: 'effect',  emoji: '💅', price: 200 },
  { id: 'brainrot',     slot: 'effect',  emoji: '🧠', price: 350 },
  { id: 'phonk',        slot: 'effect',  emoji: '💀', price: 500 },
  { id: 'sigma_bolt',   slot: 'effect',  emoji: '⚡', price: 750 },
  { id: 'aura_farm',    slot: 'effect',  emoji: '🌬️', price: 1000 },
];

// Сколько 💅 вайба за что
export const VIBE = { kill: 1, boss: 10, task: 15, golden: 5, loginPerDay: 5 };
