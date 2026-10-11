// Все игровые данные в одном месте — баланс правится здесь.
// emoji — временная картинка, пока нет файла в public/assets/...

export const ENEMIES = [
  { id: 'normis',    name: 'Нормис Петя',      emoji: '😐' },
  { id: 'tiktoker',  name: 'Тиктокер',         emoji: '🤳' },
  { id: 'streamer',  name: 'Стример',          emoji: '🎧' },
  { id: 'otlichnik', name: 'Отличник',         emoji: '🤓' },
  { id: 'kachok',    name: 'Качок из зала',    emoji: '💪' },
  { id: 'fizruk',    name: 'Физрук',           emoji: '📣' },
  { id: 'animetyan', name: 'Аниме-тян',        emoji: '🌸' },
  { id: 'cat',       name: 'Кот-модель',       emoji: '😼' },
  { id: 'bloger',    name: 'Блогер-миллионер', emoji: '💸' },
];

export const BOSSES = [
  { id: 'boss_sigma',    name: 'Сигма-босс',  emoji: '🗿' },
  { id: 'boss_gigachad', name: 'Гигачад',     emoji: '🦍' },
  { id: 'boss_king',     name: 'Король ауры', emoji: '👑' },
];

// type: tap — сила тапа, dps — автомог в секунду,
//       crit — шанс крита, mult — множитель всего урона
export const UPGRADES = [
  { id: 'mewing',  name: 'Мьюинг',       emoji: '👅', type: 'tap',  value: 1,    baseCost: 10,    growth: 1.15 },
  { id: 'gym',     name: 'Качалка',      emoji: '🏋️', type: 'dps',  value: 1,    baseCost: 40,    growth: 1.15 },
  { id: 'jaw',     name: 'Челюсть',      emoji: '🦴', type: 'tap',  value: 6,    baseCost: 150,   growth: 1.17 },
  { id: 'eyes',    name: 'Хантер-айз',   emoji: '👁️', type: 'crit', value: 0.02, baseCost: 300,   growth: 1.6, max: 25 },
  { id: 'subs',    name: 'Подписчики',   emoji: '📱', type: 'dps',  value: 10,   baseCost: 900,   growth: 1.17 },
  { id: 'hair',    name: 'Причёска',     emoji: '💇', type: 'tap',  value: 45,   baseCost: 3000,  growth: 1.19 },
  { id: 'photo',   name: 'Фотосессия',   emoji: '📸', type: 'dps',  value: 80,   baseCost: 15000, growth: 1.19 },
  { id: 'outfit',  name: 'Гардероб',     emoji: '🧥', type: 'mult', value: 1.3,  baseCost: 5000,  growth: 2.2 },
];

// Внешность игрока меняется от суммы уровней прокачки
export const PLAYER_STAGES = [
  { from: 0,   name: 'Нормис',    emoji: '😐' },
  { from: 10,  name: 'Мьюер',     emoji: '🙂' },
  { from: 30,  name: 'Красавчик', emoji: '😏' },
  { from: 60,  name: 'Чад',       emoji: '😎' },
  { from: 110, name: 'Гигачад',   emoji: '🗿' },
];

export const BALANCE = {
  hpBase: 10,
  hpGrowth: 1.27,      // во сколько раз сильнее каждый следующий соперник
  rewardRatio: 0.7,    // аура за победу = HP * rewardRatio
  bossEvery: 10,       // каждый 10-й — босс
  bossHpMult: 6,
  bossRewardMult: 4,
  bossTime: 30,        // секунд на босса
  critMult: 5,
  critMax: 0.5,
  offlineMaxSec: 2 * 60 * 60,
  offlineRatio: 0.5,
  adBoostSec: 60,
};

export const TAP_PHRASES = ['МОГ', 'АУРА', '-самооценка', 'мьюинг', 'слабак'];
export const KILL_PHRASES = ['ЗАМОГАН!', 'ЛЕГКО!', 'МИНУС АУРА', 'УНИЧТОЖЕН', 'АУРА +1000'];
