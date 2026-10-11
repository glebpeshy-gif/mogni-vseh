import * as Phaser from 'phaser';
import '@fontsource/unbounded/800.css';
import '@fontsource/rubik/600.css';
import Boot from './scenes/Boot.js';
import Game from './scenes/Game.js';

// Запрет контекстного меню (требование Яндекс Игр)
document.addEventListener('contextmenu', (e) => e.preventDefault());

new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: 720,
  height: 1280,
  backgroundColor: '#140f26',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  input: { activePointers: 3 },
  scene: [Boot, Game],
});
