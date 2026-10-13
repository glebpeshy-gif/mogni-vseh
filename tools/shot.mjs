// Скриншоты игры для проверки (нужен запущенный npm run dev и Google Chrome).
// node tools/shot.mjs <папка> имя=URL [имя=URL ...]
// Пример: node tools/shot.mjs /tmp/shots main=http://localhost:5173/?shot=main
import { spawn } from 'node:child_process';
import { writeFileSync, rmSync, mkdirSync } from 'node:fs';

const [outDir, ...jobs] = process.argv.slice(2);
mkdirSync(outDir, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const prof = `${outDir}/.chrome-prof`;
rmSync(prof, { recursive: true, force: true });
const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  ['--headless=new', '--remote-debugging-port=9334', `--user-data-dir=${prof}`, '--window-size=405,720', '--hide-scrollbars', 'about:blank'], { stdio: 'ignore' });
for (let i = 0; i < 50; i++) { try { await (await fetch('http://127.0.0.1:9334/json/version')).json(); break; } catch { await sleep(200); } }

for (const job of jobs) {
  const k = job.indexOf('=');
  const name = job.slice(0, k);
  const url = job.slice(k + 1);
  const tab = await (await fetch('http://127.0.0.1:9334/json/new?about:blank', { method: 'PUT' })).json();
  const ws = new WebSocket(tab.webSocketDebuggerUrl);
  await new Promise((r) => ws.addEventListener('open', r));
  let id = 0;
  const pending = new Map();
  ws.addEventListener('message', (e) => {
    const m = JSON.parse(e.data);
    if (m.method === 'Runtime.exceptionThrown') console.log('EXC', name, JSON.stringify(m.params.exceptionDetails).slice(0, 500));
    if (pending.has(m.id)) { pending.get(m.id)(m.result); pending.delete(m.id); }
  });
  const send = (method, params = {}) => new Promise((r) => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
  await send('Emulation.setDeviceMetricsOverride', { width: 405, height: 720, deviceScaleFactor: 1, mobile: false });
  await send('Runtime.enable');
  await send('Page.navigate', { url });
  await sleep(7000);
  const shot = await send('Page.captureScreenshot', { format: 'png' });
  writeFileSync(`${outDir}/shot-${name}.png`, Buffer.from(shot.data, 'base64'));
  ws.close();
  console.log('✓', name);
}
chrome.kill();
