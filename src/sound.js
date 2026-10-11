// Простые синтезированные звуки (без файлов). Позже можно заменить на .ogg/.mp3.
let ctx = null;
let master = null;
let userMuted = false;
let adMuted = false;
let hidden = false;

function ensure() {
  if (!ctx) {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    master = ctx.createGain();
    master.connect(ctx.destination);
    apply();
  }
  if (ctx.state === 'suspended' && !adMuted && !hidden) ctx.resume();
  return ctx;
}

function apply() {
  if (!master) return;
  master.gain.value = userMuted || adMuted || hidden ? 0 : 0.35;
}

export function setMuted(v) { userMuted = v; apply(); }
export function setAdMuted(v) { adMuted = v; apply(); }

// Звук выключается, когда вкладка скрыта (требование Яндекс Игр)
document.addEventListener('visibilitychange', () => {
  hidden = document.hidden;
  apply();
});

function tone(freq, dur, type = 'square', vol = 0.3, slideTo = null, delay = 0) {
  const c = ensure();
  const t = c.currentTime + delay;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  o.connect(g).connect(master);
  o.start(t);
  o.stop(t + dur);
}

export const tap = () => tone(320 + Math.random() * 120, 0.08, 'square', 0.15, 180);
export const crit = () => { tone(900, 0.12, 'sawtooth', 0.2, 300); tone(1200, 0.1, 'square', 0.1, null, 0.04); };
export const kill = () => [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.18, 'triangle', 0.25, null, i * 0.07));
export const buy = () => { tone(660, 0.07, 'triangle', 0.25); tone(990, 0.1, 'triangle', 0.25, null, 0.06); };
export const fail = () => tone(300, 0.4, 'sawtooth', 0.25, 80);
export const deny = () => tone(140, 0.12, 'square', 0.15);
