import * as Phaser from 'phaser';
import { UPGRADES, BALANCE, TAP_PHRASES, KILL_PHRASES, EFFECT_ICONS } from '../data.js';
import {
  state, stats, cost, lvl, isMaxed, buy, enemyFor, enemyHp, enemyReward,
  isBoss, playerStage, addAura, save, format, activeEffects, addEffect, hasEffect, wheelStatus,
} from '../state.js';
import { COLORS, HEX, txt, body, emoji, button, drawCard, pop, makeTextures } from '../theme.js';
import { openWheel } from '../features/wheel.js';
import { openLeaderboard } from '../features/leaderboard.js';
import * as sdk from '../sdk.js';
import * as sound from '../sound.js';

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const STICKERS = ['💀', '🔥', '✨', '💅', '🗿', '💯', '😎', '👑', '⚡', '🤙'];
const CONFETTI = [COLORS.pink, COLORS.lime, COLORS.cyan, COLORS.yellow, COLORS.purple];
const ENEMY_Y = 470;

export default class Game extends Phaser.Scene {
  constructor() { super('Game'); }

  init(data) { this.offline = data.offline || 0; }

  create() {
    makeTextures(this);
    this.createBackground();
    this.createHud();
    this.createArena();
    this.createUpgrades();
    this.spawnEnemy();

    this.autoAcc = 0;
    this.time.addEvent({ delay: 100, loop: true, callback: () => this.tick(0.1) });
    this.time.addEvent({ delay: 200, loop: true, callback: () => this.refresh() });
    this.time.addEvent({ delay: 10000, loop: true, callback: () => save() });
    this.refresh();

    sound.setMuted(state.muted);
    sdk.ready();
    sdk.gameplayStart();
    if (this.offline > 0) this.showOffline(this.offline);
  }

  // ---------- фон ----------

  createBackground() {
    this.add.image(360, 640, this.textures.exists('bg') ? 'bg' : 'bg_gradient').setDisplaySize(720, 1280);

    // плавающие стикеры-эмодзи
    for (let i = 0; i < 14; i++) {
      const s = emoji(this, Phaser.Math.Between(20, 700), Phaser.Math.Between(140, 720), pick(STICKERS), Phaser.Math.Between(34, 60))
        .setAlpha(0.13).setAngle(Phaser.Math.Between(-25, 25));
      this.tweens.add({
        targets: s, y: s.y - Phaser.Math.Between(20, 50), angle: s.angle + Phaser.Math.Between(-15, 15),
        duration: Phaser.Math.Between(2500, 4500), yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
      });
    }

    // вращающиеся лучи за соперником
    this.rays = this.add.graphics({ x: 360, y: ENEMY_Y });
    for (let i = 0; i < 16; i++) {
      const a0 = (i / 16) * Math.PI * 2;
      const a1 = a0 + Math.PI / 16;
      this.rays.fillStyle(i % 2 ? COLORS.pink : COLORS.purple, 0.16);
      this.rays.fillTriangle(0, 0, Math.cos(a0) * 520, Math.sin(a0) * 520, Math.cos(a1) * 520, Math.sin(a1) * 520);
    }
    this.tweens.add({ targets: this.rays, angle: 360, duration: 24000, repeat: -1 });

    this.confetti = this.add.particles(0, 0, 'star', {
      speed: { min: 250, max: 700 }, angle: { min: 200, max: 340 }, gravityY: 900,
      lifespan: 1200, scale: { start: 0.9, end: 0.2 }, rotate: { min: 0, max: 360 },
      tint: CONFETTI, emitting: false,
    }).setDepth(140);
    this.sparks = this.add.particles(0, 0, 'dot', {
      speed: { min: 120, max: 320 }, lifespan: 380, scale: { start: 0.55, end: 0 },
      tint: [COLORS.yellow, 0xffffff, COLORS.pink], emitting: false,
    }).setDepth(120);
  }

  // ---------- верхняя панель ----------

  createHud() {
    this.auraText = txt(this, 360, 52, '', 56, HEX.yellow).setOrigin(0.5);
    this.statsText = body(this, 360, 102, '', 20, HEX.soft).setOrigin(0.5);

    const mute = emoji(this, 680, 44, '', 34).setInteractive({ useHandCursor: true });
    const upd = () => mute.setText(state.muted ? '🔇' : '🔊');
    upd();
    mute.on('pointerdown', () => {
      state.muted = !state.muted;
      sound.setMuted(state.muted);
      upd();
      save();
    });
  }

  roundButton(x, y, icon, label, color, onClick) {
    const c = this.add.container(x, y).setDepth(20);
    const g = this.add.graphics();
    g.fillStyle(COLORS.ink, 0.9).fillCircle(0, 5, 46);
    g.fillStyle(color, 1).fillCircle(0, 0, 46);
    g.fillStyle(0xffffff, 0.22).fillEllipse(0, -20, 60, 26);
    const ic = emoji(this, 0, -4, icon, 42);
    const lb = txt(this, 0, 54, label, 16).setOrigin(0.5);
    const hit = this.add.zone(0, 8, 100, 120).setInteractive({ useHandCursor: true });
    c.add([g, ic, lb, hit]);
    hit.on('pointerdown', () => {
      this.tweens.add({ targets: c, scale: 0.88, duration: 70, yoyo: true });
      onClick();
    });
    return c;
  }

  createArena() {
    this.levelText = txt(this, 360, 152, '', 28).setOrigin(0.5);

    this.hpG = this.add.graphics({ x: 360, y: 198 });
    drawCard(this.hpG, 560, 36, COLORS.ink, { radius: 18, depth: 4, stroke: 0xffffff });
    this.hpBar = this.add.graphics({ x: 84, y: 198 });
    this.hpText = body(this, 360, 198, '', 18, HEX.white, { stroke: HEX.ink, strokeThickness: 4 }).setOrigin(0.5);

    this.effectsText = body(this, 360, 240, '', 21, HEX.cyan, { stroke: HEX.ink, strokeThickness: 4, align: 'center' }).setOrigin(0.5);
    this.timerText = txt(this, 360, 280, '', 30, '#ff5a7a').setOrigin(0.5);

    // вся верхняя часть экрана — зона тапа
    this.zone = this.add.zone(360, 450, 720, 560).setInteractive();
    this.zone.on('pointerdown', (p) => this.onTap(p));

    this.enemyHolder = this.add.container(360, ENEMY_Y);
    this.enemyBob = this.add.container(0, 0);
    this.enemyHolder.add(this.enemyBob);
    this.tweens.add({ targets: this.enemyBob, y: -10, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    // боковые кнопки
    this.roundButton(64, 330, '🏆', 'ТОП', COLORS.cyan, () => openLeaderboard(this));
    this.wheelBtn = this.roundButton(656, 330, '🎰', 'КОЛЕСО', COLORS.pink, () => {
      openWheel(this, { onPrize: (p, text) => this.onWheelPrize(p, text), onClose: () => this.refresh() });
    });
    this.wheelBadge = txt(this, 34, -36, '!', 22).setOrigin(0.5);
    const badgeBg = this.add.circle(34, -36, 16, 0xff3355).setStrokeStyle(3, COLORS.ink);
    this.wheelBtn.add([badgeBg, this.wheelBadge]);
    this.wheelBadgeBg = badgeBg;
    this.tweens.add({ targets: [badgeBg, this.wheelBadge], scale: 1.25, duration: 450, yoyo: true, repeat: -1 });

    // игрок
    this.playerFrame = this.add.graphics({ x: 92, y: 620 });
    this.playerFrame.fillStyle(COLORS.ink, 0.9).fillCircle(0, 5, 66);
    this.playerFrame.fillStyle(COLORS.cardLight, 1).fillCircle(0, 0, 66);
    this.playerFrame.lineStyle(5, COLORS.lime, 1).strokeCircle(0, 0, 66);
    this.playerHolder = this.add.container(92, 616);
    this.playerName = txt(this, 92, 700, '', 18, HEX.lime).setOrigin(0.5);
    this.playerStageIndex = -1;

    this.boostBtn = button(this, 588, 640, 230, 84, '', COLORS.purple, () => this.watchBoost(), { size: 20 });
  }

  // ---------- панель прокачки ----------

  createUpgrades() {
    const g = this.add.graphics({ x: 360, y: 1012 });
    g.fillStyle(COLORS.pink, 1).fillRoundedRect(-360, -280, 720, 600, 36);
    g.fillStyle(COLORS.card, 1).fillRoundedRect(-360, -274, 720, 600, 36);
    txt(this, 360, 768, '💎 ЛУКСМАКСИНГ', 28, HEX.pink).setOrigin(0.5);

    this.rows = UPGRADES.map((u, i) => {
      const y = 822 + i * 57;
      const card = this.add.graphics({ x: 360, y });
      drawCard(card, 690, 50, 0x2a185e, { radius: 16, depth: 3 });
      const circle = this.add.circle(40, y, 21, COLORS.ink);
      emoji(this, 40, y, u.emoji, 26);
      txt(this, 72, y - 11, u.name, 18).setOrigin(0, 0.5);
      const info = body(this, 72, y + 13, '', 15, '#a99be0').setOrigin(0, 0.5);
      const btn = button(this, 616, y - 2, 150, 42, '', COLORS.lime, () => this.onBuy(u, btn), { size: 17, textColor: HEX.ink });
      btn.label.setStroke('#ffffff', 0);
      return { u, info, btn, circle };
    });
  }

  makeArt(key, emo, size) {
    if (this.textures.exists(key)) {
      const img = this.add.image(0, 0, key);
      img.baseScale = size / Math.max(img.width, img.height);
      return img.setScale(img.baseScale);
    }
    const t = emoji(this, 0, 0, emo, Math.round(size * 0.8));
    t.baseScale = 1;
    return t;
  }

  // ---------- игровой цикл ----------

  spawnEnemy() {
    const boss = isBoss(state.level);
    const e = enemyFor(state.level);
    this.maxHp = enemyHp(state.level);
    this.hp = this.maxHp;
    this.dying = false;
    this.bossLeft = boss ? BALANCE.bossTime : 0;

    this.enemyBob.removeAll(true);
    this.enemyHolder.setAlpha(1).setAngle(0).setScale(0);
    this.enemyArt = this.makeArt(`enemy_${e.id}`, e.emoji, boss ? 360 : 290);
    this.enemyBob.add(this.enemyArt);
    this.tweens.add({ targets: this.enemyHolder, scale: 1, duration: 320, ease: 'Back.easeOut' });

    this.levelText.setText(`${boss ? '🔥 БОСС · ' : ''}УР. ${state.level + 1} · ${e.name.toUpperCase()}`);
    this.levelText.setColor(boss ? '#ff5a7a' : HEX.white);
    this.timerText.setText('');
    this.rays.setAlpha(boss ? 1.8 : 1);
    if (boss) {
      this.cameras.main.flash(200, 255, 46, 151);
      pop(this, 360, 380, 'БОСС!', 72, '#ff5a7a', 80);
    }
    this.updateHp();
  }

  onTap(p, auto = false) {
    if (this.dying) return;
    const s = stats();
    const crit = Math.random() < s.crit;
    const dmg = s.tap * (crit ? BALANCE.critMult : 1);

    if (crit) {
      if (!auto || Math.random() < 0.3) sound.crit();
      pop(this, p.x, p.y - 30, `КРИТ!\n-${format(dmg)}`, 34, HEX.yellow, 120);
      if (!auto) this.cameras.main.shake(80, 0.006);
    } else {
      if (!auto || Math.random() < 0.4) sound.tap();
      pop(this, p.x, p.y - 20, `-${format(dmg)}`, 30, HEX.white, 90);
      if (!auto && Math.random() < 0.12) pop(this, p.x + Phaser.Math.Between(-90, 90), p.y - 70, pick(TAP_PHRASES), 22, HEX.lime);
    }
    this.sparks.explode(crit ? 14 : 6, p.x, p.y);

    const art = this.enemyArt;
    this.tweens.killTweensOf(art);
    art.setScale(art.baseScale).setAngle(0).setTint(0xffb3dc);
    this.tweens.add({
      targets: art, scaleX: art.baseScale * 1.14, scaleY: art.baseScale * 0.86,
      angle: Phaser.Math.Between(-7, 7), duration: 50, yoyo: true,
      onComplete: () => art.clearTint(),
    });

    this.damage(dmg);
  }

  tick(dt) {
    if (this.dying) return;
    const s = stats();
    if (s.dps > 0) this.damage(s.dps * dt);

    // «мог-шторм» из колеса — автоматические тапы
    if (s.autotap > 0) {
      this.autoAcc += s.autotap * dt;
      while (this.autoAcc >= 1 && !this.dying) {
        this.autoAcc -= 1;
        this.onTap({ x: 360 + Phaser.Math.Between(-130, 130), y: ENEMY_Y + Phaser.Math.Between(-130, 110) }, true);
      }
    }

    if (this.bossLeft > 0 && !this.dying) {
      this.bossLeft -= dt;
      this.timerText.setText(`⏱ ${Math.max(0, this.bossLeft).toFixed(1)}`);
      if (this.bossLeft <= 0) this.bossFailed();
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
    this.hpBar.clear();
    if (k > 0) {
      const w = Math.max(28, 552 * k);
      this.hpBar.fillStyle(COLORS.pink, 1).fillRoundedRect(0, -14, w, 28, 14);
      this.hpBar.fillStyle(0xffffff, 0.3).fillRoundedRect(6, -11, w - 12, 9, 5);
    }
    this.hpText.setText(`САМООЦЕНКА ${format(Math.max(0, Math.ceil(this.hp)))} / ${format(this.maxHp)}`);
  }

  defeat() {
    this.dying = true;
    const wasBoss = isBoss(state.level);
    const reward = enemyReward(state.level);
    addAura(reward);
    state.kills++;
    state.level++;

    sound.kill();
    this.confetti.explode(wasBoss ? 70 : 30, 360, ENEMY_Y);
    pop(this, 360, 340, pick(KILL_PHRASES), wasBoss ? 62 : 50, HEX.pink, 140);
    pop(this, 360, 450, `+${format(reward)} ✨`, 40, HEX.yellow, 120);
    this.timerText.setText('');

    this.tweens.add({
      targets: this.enemyHolder, scaleX: 1.4, scaleY: 0.12, alpha: 0, angle: 15,
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
    pop(this, 360, 400, 'НЕ ХВАТИЛО АУРЫ!', 40, '#ff5a7a', 40);
    pop(this, 360, 470, 'качайся и возвращайся', 24, HEX.soft, 30);
    state.level = Math.max(0, state.level - 1);
    this.tweens.add({
      targets: this.enemyHolder, alpha: 0, duration: 600, delay: 700,
      onComplete: () => this.spawnEnemy(),
    });
  }

  onBuy(u, btn) {
    if (buy(u)) {
      sound.buy();
      pop(this, btn.x, btn.y - 24, '+1 УР.', 20, HEX.lime, 50);
      this.refresh();
      save();
    } else {
      sound.deny();
      this.tweens.add({ targets: btn, x: btn.x + 6, duration: 40, yoyo: true, repeat: 2 });
    }
  }

  async watchBoost() {
    if (hasEffect('ad')) return;
    sdk.gameplayStop();
    const ok = await sdk.showRewarded();
    sdk.gameplayStart();
    if (ok) {
      addEffect({ type: 'all', mult: 2, sec: BALANCE.adBoostSec }, '×2 мог', 'ad');
      sound.buy();
      pop(this, 360, 500, 'МОГ ×2!', 56, HEX.purple, 120);
      this.refresh();
    }
  }

  onWheelPrize(prize) {
    this.confetti.explode(60, 360, 300);
    this.refresh();
  }

  refresh() {
    const s = stats();
    this.auraText.setText(`✨ ${format(state.aura)}`);
    this.statsText.setText(
      `👆 ${format(s.tap)}   ⚙️ ${format(s.dps)}/с` +
      (s.crit > 0 && s.crit < 1 ? `   💥 ${Math.round(s.crit * 100)}%` : ''),
    );

    // активные эффекты
    const now = Date.now();
    this.effectsText.setText(activeEffects()
      .map((e) => `${EFFECT_ICONS[e.type] || '✨'} ${e.type === 'crit' ? '100% крит' : e.type === 'autotap' ? 'шторм' : `×${e.mult}`} ${Math.ceil((e.until - now) / 1000)}с`)
      .join('   '));

    for (const { u, info, btn } of this.rows) {
      const l = lvl(u.id);
      const maxed = isMaxed(u);
      const c = cost(u);
      btn.setLabel(maxed ? 'МАКС' : `✨ ${format(c)}`);
      btn.setEnabled(!maxed && state.aura >= c);
      btn.label.setColor(btn.enabled ? HEX.ink : '#9a90c0');
      info.setText(`ур. ${l} · ${this.describe(u, l)}`);
    }

    const ad = activeEffects().find((e) => e.id === 'ad');
    if (ad) {
      this.boostBtn.setLabel(`×2 МОГ\nещё ${Math.ceil((ad.until - now) / 1000)} сек`).setEnabled(false);
    } else {
      this.boostBtn.setLabel('📺 ×2 МОГ\nна 60 сек').setEnabled(true);
    }

    const free = wheelStatus().free;
    this.wheelBadge.setVisible(free);
    this.wheelBadgeBg.setVisible(free);

    this.updatePlayer();
  }

  describe(u, l) {
    switch (u.type) {
      case 'tap': return `+${u.value} к тапу`;
      case 'dps': return `+${u.value} автомог/с`;
      case 'crit': return `шанс крита ×${BALANCE.critMult}: ${Math.round(u.value * l * 100)}%`;
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
    this.playerHolder.add(this.makeArt(`player_${st.index + 1}`, st.emoji, 110));
    this.playerName.setText(`ТЫ: ${st.name.toUpperCase()}`);

    if (upgraded) {
      this.playerHolder.setScale(0);
      this.tweens.add({ targets: this.playerHolder, scale: 1, duration: 600, ease: 'Elastic.easeOut' });
      this.confetti.explode(40, 92, 620);
      pop(this, 360, 560, `ГЛОУ АП!\n${st.name.toUpperCase()}`, 40, HEX.lime, 120);
      sound.prize();
    }
  }

  showOffline(amount) {
    const box = this.add.container(0, 0).setDepth(200);
    const close = (mult) => {
      addAura(amount * mult);
      pop(this, 360, 500, `+${format(amount * mult)} ✨`, 48, HEX.yellow, 120);
      box.destroy();
      this.refresh();
      save();
    };

    const shade = this.add.rectangle(360, 640, 720, 1280, 0x05010f, 0.82).setInteractive();
    const panel = this.add.graphics({ x: 360, y: 620 });
    drawCard(panel, 620, 440, COLORS.card, { radius: 28, depth: 10, stroke: COLORS.yellow });
    const title = txt(this, 360, 490, 'ПОКА ТЕБЯ НЕ БЫЛО,\nТЫ НАМОГАЛ', 30).setOrigin(0.5);
    const sum = txt(this, 360, 600, `✨ ${format(amount)}`, 62, HEX.yellow).setOrigin(0.5);
    let busy = false;
    const take = button(this, 220, 730, 230, 84, 'ЗАБРАТЬ', COLORS.lime, () => { if (!busy) close(1); }, { size: 24, textColor: HEX.ink });
    take.label.setStroke('#ffffff', 0);
    const double = button(this, 490, 730, 270, 84, '📺 ЗАБРАТЬ ×2', COLORS.purple, async () => {
      if (busy) return;
      busy = true;
      sdk.gameplayStop();
      const ok = await sdk.showRewarded();
      sdk.gameplayStart();
      close(ok ? 2 : 1);
    }, { size: 22 });
    box.add([shade, panel, title, sum, take, double]);
  }
}
