// Обёртка над Yandex Games SDK + управление паузой.
// Документация: https://yandex.ru/dev/games/doc/ru/sdk/sdk-about
//
// Локально (localhost / IP в сети) SDK нет: реклама показывается тестовой
// заглушкой, чтобы можно было проверить паузу. На Яндексе заглушки нет.
import * as sound from './sound.js';

let ysdk = null;
let player = null;
let adBusy = false;

// Тестовый режим: локально или на хостинге без Yandex SDK (например, GitHub Pages для друзей).
// Реклама тогда — заглушка. На Яндекс Играх SDK загружается, и заглушки нет.
let testMode = false;
const isTest = () => testMode || isLocal();

export const isLocal = () =>
  /^(localhost|127\.0\.0\.1|\[::1\]|192\.168\.|10\.|172\.)/.test(location.hostname) || location.protocol === 'file:';

// ---------- пауза ----------
// «Жёсткая» пауза (реклама, платформа, свёрнутая вкладка) — стоп игры и звука.
// «Меню» — открыто окно поверх игры: бой замирает, но окно живое.
const HARD = new Set(['ad', 'platform', 'hidden']);
const reasons = new Set();
let menuDepth = 0;
const listeners = new Set();
let gameplayOn = false;

const isHard = () => [...reasons].some((r) => HARD.has(r));
export const isPaused = () => isHard();
export const inMenu = () => menuDepth > 0;

function syncGameplay() {
  const shouldRun = ready.done && reasons.size === 0 && menuDepth === 0;
  if (shouldRun === gameplayOn) return;
  gameplayOn = shouldRun;
  if (shouldRun) ysdk?.features?.GameplayAPI?.start();
  else ysdk?.features?.GameplayAPI?.stop();
}

function setReason(reason, on) {
  const wasHard = isHard();
  if (on) reasons.add(reason); else reasons.delete(reason);
  const hard = isHard();
  if (hard !== wasHard) {
    sound.setPaused(hard);
    listeners.forEach((cb) => cb(hard));
  }
  syncGameplay();
}

// cb(paused: boolean) — вызывается при входе/выходе из жёсткой паузы
export function onPauseChange(cb) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

// Открыто/закрыто окно (колесо, топ, итоги босса…)
export function menu(open) {
  menuDepth = Math.max(0, menuDepth + (open ? 1 : -1));
  syncGameplay();
}

// Требование 1.3: звук и игра останавливаются, когда игра теряет фокус
document.addEventListener('visibilitychange', () => setReason('hidden', document.hidden));
window.addEventListener('blur', () => setReason('hidden', true));
window.addEventListener('focus', () => setReason('hidden', document.hidden));
window.addEventListener('pagehide', () => setReason('hidden', true));

// ---------- инициализация ----------

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = src;
    s.async = true;
    s.onload = resolve;
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

export async function init() {
  if (isLocal()) {
    console.log('[sdk] локальный режим: тестовая реклама, облако выключено');
    return;
  }
  try {
    await loadScript('/sdk.js'); // относительный путь — рекомендованный вариант для архива
    ysdk = await window.YaGames.init();
    // Пауза от платформы: стартовая реклама, окно покупки, смена вкладки и т.д.
    ysdk.on('game_api_pause', () => setReason('platform', true));
    ysdk.on('game_api_resume', () => setReason('platform', false));
    try { player = await ysdk.getPlayer({ scopes: false }); } catch {}
  } catch (e) {
    console.warn('[sdk] Yandex SDK нет — тестовый режим', e);
    testMode = true;
  }
}

// Требование 1.19.2: вызвать, когда всё загружено и можно играть
export function ready() {
  if (ready.done) return;
  ready.done = true;
  ysdk?.features?.LoadingAPI?.ready();
  syncGameplay();
  showBanner();
}
ready.done = false;

// Язык интерфейса Яндекс Игр (требование 2.14). Локально — язык браузера.
export const lang = () => ysdk?.environment?.i18n?.lang || (navigator.language || 'ru').slice(0, 2);

// Компьютер или телефон — чтобы показать подсказки по клавиатуре
export function isDesktop() {
  try { if (ysdk?.deviceInfo) return ysdk.deviceInfo.isDesktop(); } catch {}
  return window.matchMedia('(hover: hover) and (pointer: fine)').matches;
}

// Время сервера Яндекса (защита ежедневного колеса от перевода часов)
export const now = () => {
  try { return ysdk?.serverTime ? ysdk.serverTime() : Date.now(); } catch { return Date.now(); }
};

// ---------- реклама ----------

export const isAdBusy = () => adBusy;

// Тестовая «реклама» только для локальной разработки
function localAd(kind) {
  return new Promise((resolve) => {
    const el = document.createElement('div');
    el.style.cssText = 'position:fixed;inset:0;z-index:9999;background:#000d;color:#fff;display:flex;' +
      'align-items:center;justify-content:center;font:600 22px Rubik,Arial;text-align:center';
    el.textContent = `ТЕСТ: ${kind === 'rewarded' ? 'реклама за награду' : 'полноэкранная реклама'}\n(на Яндекс Играх здесь будет настоящая реклама)`;
    el.style.whiteSpace = 'pre-line';
    document.body.appendChild(el);
    setTimeout(() => { el.remove(); resolve(); }, 1500);
  });
}

// Полноэкранная реклама — только в логических паузах (между уровнями).
// Частоту ограничивает сам Яндекс: если рано — onClose(false), просто идём дальше.
export function showFullscreen() {
  if (adBusy) return Promise.resolve(false);
  adBusy = true;
  setReason('ad', true);
  const done = (shown) => { adBusy = false; setReason('ad', false); return shown; };

  if (!ysdk) {
    if (!isTest()) return Promise.resolve(done(false));
    return localAd('fullscreen').then(() => done(true));
  }
  return new Promise((resolve) => {
    ysdk.adv.showFullscreenAdv({
      callbacks: {
        onClose: (wasShown) => resolve(done(!!wasShown)),
        onError: () => resolve(done(false)),
      },
    });
  });
}

// Реклама за награду.
// Возвращает 'ok' (награду выдаём), 'skipped' (закрыл раньше), 'error' (нет рекламы) или 'busy'.
export function showRewarded() {
  if (adBusy) return Promise.resolve('busy');
  adBusy = true;
  setReason('ad', true);
  const done = (status) => { adBusy = false; setReason('ad', false); return status; };

  if (!ysdk) {
    if (!isTest()) return Promise.resolve(done('error'));
    return localAd('rewarded').then(() => done('ok'));
  }
  return new Promise((resolve) => {
    let rewarded = false;
    ysdk.adv.showRewardedVideo({
      callbacks: {
        onRewarded: () => { rewarded = true; },
        onClose: () => resolve(done(rewarded ? 'ok' : 'skipped')),
        onError: () => resolve(done('error')),
      },
    });
  });
}

// Sticky-баннер включается в Консоли разработчика (вкладка «Реклама»).
// Если там включено «Использовать API для показа sticky-баннера» — показываем сами.
async function showBanner() {
  try {
    const { stickyAdvIsShowing, reason } = await ysdk.adv.getBannerAdvStatus();
    if (!stickyAdvIsShowing && !reason) await ysdk.adv.showBannerAdv();
  } catch {}
}

// ---------- облачные сохранения ----------

export async function cloudLoad() {
  if (!player) return null;
  try { return await player.getData(); } catch { return null; }
}

export function cloudSave(data) {
  player?.setData(data, false).catch(() => {});
}

// ---------- лидерборд ----------
// В Консоли разработчика нужен лидерборд с техническим названием «mogs» (см. PUBLISHING.md).
// Очки — сколько соперников замогал игрок за всё время.
const LB = 'mogs';
let lbSent = 0;
let lbTimer = null;

// Есть ли настоящий лидерборд (только на Яндекс Играх)
export const hasLeaderboard = () => !!ysdk?.leaderboards;

export function isAuthorized() {
  if (!player) return false;
  try { return player.isAuthorized ? player.isAuthorized() : player.getMode() !== 'lite'; } catch { return false; }
}

// Окно входа в аккаунт Яндекса — без входа нельзя попасть в таблицу
export async function login() {
  try {
    await ysdk.auth.openAuthDialog();
    player = await ysdk.getPlayer({ scopes: false });
    return true;
  } catch { return false; }
}

// Отправить результат (не чаще раза в 2 сек — у Яндекса лимит на запросы)
export function submitScore(score) {
  if (!hasLeaderboard() || !isAuthorized() || score <= lbSent || lbTimer) return;
  lbTimer = setTimeout(async () => {
    lbTimer = null;
    try {
      if (!(await ysdk.isAvailableMethod('leaderboards.setScore'))) return;
      await ysdk.leaderboards.setScore(LB, score);
      lbSent = score;
    } catch {}
  }, 2000);
}

// Топ-10 и игрок с соседями: { entries: [{ rank, name, score, me }], myRank }
export async function leaderboardEntries() {
  const res = await ysdk.leaderboards.getEntries(LB, { quantityTop: 10, includeUser: isAuthorized(), quantityAround: 2 });
  const myId = player?.getUniqueID?.();
  return {
    myRank: res.userRank || 0,
    entries: res.entries.map((e) => ({
      rank: e.rank,
      name: e.player.publicName || '',
      score: e.score,
      me: !!myId && e.player.uniqueID === myId,
    })),
  };
}
