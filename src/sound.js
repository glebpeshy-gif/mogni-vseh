// Синтезированные звуки и фоновая музыка (без файлов).
// Позже можно заменить на .ogg/.mp3.
let ctx = null;
let master = null;   // общий выход: глушится на паузе
let sfxBus = null;
let musicBus = null;
let sfxOn = true;
let musicOn = true;
let paused = false;  // реклама / свёрнутая вкладка / пауза платформы

const SFX_VOL = 0.35;
const MUSIC_VOL = 0.11;

function ensure() {
  if (!ctx) {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    master = ctx.createGain();
    sfxBus = ctx.createGain();
    musicBus = ctx.createGain();
    sfxBus.connect(master);
    musicBus.connect(master);
    master.connect(ctx.destination);
    apply();
    startMusic();
  }
  if (ctx.state === 'suspended' && !paused) ctx.resume();
  return ctx;
}

function apply() {
  if (!ctx) return;
  master.gain.value = paused ? 0 : 1;
  sfxBus.gain.value = sfxOn ? SFX_VOL : 0;
  musicBus.gain.value = musicOn ? MUSIC_VOL : 0;
}

export function setSfx(v) { sfxOn = v; apply(); }
export function setMusic(v) { musicOn = v; apply(); }

// Звук можно запустить только после действия игрока (правило браузеров)
export function unlock() { if (!paused) ensure(); }

// Вызывается из sdk.js: на паузе звук полностью останавливается
export function setPaused(v) {
  paused = v;
  apply();
  if (!ctx) return;
  if (v) ctx.suspend(); else ctx.resume();
}

function tone(freq, dur, type = 'square', vol = 0.3, slideTo = null, delay = 0, bus = null, at = null) {
  if (paused) return;
  const c = ensure();
  const t = at ?? c.currentTime + delay;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  o.connect(g).connect(bus || sfxBus);
  o.start(t);
  o.stop(t + dur);
}

export const tap = () => tone(320 + Math.random() * 120, 0.08, 'square', 0.15, 180);
export const crit = () => { tone(900, 0.12, 'sawtooth', 0.2, 300); tone(1200, 0.1, 'square', 0.1, null, 0.04); };
export const kill = () => [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.18, 'triangle', 0.25, null, i * 0.07));
export const buy = () => { tone(660, 0.07, 'triangle', 0.25); tone(990, 0.1, 'triangle', 0.25, null, 0.06); };
export const fail = () => tone(300, 0.4, 'sawtooth', 0.25, 80);
export const deny = () => tone(140, 0.12, 'square', 0.15);
export const tick = () => tone(1400 + Math.random() * 200, 0.03, 'square', 0.08);
export const prize = () => [523, 659, 784, 1046, 1318].forEach((f, i) => tone(f, 0.22, 'triangle', 0.25, null, i * 0.08));
export const click = () => tone(800, 0.04, 'triangle', 0.15);

// ---------- фоновая музыка: короткий чиптюн-луп ----------
const BPM = 124;
const STEP = 60 / BPM / 2; // восьмые
const midi = (n) => 440 * Math.pow(2, (n - 69) / 12);
// Am – F – C – G
const CHORDS = [[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]];
const BASS = [45, 41, 36, 43];
const ARP = [0, 1, 2, 1, 2, 0, 1, 2];

let step = 0;
let nextTime = 0;

function startMusic() {
  nextTime = ctx.currentTime + 0.1;
  setInterval(() => {
    if (!ctx || ctx.state !== 'running' || paused) return;
    // если вкладка была скрыта — не догоняем пропущенные ноты
    if (nextTime < ctx.currentTime) nextTime = ctx.currentTime + 0.05;
    while (nextTime < ctx.currentTime + 0.25) {
      const bar = Math.floor(step / 8) % 4;
      const s = step % 8;
      const chord = CHORDS[bar];
      if (s % 2 === 0) tone(midi(BASS[bar]), STEP * 1.8, 'triangle', 0.5, null, 0, musicBus, nextTime);
      tone(midi(chord[ARP[s]] + 12), STEP * 0.9, 'square', 0.12, null, 0, musicBus, nextTime);
      if (s === 4) tone(midi(chord[2] + 24), STEP * 2, 'triangle', 0.08, null, 0, musicBus, nextTime);
      nextTime += STEP;
      step++;
    }
  }, 50);
}
