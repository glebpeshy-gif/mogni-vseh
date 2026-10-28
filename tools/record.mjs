// Видео геймплея для Консоли (нужен запущенный npm run dev, Google Chrome и ffmpeg).
// node tools/record.mjs <файл.mp4> [секунд]      размер: W=1920 H=1080 SCALE=1, язык: LANG_UI=ru
// Бот тапает по сопернику и иногда покупает прокачку (клавиши 1–3).
import { spawn, execFileSync } from 'node:child_process';
import { writeFileSync, rmSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

const [out, secs = 30] = process.argv.slice(2);
const W = +(process.env.W || 1920), H = +(process.env.H || 1080), SCALE = +(process.env.SCALE || 1);
const PW = Math.round(W * SCALE / 2) * 2, PH = Math.round(H * SCALE / 2) * 2; // размер видео (чётный)
const LANG = process.env.LANG_UI || 'ru';
const tmp = join(dirname(resolve(out)), '.rec');
rmSync(tmp, { recursive: true, force: true });
mkdirSync(join(tmp, 'f'), { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  ['--headless=new', '--remote-debugging-port=9335', `--user-data-dir=${tmp}/prof`, `--window-size=${W},${H}`, '--hide-scrollbars', 'about:blank'], { stdio: 'ignore' });
for (let i = 0; i < 50; i++) { try { await (await fetch('http://127.0.0.1:9335/json/version')).json(); break; } catch { await sleep(200); } }

const tab = await (await fetch('http://127.0.0.1:9335/json/new?about:blank', { method: 'PUT' })).json();
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener('open', r));
let id = 0;
const pending = new Map();
const frames = [];
let recording = false;
const send = (method, params = {}) => new Promise((r) => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
ws.addEventListener('message', (e) => {
  const m = JSON.parse(e.data);
  if (pending.has(m.id)) { pending.get(m.id)(m.result); pending.delete(m.id); }
  if (m.method === 'Page.screencastFrame') {
    send('Page.screencastFrameAck', { sessionId: m.params.sessionId });
    if (!recording) return;
    const file = join(tmp, 'f', `${String(frames.length).padStart(5, '0')}.jpg`);
    writeFileSync(file, Buffer.from(m.params.data, 'base64'));
    frames.push({ file, t: m.params.metadata.timestamp });
  }
});

await send('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: SCALE, mobile: false });
await send('Page.enable');
await send('Page.navigate', { url: `http://localhost:5173/?shot=mid&lang=${LANG}` });
await sleep(6000);

// координаты игрового поля 720×1280 → экран (Phaser FIT, по центру)
const k = Math.min(W / 720, H / 1280);
const ox = (W - 720 * k) / 2, oy = (H - 1280 * k) / 2;
const at = (x, y) => ({ x: ox + x * k, y: oy + y * k });
const click = async (x, y) => {
  const p = at(x, y);
  await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: p.x, y: p.y, button: 'left', clickCount: 1 });
  await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: p.x, y: p.y, button: 'left', clickCount: 1 });
};
const key = async (k1) => {
  const code = `Digit${k1}`;
  await send('Input.dispatchKeyEvent', { type: 'keyDown', key: k1, code, windowsVirtualKeyCode: 48 + +k1 });
  await send('Input.dispatchKeyEvent', { type: 'keyUp', key: k1, code, windowsVirtualKeyCode: 48 + +k1 });
};

await send('Page.startScreencast', { format: 'jpeg', quality: 90, maxWidth: PW, maxHeight: PH, everyNthFrame: 1 });
recording = true;
const end = Date.now() + secs * 1000;
let n = 0;
while (Date.now() < end) {
  await click(360 + (Math.random() - 0.5) * 120, 540 + (Math.random() - 0.5) * 120);
  if (++n % 30 === 0) await key(String(1 + (n / 30) % 3));
  await sleep(70 + Math.random() * 60);
}
recording = false;
await send('Page.stopScreencast');
ws.close();
chrome.kill();

// склейка кадров с их настоящими длительностями → mp4 30 к/с
const list = frames.map((f, i) => `file '${f.file}'\nduration ${Math.max(0.001, ((frames[i + 1]?.t ?? f.t + 1 / 30) - f.t)).toFixed(4)}`).join('\n');
writeFileSync(join(tmp, 'list.txt'), list + `\nfile '${frames.at(-1).file}'\n`);
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', join(tmp, 'list.txt'),
  '-vf', `fps=30,scale=${PW}:${PH}:flags=lanczos,format=yuv420p`, '-c:v', 'libx264', '-crf', '20', '-movflags', '+faststart', out]);
rmSync(tmp, { recursive: true, force: true });
console.log('✓', out, frames.length, 'кадров');
