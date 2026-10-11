import * as Phaser from 'phaser';
import { UPGRADES, BALANCE, TAP_PHRASES, KILL_PHRASES } from '../data.js';
import {
  state, stats, cost, lvl, isMaxed, buy, enemyFor, enemyHp, enemyReward,
  isBoss, playerStage, addAura, save, format,
} from '../state.js';
import * as sdk from '../sdk.js';
import * as sound from '../sound.js';

const FONT = '"Arial Black", "Trebuchet MS", Arial, sans-serif';
const EMOJI_FONT = '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif';
const C = {
  panel: 0x221a3d, row: 0x2d2350, gold: 0xffd23f, pink: 0xff4fa3,
  green: 0x2fbf71, gray: 0x4a4166, purple: 0x7b5cff,
};

function txt(scene, x, y, str, size, color = '#ffffff', extra = {}) {
  return scene.add.text(x, y, str, {
    fontFamily: FONT, fontSize: `${size}px`, color, align: 'center',
    stroke: '#140f26', strokeThickness: Math.max(3, Math.round(size / 7)),
    ...extra,
  });
}

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

export default class Game extends Phaser.Scene {
  constructor() { super('Game'); }

  init(data) { this.offline = data.offline || 0; }

  create() {
    if (this.textures.exists('bg')) this.add.image(360, 640, 'bg').setDisplaySize(720, 1280);
    this.add.rectangle(360, 1005, 720, 550, C.panel);

    this.createHud();
    this.createArena();
    this.createUpgrades();
    this.spawnEnemy();

    this.time.addEvent({ delay: 100, loop: true, callback: () => this.tick(0.1) });
    this.time.addEvent({ delay: 200, loop: true, callback: () => this.refresh() });
    this.time.addEvent({ delay: 10000, loop: true, callback: () => save() });
    this.refresh();

    sound.setMuted(state.muted);
    sdk.ready();
    sdk.gameplayStart();
    if (this.offline > 0) this.showOffline(this.offline);
  }

  // ---------- интерфейс ----------

  createHud() {
    this.auraText = txt(this, 360, 48, '', 54, '#ffd23f').setOrigin(0.5);
    this.statsText = txt(this, 360, 100, '', 21, '#cfc6ff').setOrigin(0.5);

    const mute = txt(this, 670, 48, '', 40).setOrigin(0.5).setInteractive({ useHandCursor: true });
    const upd = () => mute.setText(state.muted ? '🔇' : '🔊');
    upd();
    mute.on('pointerdown', () => {
      state.muted = !state.muted;
      sound.setMuted(state.muted);
      upd();
      save();
    });
  }

  createArena() {
    this.levelText = txt(this, 360, 150, '', 30).setOrigin(0.5);
    this.add.rectangle(360, 198, 560, 34, 0x000000, 0.5).setStrokeStyle(3, 0xffffff, 0.8);
    this.hpBar = this.add.rectangle(83, 198, 554, 28, C.pink).setOrigin(0, 0.5);
    this.hpText = txt(this, 360, 198, '', 19).setOrigin(0.5);
    this.timerText = txt(this, 360, 242, '', 28, '#ff6b6b').setOrigin(0.5);

    // Вся верхняя часть экрана — зона тапа
    this.zone = this.add.zone(360, 440, 720, 560).setInteractive();
    this.zone.on('pointerdown', (p) => this.onTap(p));

    this.enemyHolder = this.add.container(360, 440);

    this.playerHolder = this.add.container(100, 620);
    this.playerName = txt(this, 100, 690, '', 20, '#cfc6ff').setOrigin(0.5);
    this.playerStageIndex = -1;

    this.boostBtn = this.makeButton(590, 640, 220, 76, '📺 ×2 МОГ\nна 60 сек', 22, C.purple, () => this.watchBoost());
  }

  createUpgrades() {
    txt(this, 360, 758, '💎 ЛУКСМАКСИНГ 💎', 30, '#ffd23f').setOrigin(0.5);
    this.rows = UPGRADES.map((u, i) => {
      const y = 818 + i * 58;
      this.add.rectangle(360, y, 696, 52, C.row);
      this.add.text(40, y, u.emoji, { fontFamily: EMOJI_FONT, fontSize: '30px', padding: { y: 6 } }).setOrigin(0.5);
      txt(this, 72, y - 11, u.name, 21).setOrigin(0, 0.5);
      const info = this.add.text(72, y + 13, '', { fontFamily: 'Arial', fontSize: '16px', color: '#b9b0e0' }).setOrigin(0, 0.5);
      const btn = this.makeButton(612, y, 160, 44, '', 21, C.green, () => this.onBuy(u, btn));
      return { u, info, btn };
    });
  }

  makeButton(x, y, w, h, label, size, color, onClick) {
    const rect = this.add.rectangle(x, y, w, h, color).setStrokeStyle(3, 0x000000, 0.35)
      .setInteractive({ useHandCursor: true });
    const text = txt(this, x, y, label, size).setOrigin(0.5);
    const btn = {
      rect, text, color, enabled: true,
      setEnabled(v) { this.enabled = v; rect.setFillStyle(v ? color : C.gray); },
    };
    rect.on('pointerdown', () => {
      this.tweens.add({ targets: [rect, text], scale: 0.92, duration: 60, yoyo: true });
      onClick();
    });
    return btn;
  }

  makeArt(key, emoji, size) {
    if (this.textures.exists(key)) {
      const img = this.add.image(0, 0, key);
      img.baseScale = size / Math.max(img.width, img.height);
      return img.setScale(img.baseScale);
    }
    const t = this.add.text(0, 0, emoji, {
      fontFamily: EMOJI_FONT, fontSize: `${Math.round(size * 0.8)}px`, padding: { x: 10, y: 20 },
    }).setOrigin(0.5);
    t.baseScale = 1;
    return t;
  }

  float(x, y, str, size, color = '#ffffff', rise = 90) {
    const t = txt(this, x, y, str, size, color).setOrigin(0.5).setDepth(50);
    this.tweens.add({
      targets: t, y: y - rise, alpha: 0, duration: 750, ease: 'Cubic.easeOut',
      onComplete: () => t.destroy(),
    });
  }

  // ---------- игровой цикл ----------

  spawnEnemy() {
    const boss = isBoss(state.level);
    const e = enemyFor(state.level);
    this.maxHp = enemyHp(state.level);
    this.hp = this.maxHp;
    this.dying = false;
    this.bossLeft = boss ? BALANCE.bossTime : 0;

    this.enemyHolder.removeAll(true);
    this.enemyHolder.setAlpha(1).setAngle(0).setScale(0);
    this.enemyArt = this.makeArt(`enemy_${e.id}`, e.emoji, boss ? 360 : 290);
    this.enemyHolder.add(this.enemyArt);
    this.tweens.add({ targets: this.enemyHolder, scale: 1, duration: 300, ease: 'Back.easeOut' });

    this.levelText.setText(`${boss ? '🔥 БОСС · ' : ''}Ур. ${state.level + 1} · ${e.name}`);
    this.levelText.setColor(boss ? '#ff6b6b' : '#ffffff');
    this.timerText.setText('');
    this.updateHp();
  }

  onTap(p) {
    if (this.dying) return;
    const s = stats();
    const crit = Math.random() < s.crit;
    const dmg = s.tap * (crit ? BALANCE.critMult : 1);

    if (crit) {
      sound.crit();
      this.float(p.x, p.y - 30, `КРИТ-МОГ!\n-${format(dmg)}`, 40, '#ffd23f', 120);
      this.cameras.main.shake(80, 0.006);
    } else {
      sound.tap();
      this.float(p.x, p.y - 20, `-${format(dmg)}`, 34);
      if (Math.random() < 0.12) this.float(p.x + Phaser.Math.Between(-80, 80), p.y - 60, pick(TAP_PHRASES), 24, '#ff9bd2');
    }

    const art = this.enemyArt;
    this.tweens.killTweensOf(art);
    art.setScale(art.baseScale).setAngle(0);
    this.tweens.add({
      targets: art, scaleX: art.baseScale * 1.12, scaleY: art.baseScale * 0.88,
      angle: Phaser.Math.Between(-6, 6), duration: 50, yoyo: true,
    });

    this.damage(dmg);
  }

  tick(dt) {
    if (this.dying) return;
    const s = stats();
    if (s.dps > 0) this.damage(s.dps * dt);

    if (this.bossLeft > 0) {
      this.bossLeft -= dt;
      this.timerText.setText(`⏱ ${Math.max(0, this.bossLeft).toFixed(1)} сек`);
      if (this.bossLeft <= 0 && !this.dying) this.bossFailed();
    }
  }

  damage(n) {
    if (this.dying) return;
    this.hp -= n;
    if (this.hp <= 0) this.defeat();
    this.updateHp();
  }

  updateHp() {
    const k = Math.max(0, this.hp) / this.maxHp;
    this.hpBar.width = 554 * k;
    this.hpText.setText(`Самооценка ${format(Math.max(0, Math.ceil(this.hp)))} / ${format(this.maxHp)}`);
  }

  defeat() {
    this.dying = true;
    const wasBoss = isBoss(state.level);
    const reward = enemyReward(state.level);
    addAura(reward);
    state.kills++;
    state.level++;

    sound.kill();
    this.float(360, 330, pick(KILL_PHRASES), wasBoss ? 64 : 52, '#ff4fa3', 140);
    this.float(360, 430, `+${format(reward)} ✨`, 40, '#ffd23f', 120);
    this.timerText.setText('');

    this.tweens.add({
      targets: this.enemyHolder, scaleX: 1.4, scaleY: 0.15, alpha: 0, angle: 15,
      duration: 380, ease: 'Back.easeIn',
      onComplete: async () => {
        if (wasBoss) {
          save();
          sdk.gameplayStop();
          await sdk.showFullscreen();
          sdk.gameplayStart();
        }
        this.spawnEnemy();
      },
    });
    this.refresh();
  }

  bossFailed() {
    this.dying = true;
    sound.fail();
    this.float(360, 380, 'НЕ ХВАТИЛО АУРЫ!\nкачайся и возвращайся', 36, '#ff6b6b', 60);
    state.level = Math.max(0, state.level - 1);
    this.tweens.add({
      targets: this.enemyHolder, alpha: 0, duration: 600, delay: 600,
      onComplete: () => this.spawnEnemy(),
    });
  }

  onBuy(u, btn) {
    if (buy(u)) {
      sound.buy();
      this.float(btn.rect.x, btn.rect.y - 20, `+1 ур.`, 22, '#7dffb0', 50);
      this.refresh();
      save();
    } else {
      sound.deny();
      this.tweens.add({ targets: btn.rect, x: btn.rect.x + 6, duration: 40, yoyo: true, repeat: 2 });
    }
  }

  async watchBoost() {
    if (Date.now() < state.boostUntil) return;
    sdk.gameplayStop();
    const ok = await sdk.showRewarded();
    sdk.gameplayStart();
    if (ok) {
      state.boostUntil = Date.now() + BALANCE.adBoostSec * 1000;
      sound.buy();
      this.float(360, 500, 'МОГ ×2!', 56, '#7b5cff', 120);
      this.refresh();
    }
  }

  refresh() {
    const s = stats();
    this.auraText.setText(`✨ ${format(state.aura)}`);
    this.statsText.setText(
      `мог за тап: ${format(s.tap)}   автомог: ${format(s.dps)}/с` +
      (s.crit ? `   крит: ${Math.round(s.crit * 100)}%` : '') +
      (s.boost > 1 ? '   ×2!' : ''),
    );

    for (const { u, info, btn } of this.rows) {
      const l = lvl(u.id);
      const maxed = isMaxed(u);
      const c = cost(u);
      btn.text.setText(maxed ? 'МАКС' : `✨ ${format(c)}`);
      btn.setEnabled(!maxed && state.aura >= c);
      info.setText(`Ур. ${l} · ${this.describe(u, l)}`);
    }

    const left = Math.ceil((state.boostUntil - Date.now()) / 1000);
    if (left > 0) {
      this.boostBtn.text.setText(`×2 МОГ\nещё ${left} сек`);
      this.boostBtn.setEnabled(false);
    } else if (!this.boostBtn.enabled) {
      this.boostBtn.text.setText('📺 ×2 МОГ\nна 60 сек');
      this.boostBtn.setEnabled(true);
    }

    this.updatePlayer();
  }

  describe(u, l) {
    switch (u.type) {
      case 'tap': return `+${u.value} к тапу`;
      case 'dps': return `+${u.value} автомог/с`;
      case 'crit': return `шанс крит-мога ×${BALANCE.critMult}: ${Math.round(u.value * l * 100)}%`;
      case 'mult': return `×${u.value} ко всему (сейчас ×${Math.pow(u.value, l).toFixed(2)})`;
      default: return '';
    }
  }

  updatePlayer() {
    const st = playerStage();
    if (st.index === this.playerStageIndex) return;
    const upgraded = this.playerStageIndex >= 0;
    this.playerStageIndex = st.index;

    this.playerHolder.removeAll(true);
    this.playerHolder.add(this.makeArt(`player_${st.index + 1}`, st.emoji, 120));
    this.playerName.setText(`Ты: ${st.name}`);

    if (upgraded) {
      this.playerHolder.setScale(0);
      this.tweens.add({ targets: this.playerHolder, scale: 1, duration: 500, ease: 'Elastic.easeOut' });
      this.float(360, 560, `НОВЫЙ УРОВЕНЬ ВНЕШНОСТИ:\n${st.name.toUpperCase()}!`, 34, '#7dffb0', 120);
      sound.kill();
    }
  }

  showOffline(amount) {
    const box = this.add.container(0, 0).setDepth(100);
    const close = (mult) => {
      addAura(amount * mult);
      this.float(360, 500, `+${format(amount * mult)} ✨`, 48, '#ffd23f', 120);
      box.destroy();
      this.refresh();
      save();
    };

    const shade = this.add.rectangle(360, 640, 720, 1280, 0x000000, 0.75).setInteractive();
    const panel = this.add.rectangle(360, 620, 600, 420, C.panel).setStrokeStyle(4, C.gold);
    const title = txt(this, 360, 490, 'Пока тебя не было,\nты намогал', 34).setOrigin(0.5);
    const sum = txt(this, 360, 590, `✨ ${format(amount)}`, 60, '#ffd23f').setOrigin(0.5);
    const take = this.makeButton(230, 720, 220, 80, 'Забрать', 28, C.green, () => close(1));
    const double = this.makeButton(490, 720, 240, 80, '📺 Забрать ×2', 26, C.purple, async () => {
      sdk.gameplayStop();
      const ok = await sdk.showRewarded();
      sdk.gameplayStart();
      close(ok ? 2 : 1);
    });
    box.add([shade, panel, title, sum, take.rect, take.text, double.rect, double.text]);
  }
}
