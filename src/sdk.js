// Обёртка над Yandex Games SDK.
// Локально (localhost / IP в сети) SDK нет — работают заглушки.
import * as sound from './sound.js';

let ysdk = null;
let player = null;

const isLocal = () =>
  /^(localhost|127\.0\.0\.1|\[::1\]|192\.168\.|10\.)/.test(location.hostname) || location.protocol === 'file:';

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = src;
    s.onload = resolve;
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

export async function init() {
  if (isLocal()) {
    console.log('[sdk] локальный режим — реклама и облако заглушены');
    return;
  }
  try {
    await loadScript('/sdk.js');
    ysdk = await window.YaGames.init();
    try { player = await ysdk.getPlayer({ scopes: false }); } catch {}
  } catch (e) {
    console.warn('[sdk] не удалось инициализировать', e);
  }
}

// Обязательно вызвать, когда игра готова к игре (требование модерации)
export function ready() {
  ysdk?.features?.LoadingAPI?.ready();
}

export function gameplayStart() { ysdk?.features?.GameplayAPI?.start(); }
export function gameplayStop() { ysdk?.features?.GameplayAPI?.stop(); }

export function showFullscreen() {
  return new Promise((resolve) => {
    if (!ysdk) return resolve();
    ysdk.adv.showFullscreenAdv({
      callbacks: {
        onOpen: () => sound.setAdMuted(true),
        onClose: () => { sound.setAdMuted(false); resolve(); },
        onError: () => { sound.setAdMuted(false); resolve(); },
      },
    });
  });
}

// true — игрок досмотрел и заслужил награду
export function showRewarded() {
  return new Promise((resolve) => {
    if (!ysdk) {
      console.log('[sdk] заглушка: награда за рекламу выдана');
      return resolve(true);
    }
    let rewarded = false;
    ysdk.adv.showRewardedVideo({
      callbacks: {
        onOpen: () => sound.setAdMuted(true),
        onRewarded: () => { rewarded = true; },
        onClose: () => { sound.setAdMuted(false); resolve(rewarded); },
        onError: () => { sound.setAdMuted(false); resolve(false); },
      },
    });
  });
}

export async function cloudLoad() {
  if (!player) return null;
  try { return await player.getData(); } catch { return null; }
}

export function cloudSave(data) {
  player?.setData(data, false).catch(() => {});
}
