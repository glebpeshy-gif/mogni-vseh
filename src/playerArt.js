// Персонаж игрока собирается на лету: стадия + настроение + шмот → SVG → текстура Phaser
import { playerSVG } from './art/builder.js';

export const MOODS = ['idle', 'mog', 'win', 'sad'];

const lookKey = (stage, eq) => `pl_${stage}_${['hat', 'glasses', 'top', 'hand', 'effect'].map((s) => eq[s] || '-').join('_')}`;

// Возвращает ключ текстуры (создаёт, если её ещё нет)
export function playerTexture(scene, { stage, eq = {}, mood = 'idle', size = 360 }) {
  const key = `${lookKey(stage, eq)}_${mood}_${size}`;
  if (scene.textures.exists(key)) return Promise.resolve(key);
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      if (!scene.textures.exists(key)) scene.textures.addImage(key, img);
      resolve(key);
    };
    img.onerror = () => resolve(null);
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(playerSVG({ stage, mood, eq, size }));
  });
}

// Все 4 настроения сразу — чтобы при смене настроения не было задержки
export async function playerTextures(scene, look) {
  const keys = await Promise.all(MOODS.map((mood) => playerTexture(scene, { ...look, mood })));
  return Object.fromEntries(MOODS.map((m, i) => [m, keys[i]]));
}
