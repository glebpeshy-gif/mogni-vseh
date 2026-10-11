// Все игровые данные в одном месте — баланс правится здесь.
// Названия и тексты — в i18n.js. emoji — временная картинка, пока нет файла в src/art/
//
// bg — фон соперника: градиент сверху вниз, цвет свечения и стикеры на фоне.
// pattern: stripes / dots / grid — узор поверх градиента.

export const ENEMIES = [
  { id: 'normis',    emoji: '😐', bg: { top: '#3b4266', bottom: '#151827', glow: '#8fa3ff', pattern: 'grid',    stickers: ['😐', '📄', '☕', '🥱', '💤'] } },
  { id: 'tiktoker',  emoji: '🤳', bg: { top: '#1e2a5c', bottom: '#0a0a1a', glow: '#4f7bff', pattern: 'stripes', stickers: ['🖤', '⛓️', '🎧', '🦇', '💙'] } },
  { id: 'streamer',  emoji: '🎧', bg: { top: '#3b1f7a', bottom: '#0d0a22', glow: '#9146ff', pattern: 'grid',    stickers: ['🎮', '🎧', '💬', '🕹️', '🔴'] } },
  { id: 'otlichnik', emoji: '🤓', bg: { top: '#1f5a40', bottom: '#0a1f17', glow: '#b6ff3b', pattern: 'grid',    stickers: ['📚', '✏️', '📐', '🧮', '💯'] } },
  { id: 'kachok',    emoji: '💪', bg: { top: '#6a1d0b', bottom: '#1a0804', glow: '#ff8a3d', pattern: 'stripes', stickers: ['🏋️', '💪', '🥩', '🔥', '🥤'] } },
  { id: 'patsan',    emoji: '🧢', bg: { top: '#3a3f4a', bottom: '#121419', glow: '#ff8a3d', pattern: 'grid',    stickers: ['🍭', '🧢', '🛹', '👟', '🏚️'] } },
  { id: 'animetyan', emoji: '🌸', bg: { top: '#6b1f58', bottom: '#1e0b2e', glow: '#ffb7e0', pattern: 'dots',    stickers: ['🌸', '✨', '🎀', '💖', '🍡'] } },
  { id: 'cat',       emoji: '😼', bg: { top: '#5a3f15', bottom: '#160e04', glow: '#ffd27a', pattern: 'dots',    stickers: ['🐟', '🧶', '🐾', '😼', '🥛'] } },
  { id: 'bloger',    emoji: '💸', bg: { top: '#0f4a39', bottom: '#03140f', glow: '#3dff9a', pattern: 'dots',    stickers: ['💸', '💰', '🤑', '💎', '📈'] } },
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
  { id: 'photo',  emoji: '📸', type: 'dps',  value: 80,   baseCost: 15000, growth: 1.19 },
  { id: 'outfit', emoji: '🧥', type: 'mult', value: 1.3,  baseCost: 5000,  growth: 2.2 },
];

// Внешность игрока меняется от суммы уровней прокачки
export const PLAYER_STAGES = [
  { from: 0,   emoji: '😐' },
  { from: 10,  emoji: '🙂' },
  { from: 30,  emoji: '😏' },
  { from: 60,  emoji: '😎' },
  { from: 110, emoji: '🗿' },
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
};

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
