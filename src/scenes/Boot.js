import * as Phaser from 'phaser';
import * as sdk from '../sdk.js';
import { load } from '../state.js';

const ART = import.meta.glob('../art/**/*.png', { eager: true, query: '?url', import: 'default' });

export default class Boot extends Phaser.Scene {
  constructor() { super('Boot'); }

  preload() {
    this.add.text(360, 640, 'Загрузка...', { fontFamily: 'Arial', fontSize: '40px', color: '#fff' }).setOrigin(0.5);

    // Берём только картинки, которые реально лежат в src/art — недостающих персонажей заменит эмодзи
    for (const [path, url] of Object.entries(ART)) {
      const m = path.match(/art\/(?:(enemies|player)\/)?([\w-]+)\.png$/);
      if (!m) continue;
      const [, dir, name] = m;
      if (dir === 'enemies') this.load.image(`enemy_${name}`, url);
      else if (dir === 'player') this.load.image(`player_${name.replace('stage', '')}`, url);
      else if (name === 'bg') this.load.image('bg', url);
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
