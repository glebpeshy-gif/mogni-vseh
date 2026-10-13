// Генерирует SVG соперников и превью стадий игрока в src/art/.
// Запуск: npm run art      (сам рисовальщик — src/art/builder.js)
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildEnemies, playerSVG, PLAYER_STAGE_LOOKS } from '../src/art/builder.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = { ...buildEnemies() };
PLAYER_STAGE_LOOKS.forEach((_, i) => { out[`player/stage${i + 1}`] = playerSVG({ stage: i }); });

for (const [name, content] of Object.entries(out)) {
  const file = join(ROOT, 'src/art', `${name}.svg`);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, content);
  console.log('✓', name);
}
