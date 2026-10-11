// Переводы. Язык определяется автоматически через Yandex SDK (требование 2.14),
// игрок может сменить его в настройках.
import { state } from './state.js';
import * as sdk from './sdk.js';

export const LANGS = [
  { code: 'ru', name: 'Русский' },
  { code: 'en', name: 'English' },
];

// Языки, для которых показываем русскую версию
const RU_LIKE = ['ru', 'be', 'kk', 'uk', 'uz'];

export function lang() {
  if (state.settings.lang) return state.settings.lang;
  return RU_LIKE.includes(sdk.lang()) ? 'ru' : 'en';
}

const UI = {
  ru: {
    title: 'Могни всех',
    boss_tag: '🔥 БОСС · ',
    level: 'УР. {n}',
    hp: 'САМООЦЕНКА {a} / {b}',
    boss_pop: 'БОСС!',
    crit: 'КРИТ!',
    per_sec: '/с',
    eff_crit: '100% крит',
    eff_storm: 'шторм',
    sec: 'с',
    up_tap: '+{v} к тапу',
    up_dps: '+{v} автомог/с',
    up_crit: 'шанс крита ×{m}: {p}%',
    up_mult: '×{v} ко всему (сейчас ×{c})',
    up_lvl: 'ур. {n}',
    max: 'МАКС',
    boost_active: '×2 МОГ\nещё {s} сек',
    boost_ad: '📺 РЕКЛАМА:\n×2 МОГ 60 СЕК',
    btn_top: 'ТОП',
    btn_wheel: 'КОЛЕСО',
    looksmax: '💎 ЛУКСМАКСИНГ',
    you_stage: 'ТЫ: {s}',
    glowup: 'ГЛОУ АП!\n{s}',
    plus_lvl: '+1 УР.',
    mog_x2: 'МОГ ×2!',
    boss_win: '🔥 БОСС ЗАМОГАН!',
    boss_lose: '💀 НЕ ХВАТИЛО АУРЫ',
    boss_lose_text: 'Босс оказался сильнее.\nПрокачай луксмаксинг и возвращайся!',
    boss_retry_ad: '📺 РЕКЛАМА: +{s} СЕК\nИ ЕЩЁ ПОПЫТКА',
    next: 'ДАЛЕЕ ▶',
    got_it: 'ПОНЯЛ ▶',
    offline_title: 'ПОКА ТЕБЯ НЕ БЫЛО',
    offline_text: 'ты намогал',
    offline_ad: '📺 РЕКЛАМА: ЗАБРАТЬ ×2',
    take: 'ЗАБРАТЬ',
    ad_skipped: 'Досмотри рекламу до конца, чтобы получить награду',
    ad_error: 'Реклама сейчас недоступна, попробуй чуть позже',
    wheel_title: '🎰 КОЛЕСО АУРЫ',
    wheel_free: 'КРУТИТЬ БЕСПЛАТНО',
    wheel_ad: '📺 СПИН ЗА РЕКЛАМУ ({n})',
    wheel_tomorrow: 'ПРИХОДИ ЗАВТРА',
    wheel_spinning: 'КРУТИМ...',
    wheel_hint_daily: 'Бесплатный спин — каждый день',
    wheel_hint_next: 'Новый бесплатный спин через {t}',
    wheel_won: 'ВЫПАЛО!',
    prize_upgrade: '{e} {name} +1 ур.',
    lb_title: '🏆 ТОП ПО АУРЕ',
    lb_you: 'ТЫ 😎',
    lb_ahead: 'Набери ещё ✨ {n},\nчтобы обогнать {name}',
    lb_first: 'Ты №1. Абсолютный мог 🗿',
    settings_title: '⚙️ НАСТРОЙКИ',
    set_lang: 'Язык',
    set_sfx: 'Звуки',
    set_music: 'Музыка',
    set_vibro: 'Вибрация',
    set_shake: 'Тряска и вспышки',
    on: 'ВКЛ',
    off: 'ВЫКЛ',
    reset: 'СБРОСИТЬ ПРОГРЕСС',
    reset_title: '⚠️ ТОЧНО СБРОСИТЬ?',
    reset_text: 'Вся аура, уровни и прокачка\nпропадут навсегда.',
    reset_yes: 'ДА, СБРОСИТЬ',
    cancel: 'ОТМЕНА',
    desktop_hint: 'ПРОБЕЛ — мог  ·  1–8 — прокачка  ·  ESC — закрыть',
    paused: '⏸ ПАУЗА',
    paused_hint: 'нажми, чтобы продолжить',
  },
  en: {
    title: 'Mog Everyone',
    boss_tag: '🔥 BOSS · ',
    level: 'LVL {n}',
    hp: 'SELF-ESTEEM {a} / {b}',
    boss_pop: 'BOSS!',
    crit: 'CRIT!',
    per_sec: '/s',
    eff_crit: '100% crit',
    eff_storm: 'storm',
    sec: 's',
    up_tap: '+{v} per tap',
    up_dps: '+{v} auto-mog/s',
    up_crit: '×{m} crit chance: {p}%',
    up_mult: '×{v} to everything (now ×{c})',
    up_lvl: 'lvl {n}',
    max: 'MAX',
    boost_active: '×2 MOG\n{s} sec left',
    boost_ad: '📺 WATCH AD:\n×2 MOG 60 SEC',
    btn_top: 'TOP',
    btn_wheel: 'WHEEL',
    looksmax: '💎 LOOKSMAXXING',
    you_stage: 'YOU: {s}',
    glowup: 'GLOW UP!\n{s}',
    plus_lvl: '+1 LVL',
    mog_x2: 'MOG ×2!',
    boss_win: '🔥 BOSS MOGGED!',
    boss_lose: '💀 NOT ENOUGH AURA',
    boss_lose_text: 'The boss was too strong.\nLevel up your looksmaxxing and come back!',
    boss_retry_ad: '📺 WATCH AD: +{s} SEC\nAND TRY AGAIN',
    next: 'NEXT ▶',
    got_it: 'GOT IT ▶',
    offline_title: 'WHILE YOU WERE AWAY',
    offline_text: 'you mogged',
    offline_ad: '📺 WATCH AD: CLAIM ×2',
    take: 'CLAIM',
    ad_skipped: 'Watch the ad to the end to get the reward',
    ad_error: 'No ads available right now, try again a bit later',
    wheel_title: '🎰 AURA WHEEL',
    wheel_free: 'SPIN FOR FREE',
    wheel_ad: '📺 AD SPIN ({n})',
    wheel_tomorrow: 'COME BACK TOMORROW',
    wheel_spinning: 'SPINNING...',
    wheel_hint_daily: 'Free spin every day',
    wheel_hint_next: 'Next free spin in {t}',
    wheel_won: 'YOU WON!',
    prize_upgrade: '{e} {name} +1 lvl',
    lb_title: '🏆 AURA LEADERBOARD',
    lb_you: 'YOU 😎',
    lb_ahead: 'Get ✨ {n} more\nto pass {name}',
    lb_first: "You're #1. Absolute mog 🗿",
    settings_title: '⚙️ SETTINGS',
    set_lang: 'Language',
    set_sfx: 'Sound effects',
    set_music: 'Music',
    set_vibro: 'Vibration',
    set_shake: 'Shake & flashes',
    on: 'ON',
    off: 'OFF',
    reset: 'RESET PROGRESS',
    reset_title: '⚠️ RESET FOR REAL?',
    reset_text: 'All aura, levels and upgrades\nwill be gone forever.',
    reset_yes: 'YES, RESET',
    cancel: 'CANCEL',
    desktop_hint: 'SPACE — mog  ·  1–8 — upgrade  ·  ESC — close',
    paused: '⏸ PAUSED',
    paused_hint: 'tap to continue',
  },
};

const NAMES = {
  enemy: {
    normis: ['Нормис Петя', 'Normie Pete'],
    tiktoker: ['Тиктокер', 'TikToker'],
    streamer: ['Стример', 'Streamer'],
    otlichnik: ['Отличник', 'Nerd'],
    kachok: ['Качок из зала', 'Gym Bro'],
    fizruk: ['Физрук', 'PE Teacher'],
    animetyan: ['Аниме-тян', 'Anime Girl'],
    cat: ['Кот-модель', 'Model Cat'],
    bloger: ['Блогер-миллионер', 'Rich Blogger'],
    boss_sigma: ['Сигма-босс', 'Sigma Boss'],
    boss_gigachad: ['Гигачад', 'Gigachad'],
    boss_king: ['Король ауры', 'Aura King'],
  },
  upgrade: {
    mewing: ['Мьюинг', 'Mewing'],
    gym: ['Качалка', 'Gym'],
    jaw: ['Челюсть', 'Jawline'],
    eyes: ['Хантер-айз', 'Hunter Eyes'],
    subs: ['Подписчики', 'Followers'],
    hair: ['Причёска', 'Haircut'],
    photo: ['Фотосессия', 'Photoshoot'],
    outfit: ['Гардероб', 'Drip'],
  },
  stage: [
    ['Нормис', 'Normie'],
    ['Мьюер', 'Mewer'],
    ['Красавчик', 'Pretty Boy'],
    ['Чад', 'Chad'],
    ['Гигачад', 'Gigachad'],
  ],
  wheelLabel: {
    tap3: ['×3\nТАП', '×3\nTAP'],
    aura: ['+\nАУРА', '+\nAURA'],
    dps5: ['×5\nАВТО', '×5\nAUTO'],
    crit: ['100%\nКРИТ', '100%\nCRIT'],
    storm: ['МОГ\nШТОРМ', 'MOG\nSTORM'],
    upgrade: ['+1\nАПГРЕЙД', '+1\nUPGRADE'],
    mega: ['МЕГА\nАУРА', 'MEGA\nAURA'],
    jackpot: ['ДЖЕК\nПОТ', 'JACK\nPOT'],
  },
  wheelText: {
    tap3: ['×3 к тапу на 30 сек', '×3 tap power for 30 sec'],
    dps5: ['×5 автомог на 30 сек', '×5 auto-mog for 30 sec'],
    crit: ['Каждый тап — крит, 30 сек', 'Every tap crits, 30 sec'],
    storm: ['Мог-шторм: автотапы 20 сек', 'Mog storm: auto-taps for 20 sec'],
    jackpot: ['ДЖЕКПОТ: ×10 ко всему, 15 сек', 'JACKPOT: ×10 to everything, 15 sec'],
  },
};

const PHRASES = {
  ru: {
    tap: ['МОГ', 'АУРА', '-самооценка', 'мьюинг', 'РИЗЗ', 'слэй', 'глоу ап', '-вайб'],
    kill: ['ЗАМОГАН!', 'ОН NPC', 'АУРА ФАРМ', 'ГГ ИЗИ', 'МИНУС АУРА', 'КРИНЖ', 'СЛЭЙ!'],
  },
  en: {
    tap: ['MOG', 'AURA', '-self-esteem', 'mewing', 'RIZZ', 'slay', 'glow up', '-vibe'],
    kill: ['MOGGED!', "HE'S AN NPC", 'AURA FARM', 'GG EZ', 'MINUS AURA', 'CRINGE', 'SLAY!'],
  },
};

const BOTS = {
  ru: [
    'сигма_2011', 'Ауроед', 'МьюингБог', 'gigachad777', 'Тимоха_Скуф', 'НеНормис', 'lil_mog',
    'Ксюша_Глоу', 'АураФарм', 'Красавчик9Б', 'jawline_king', 'Дашуля💅', 'мистер_рофл', 'ХантерАйз',
    'вайб_чекер', 'Сеня_Чад', 'ДокторМьюинг', 'кринж_хантер', 'Rizzler_RU', 'Мегамозг', 'аура_минус',
    'Лёха_Рофл', 'NPC_Игорь', 'Мама_Сигмы', 'glow_up_2026', 'ВаняРизз', 'котик_морган', 'Димон_мог',
    'just_mewing', 'ЛуксМакс', 'Полина_Слэй', 'xX_Мог_Xx', 'бро_ну_ты_чё', 'дед_инсайд', 'Арсений_Пик',
    'Слэйер3000', 'Ника_Вайб', 'омега_нормис', 'Чадович', 'ты_замоган',
  ],
  en: [
    'sigma_2011', 'AuraEater', 'MewingGod', 'gigachad777', 'tyler_skuf', 'NotANormie', 'lil_mog',
    'GlowUpGrace', 'AuraFarmer', 'PrettyBoy9B', 'jawline_king', 'slay_queen💅', 'mr_rofl', 'HunterEyez',
    'vibe_checker', 'ChadBrad', 'DrMewing', 'cringe_hunter', 'Rizzler_US', 'BigBrain', 'minus_aura',
    'jake_rofl', 'NPC_Kevin', 'SigmaMom', 'glow_up_2026', 'RizzRyan', 'morgan_the_cat', 'mog_mike',
    'just_mewing', 'LooksMaxx', 'Polly_Slay', 'xX_Mog_Xx', 'bro_what', 'dead_inside', 'peak_arthur',
    'Slayer3000', 'VibeNika', 'omega_normie', 'Chadwick', 'u_got_mogged',
  ],
};

// t('hp', { a: 1, b: 2 })
export function t(key, vars = {}) {
  const s = UI[lang()][key] ?? UI.ru[key] ?? key;
  return s.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '');
}

const idx = () => (lang() === 'ru' ? 0 : 1);

export const enemyName = (id) => NAMES.enemy[id][idx()];
export const upgradeName = (id) => NAMES.upgrade[id][idx()];
export const stageName = (i) => NAMES.stage[i][idx()];
export const wheelLabel = (id) => NAMES.wheelLabel[id][idx()];
export const wheelText = (id) => NAMES.wheelText[id]?.[idx()] ?? '';
export const phrases = () => PHRASES[lang()];
export const botNames = () => BOTS[lang()];
