import * as Phaser from 'phaser';
import { ENEMIES, BOSSES, PLAYER_STAGES } from '../data.js';
import * as sdk from '../sdk.js';
import { load } from '../state.js';

export default class Boot extends Phaser.Scene {
  constructor() { super('Boot'); }

  preload() {
    this.add.text(360, 640, 'Загрузка...', { fontFamily: 'Arial', fontSize: '40px', color: '#fff' }).setOrigin(0.5);

    // Если картинки нет — не страшно, вместо неё будет эмодзи
    this.load.on('loaderror', () => {});
    for (const e of [...ENEMIES, ...BOSSES]) this.load.image(`enemy_${e.id}`, `assets/enemies/${e.id}.png`);
    PLAYER_STAGES.forEach((_, i) => this.load.image(`player_${i + 1}`, `assets/player/stage${i + 1}.png`));
    this.load.image('bg', 'assets/bg.png');
  }

  async create() {
    await sdk.init();
    const offline = await load();
    this.scene.start('Game', { offline });
  }
}
