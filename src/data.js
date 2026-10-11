// Все игровые данные в одном месте — баланс правится здесь.
// emoji — временная картинка, пока нет файла в src/art/

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
  bossRetryBonus: 15, // +секунд к таймеру босса за рекламу
  wheelAdSpins: 3,     // доп. прокрутов колеса за рекламу в день
};

// Колесо ауры. weight — вероятность (чем больше, тем чаще)
// effect.type: tap / dps / all — множитель, crit — каждый тап крит, autotap — автотапы в секунду
// aura — сколько наград за текущего соперника выдать
export const WHEEL = [
  { label: '×3\nТАП',      text: '×3 к тапу на 30 сек',         color: 0xff2e97, weight: 18, effect: { type: 'tap', mult: 3, sec: 30 } },
  { label: '+\nАУРА',      text: 'Пачка ауры',                  color: 0xffe14d, weight: 20, aura: 5 },
  { label: '×5\nАВТО',     text: '×5 автомог на 30 сек',        color: 0x29f0ff, weight: 15, effect: { type: 'dps', mult: 5, sec: 30 } },
  { label: '100%\nКРИТ',   text: 'Каждый тап — крит, 30 сек',   color: 0xb6ff3b, weight: 12, effect: { type: 'crit', sec: 30 } },
  { label: 'МОГ\nШТОРМ',   text: 'Мог-шторм: автотапы 20 сек',  color: 0x8b5cff, weight: 12, effect: { type: 'autotap', rate: 12, sec: 20 } },
  { label: '+1\nАПГРЕЙД', text: '+1 уровень случайной прокачки', color: 0xff8a3d, weight: 12, upgrade: true },
  { label: 'МЕГА\nАУРА',   text: 'МЕГА-пачка ауры',             color: 0xff2e97, weight: 8,  aura: 25 },
  { label: 'ДЖЕК\nПОТ',    text: 'ДЖЕКПОТ: ×10 ко всему, 15 сек', color: 0xffffff, weight: 3,  effect: { type: 'all', mult: 10, sec: 15 } },
];

export const EFFECT_ICONS = { tap: '👆', dps: '⚙️', all: '💎', crit: '💥', autotap: '🌪️' };

// Ники ботов для таблицы лидеров
export const BOT_NAMES = [
  'сигма_2011', 'Ауроед', 'МьюингБог', 'gigachad777', 'Тимоха_Скуф', 'НеНормис', 'lil_mog',
  'Ксюша_Глоу', 'АураФарм', 'Красавчик9Б', 'jawline_king', 'Дашуля💅', 'мистер_рофл', 'ХантерАйз',
  'вайб_чекер', 'Сеня_Чад', 'ДокторМьюинг', 'кринж_хантер', 'Rizzler_RU', 'Мегамозг', 'аура_минус',
  'Лёха_Скибид', 'NPC_Игорь', 'Мама_Сигмы', 'glow_up_2026', 'ВаняРизз', 'котик_морган', 'Димон_мог',
  'just_mewing', 'ЛуксМакс', 'Полина_Слэй', 'xX_Мог_Xx', 'бро_ну_ты_чё', 'дед_инсайд', 'Арсений_Пик',
  'Слэйер3000', 'Ника_Вайб', 'омега_нормис', 'Чадович', 'ты_замоган',
];

export const TAP_PHRASES = ['МОГ', 'АУРА', '-самооценка', 'мьюинг', 'РИЗЗ', 'слэй', 'глоу ап', '-вайб'];
export const KILL_PHRASES = ['ЗАМОГАН!', 'ОН NPC', 'АУРА ФАРМ', 'ГГ ИЗИ', 'МИНУС АУРА', 'КРИНЖ', 'СЛЭЙ!'];
