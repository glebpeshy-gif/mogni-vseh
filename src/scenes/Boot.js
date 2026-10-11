import * as Phaser from 'phaser';
import * as sdk from '../sdk.js';
import { load } from '../state.js';

const ART = import.meta.glob('../art/**/*.{png,svg}', { eager: true, query: '?url', import: 'default' });

export default class Boot extends Phaser.Scene {
  constructor() { super('Boot'); }

  preload() {
    this.add.text(360, 640, '⏳', { fontFamily: 'Arial', fontSize: '40px', color: '#fff' }).setOrigin(0.5);

    // Берём только картинки, которые реально лежат в src/art — недостающих персонажей заменит эмодзи.
    // Если есть и PNG, и SVG — побеждает PNG (нарисованный вручную важнее сгенерированного).
    const keys = {};
    for (const [path, url] of Object.entries(ART)) {
      const m = path.match(/art\/(?:(enemies|player|bg)\/)?([\w-]+)\.(png|svg)$/);
      if (!m) continue;
      const [, dir, name, ext] = m;
      const key = dir === 'enemies' ? `enemy_${name}`
        : dir === 'player' ? `player_${name.replace('stage', '')}`
          : dir === 'bg' ? `bgimg_${name}`
            : name === 'bg' ? 'bg' : null;
      if (!key || (keys[key]?.ext === 'png')) continue;
      keys[key] = { url, ext };
    }
    for (const [key, { url, ext }] of Object.entries(keys)) {
      if (ext === 'svg') this.load.svg(key, url, { width: 640, height: 640 }); // с запасом для чётких экранов
      else this.load.image(key, url);
    }
  }

  async create() {
    // шрифты должны загрузиться до первого текста, иначе Phaser нарисует запасной
    await Promise.all([
      document.fonts.load('800 32px "Unbounded"', 'АБВ abc'),
      document.fonts.load('600 32px "Rubik"', 'АБВ abc'),
    ]).catch(() => {});
    await sdk.init();
    const offline = await load();
    this.scene.start('Game', { offline });
  }
}
