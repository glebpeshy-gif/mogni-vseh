import * as Phaser from 'phaser';
import { UPGRADES, BALANCE, EFFECT_ICONS } from '../data.js';
import {
  state, stats, cost, lvl, isMaxed, buy, enemyFor, enemyHp, enemyReward,
  isBoss, playerStage, addAura, save, format, activeEffects, addEffect, hasEffect, wheelStatus,
} from '../state.js';
import {
  COLORS, HEX, txt, body, emoji, button, drawCard, pop, makeTextures, makeBgTexture, hexToInt,
  modal, askReward, closeTopModal,
} from '../theme.js';
import { t, enemyName, upgradeName, stageName, phrases } from '../i18n.js';
import { openWheel } from '../features/wheel.js';
import { openLeaderboard } from '../features/leaderboard.js';
import { openSettings, applySettings, vibrate } from '../features/settings.js';
import * as sdk from '../sdk.js';
import * as sound from '../sound.js';

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const CONFETTI = [COLORS.pink, COLORS.lime, COLORS.cyan, COLORS.yellow, COLORS.purple];
const ENEMY_Y = 470;

export default class Game extends Phaser.Scene {
  constructor() { super('Game'); }

  init(data) { this.offline = data?.offline || 0; }

  create() {
    document.title = t('title');
    makeTextures(this);
    applySettings();
    this.bgId = null;
    this.createBackground();
    this.createHud();
    this.createArena();
    this.createUpgrades();
    this.createControls();
    this.spawnEnemy();

    this.autoAcc = 0;
    this.time.addEvent({ delay: 100, loop: true, callback: () => this.tick(0.1) });
    this.time.addEvent({ delay: 200, loop: true, callback: () => this.refresh() });
    this.time.addEvent({ delay: 10000, loop: true, callback: () => save() });
    this.refresh();

    // Реклама / пауза платформы / свёрнутая вкладка — игра полностью замирает
    // Плашка «Пауза» — когда игра потеряла фокус (во время рекламы её не видно)
    this.pauseOverlay = this.add.container(0, 0).setDepth(1000).setVisible(false);
    this.pauseOverlay.add([
      this.add.rectangle(360, 640, 720, 1280, 0x05010f, 0.7),
      txt(this, 360, 600, t('paused'), 64, HEX.yellow).setOrigin(0.5),
      body(this, 360, 680, t('paused_hint'), 28, HEX.white).setOrigin(0.5),
    ]);
    const onPause = (paused) => {
      this.pauseOverlay.setVisible(paused && !sdk.isAdBusy());
      if (paused) this.scene.pause(); else this.scene.resume();
    };
    const off = sdk.onPauseChange(onPause);
    this.events.once('shutdown', off);
    if (sdk.isPaused()) onPause(true);

    sdk.ready();
    if (this.offline > 0) this.showOffline(this.offline);
  }

  // Перезапуск после смены языка или сброса прогресса
  restart() {
    save();
    this.scene.restart({ offline: 0 });
  }

  shake(ms, power) { if (state.settings.shake) this.cameras.main.shake(ms, power); }
  flash(ms, r, g, b) { if (state.settings.shake) this.cameras.main.flash(ms, r, g, b); }

  // ---------- фон: свой у каждого соперника ----------

  createBackground() {
    this.bgLayer = this.add.container(0, 0);
    this.stickerLayer = null;

    // вращающиеся лучи за соперником
    this.rays = this.add.graphics({ x: 360, y: ENEMY_Y });
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

  setBackground(e, boss) {
    if (this.bgId === e.id) return;
    this.bgId = e.id;
    const bg = e.bg;

    // своя картинка src/art/bg/<id>.png важнее сгенерированного фона
    const key = this.textures.exists(`bgimg_${e.id}`)
      ? `bgimg_${e.id}`
      : this.textures.exists('bg') ? 'bg' : makeBgTexture(this, `bg_${e.id}`, bg, boss);
    const img = this.add.image(360, 640, key).setDisplaySize(720, 1280).setAlpha(0);
    const old = [...this.bgLayer.list];
    this.bgLayer.add(img);
    this.tweens.add({
      targets: img, alpha: 1, duration: 450,
      onComplete: () => old.forEach((o) => o.destroy()),
    });

    // стикеры по теме соперника
    const prev = this.stickerLayer;
    if (prev) this.tweens.add({ targets: prev, alpha: 0, duration: 300, onComplete: () => prev.destroy() });
    this.stickerLayer = this.add.container(0, 0).setAlpha(0);
    this.children.moveAbove(this.stickerLayer, this.bgLayer);
    for (let i = 0; i < 14; i++) {
      const s = emoji(this, Phaser.Math.Between(20, 700), Phaser.Math.Between(140, 720), pick(bg.stickers), Phaser.Math.Between(34, 62))
        .setAlpha(boss ? 0.2 : 0.15).setAngle(Phaser.Math.Between(-25, 25));
      this.tweens.add({
        targets: s, y: s.y - Phaser.Math.Between(20, 50), angle: s.angle + Phaser.Math.Between(-15, 15),
        duration: Phaser.Math.Between(2500, 4500), yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
      });
      this.stickerLayer.add(s);
    }
    this.tweens.add({ targets: this.stickerLayer, alpha: 1, duration: 450 });

    // лучи в цвет свечения
    const glow = hexToInt(bg.glow);
    this.rays.clear();
    for (let i = 0; i < 16; i++) {
      const a0 = (i / 16) * Math.PI * 2;
      const a1 = a0 + Math.PI / 16;
      this.rays.fillStyle(glow, i % 2 ? (boss ? 0.22 : 0.14) : 0.06);
      this.rays.fillTriangle(0, 0, Math.cos(a0) * 560, Math.sin(a0) * 560, Math.cos(a1) * 560, Math.sin(a1) * 560);
    }
    this.children.moveAbove(this.rays, this.stickerLayer);

    // поля по бокам на широком экране — в цвет фона
    document.body.style.background = `linear-gradient(${bg.top}, ${bg.bottom})`;
  }

  // ---------- верхняя панель ----------

  createHud() {
    this.auraText = txt(this, 360, 52, '', 56, HEX.yellow).setOrigin(0.5);
    this.statsText = body(this, 360, 102, '', 20, HEX.soft).setOrigin(0.5);

    const gear = emoji(this, 672, 46, '⚙️', 40).setInteractive({ useHandCursor: true });
    gear.on('pointerdown', () => {
      sound.click();
      this.tweens.add({ targets: gear, angle: gear.angle + 90, duration: 200 });
      openSettings(this, { onRestart: () => this.restart() });
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
      sound.click();
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
    this.zone = this.add.zone(360, 450, 720, 560).setInteractive({ useHandCursor: true });
    this.zone.on('pointerdown', (p) => this.onTap(p));

    this.enemyHolder = this.add.container(360, ENEMY_Y);
    this.enemyBob = this.add.container(0, 0);
    this.enemyHolder.add(this.enemyBob);
    this.tweens.add({ targets: this.enemyBob, y: -10, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    // боковые кнопки
    this.roundButton(64, 330, '🏆', t('btn_top'), COLORS.cyan, () => openLeaderboard(this));
    this.wheelBtn = this.roundButton(656, 330, '🎰', t('btn_wheel'), COLORS.pink, () => {
      openWheel(this, { onPrize: () => this.onWheelPrize(), onClose: () => this.refresh() });
    });
    const badgeBg = this.add.circle(34, -36, 16, 0xff3355).setStrokeStyle(3, COLORS.ink);
    this.wheelBadge = txt(this, 34, -36, '!', 22).setOrigin(0.5);
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
    txt(this, 360, 768, t('looksmax'), 28, HEX.pink).setOrigin(0.5);

    const desktop = sdk.isDesktop();
    this.rows = UPGRADES.map((u, i) => {
      const y = 822 + i * 57;
      const card = this.add.graphics({ x: 360, y });
      drawCard(card, 690, 50, 0x2a185e, { radius: 16, depth: 3 });
      this.add.circle(40, y, 21, COLORS.ink);
      emoji(this, 40, y, u.emoji, 26);
      if (desktop) txt(this, 22, y - 18, String(i + 1), 13, HEX.yellow).setOrigin(0.5);
      txt(this, 72, y - 11, upgradeName(u.id), 18).setOrigin(0, 0.5);
      const info = body(this, 72, y + 13, '', 15, '#a99be0').setOrigin(0, 0.5);
      const btn = button(this, 616, y - 2, 150, 42, '', COLORS.lime, () => this.onBuy(u, btn), { size: 17, textColor: HEX.ink });
      btn.label.setStroke('#ffffff', 0);
      return { u, info, btn };
    });
  }

  // ---------- управление: телефон и компьютер ----------

  createControls() {
    // звук можно включить только после первого действия игрока
    this.input.on('pointerdown', () => sound.unlock());

    if (sdk.isDesktop()) {
      body(this, 360, 722, t('desktop_hint'), 15, '#d8cfff', { stroke: HEX.ink, strokeThickness: 4 })
        .setOrigin(0.5).setAlpha(0.8);
    }

    this.input.keyboard?.on('keydown', (ev) => {
      if (ev.repeat) return; // зажатая клавиша — не автокликер
      sound.unlock();
      if (ev.code === 'Escape') { closeTopModal(); return; }
      if (sdk.inMenu()) return;
      if (ev.code === 'Space' || ev.code === 'Enter') {
        ev.preventDefault?.();
        this.onTap({ x: 360 + Phaser.Math.Between(-110, 110), y: ENEMY_Y + Phaser.Math.Between(-110, 90) });
        return;
      }
      const n = Number(ev.key);
      if (n >= 1 && n <= this.rows.length) {
        const row = this.rows[n - 1];
        this.onBuy(row.u, row.btn);
      }
    });
  }

  makeArt(key, emo, size) {
    if (this.textures.exists(key)) {
      const img = this.add.image(0, 0, key);
      img.baseScale = size / Math.max(img.width, img.height);
      return img.setScale(img.baseScale);
    }
    const tx = emoji(this, 0, 0, emo, Math.round(size * 0.8));
    tx.baseScale = 1;
    return tx;
  }

  // ---------- игровой цикл ----------

  spawnEnemy(bonusTime = 0) {
    const boss = isBoss(state.level);
    const e = enemyFor(state.level);
    this.maxHp = enemyHp(state.level);
    this.hp = this.maxHp;
    this.dying = false;
    this.bossLeft = boss ? BALANCE.bossTime + bonusTime : 0;

    this.setBackground(e, boss);

    this.enemyBob.removeAll(true);
    this.enemyHolder.setAlpha(1).setAngle(0).setScale(0);
    this.enemyArt = this.makeArt(`enemy_${e.id}`, e.emoji, boss ? 360 : 290);
    this.enemyBob.add(this.enemyArt);
    this.tweens.add({ targets: this.enemyHolder, scale: 1, duration: 320, ease: 'Back.easeOut' });

    this.levelText.setText(`${boss ? t('boss_tag') : ''}${t('level', { n: state.level + 1 })} · ${enemyName(e.id).toUpperCase()}`);
    this.levelText.setColor(boss ? '#ff5a7a' : HEX.white);
    this.timerText.setText('');
    if (boss) {
      this.flash(200, 255, 46, 151);
      pop(this, 360, 380, t('boss_pop'), 72, '#ff5a7a', 80);
    }
    this.updateHp();
  }

  onTap(p, auto = false) {
    if (this.dying || sdk.inMenu()) return;
    const s = stats();
    const crit = Math.random() < s.crit;
    const dmg = s.tap * (crit ? BALANCE.critMult : 1);

    if (crit) {
      if (!auto || Math.random() < 0.3) sound.crit();
      pop(this, p.x, p.y - 30, `${t('crit')}\n-${format(dmg)}`, 34, HEX.yellow, 120);
      if (!auto) { this.shake(80, 0.006); vibrate(12); }
    } else {
      if (!auto || Math.random() < 0.4) sound.tap();
      pop(this, p.x, p.y - 20, `-${format(dmg)}`, 30, HEX.white, 90);
      if (!auto && Math.random() < 0.12) pop(this, p.x + Phaser.Math.Between(-90, 90), p.y - 70, pick(phrases().tap), 22, HEX.lime);
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
    if (this.dying || sdk.inMenu()) return;
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
    this.hpText.setText(t('hp', { a: format(Math.max(0, Math.ceil(this.hp))), b: format(this.maxHp) }));
  }

  defeat() {
    this.dying = true;
    const wasBoss = isBoss(state.level);
    const reward = enemyReward(state.level);
    addAura(reward);
    state.kills++;
    state.level++;

    sound.kill();
    vibrate(wasBoss ? [60, 40, 60] : 25);
    this.confetti.explode(wasBoss ? 70 : 30, 360, ENEMY_Y);
    pop(this, 360, 340, pick(phrases().kill), wasBoss ? 62 : 50, HEX.pink, 140);
    pop(this, 360, 450, `+${format(reward)} ✨`, 40, HEX.yellow, 120);
    this.timerText.setText('');

    this.tweens.add({
      targets: this.enemyHolder, scaleX: 1.4, scaleY: 0.12, alpha: 0, angle: 15,
      duration: 380, ease: 'Back.easeIn',
      onComplete: () => {
        if (wasBoss) this.showBossResult(true, reward);
        else this.spawnEnemy();
      },
    });
    save();
    this.refresh();
  }

  bossFailed() {
    this.dying = true;
    sound.fail();
    vibrate(200);
    this.tweens.add({
      targets: this.enemyHolder, alpha: 0.25, duration: 400,
      onComplete: () => this.showBossResult(false),
    });
  }

  // Итоги босса — логическая пауза. Полноэкранная реклама показывается
  // только после нажатия кнопки, а не посреди тапов (требование 4.4).
  showBossResult(win, reward = 0) {
    let done = false;
    const next = async (retryWithBonus = false) => {
      if (done) return;
      done = true;
      if (!retryWithBonus) await sdk.showFullscreen();
      close();
      if (!win && !retryWithBonus) state.level = Math.max(0, state.level - 1);
      save();
      this.spawnEnemy(retryWithBonus ? BALANCE.bossRetryBonus : 0);
    };

    const { panel, close } = modal(this, 620, win ? 520 : 640,
      win ? t('boss_win') : t('boss_lose'), { onX: () => next() });

    if (win) {
      panel.add(emoji(this, 0, -80, '🗿', 110));
      panel.add(txt(this, 0, 40, `+${format(reward)} ✨`, 50, HEX.yellow).setOrigin(0.5));
      this.confetti.explode(60, 360, 500);
      sound.prize();
    } else {
      panel.add(emoji(this, 0, -150, '😵', 90));
      panel.add(body(this, 0, -50, t('boss_lose_text'), 24, HEX.soft, { align: 'center' }).setOrigin(0.5));
      // Награда за рекламу — бонус, а не обязательное условие (требование 4.5.2)
      const retry = button(this, 0, 60, 540, 84, t('boss_retry_ad', { s: BALANCE.bossRetryBonus }), COLORS.purple, async () => {
        if (done || !retry.enabled) return;
        retry.setEnabled(false);
        if (await askReward(this)) next(true);
        else retry.setEnabled(true);
      }, { size: 20 });
      panel.add(retry);
    }

    // Кнопка активна через секунду, чтобы игрок не нажал её случайно, продолжая тапать
    const go = button(this, 0, win ? 170 : 175, 360, 84, win ? t('next') : t('got_it'), COLORS.lime, () => {
      if (go.enabled) next();
    }, { size: 28, textColor: HEX.ink });
    go.label.setStroke('#ffffff', 0);
    go.setEnabled(false);
    this.time.delayedCall(1000, () => go.setEnabled(true));
    panel.add(go);
  }

  onBuy(u, btn) {
    if (buy(u)) {
      sound.buy();
      vibrate(10);
      pop(this, btn.x, btn.y - 24, t('plus_lvl'), 20, HEX.lime, 50);
      this.tweens.add({ targets: btn, scaleX: 0.93, scaleY: 0.9, duration: 60, yoyo: true });
      this.refresh();
      save();
    } else {
      sound.deny();
      this.tweens.add({ targets: btn, x: btn.x + 6, duration: 40, yoyo: true, repeat: 2 });
    }
  }

  async watchBoost() {
    if (hasEffect('ad') || sdk.isAdBusy()) return;
    if (await askReward(this)) {
      addEffect({ type: 'all', mult: 2, sec: BALANCE.adBoostSec }, 'ad');
      save();
      sound.buy();
      pop(this, 360, 500, t('mog_x2'), 56, HEX.purple, 120);
      this.refresh();
    }
  }

  onWheelPrize() {
    this.confetti.explode(60, 360, 300);
    this.refresh();
  }

  refresh() {
    const s = stats();
    this.auraText.setText(`✨ ${format(state.aura)}`);
    this.statsText.setText(
      `👆 ${format(s.tap)}   ⚙️ ${format(s.dps)}${t('per_sec')}` +
      (s.crit > 0 && s.crit < 1 ? `   💥 ${Math.round(s.crit * 100)}%` : ''),
    );

    // активные эффекты
    const now = Date.now();
    this.effectsText.setText(activeEffects()
      .map((e) => {
        const what = e.type === 'crit' ? t('eff_crit') : e.type === 'autotap' ? t('eff_storm') : `×${e.mult}`;
        return `${EFFECT_ICONS[e.type] || '✨'} ${what} ${Math.ceil((e.until - now) / 1000)}${t('sec')}`;
      })
      .join('   '));

    for (const { u, info, btn } of this.rows) {
      const l = lvl(u.id);
      const maxed = isMaxed(u);
      const c = cost(u);
      btn.setLabel(maxed ? t('max') : `✨ ${format(c)}`);
      btn.setEnabled(!maxed && state.aura >= c);
      btn.label.setColor(btn.enabled ? HEX.ink : '#9a90c0');
      info.setText(`${t('up_lvl', { n: l })} · ${this.describe(u, l)}`);
    }

    const ad = activeEffects().find((e) => e.id === 'ad');
    if (ad) {
      this.boostBtn.setLabel(t('boost_active', { s: Math.ceil((ad.until - now) / 1000) })).setEnabled(false);
    } else {
      this.boostBtn.setLabel(t('boost_ad')).setEnabled(true);
    }

    const free = wheelStatus().free;
    this.wheelBadge.setVisible(free);
    this.wheelBadgeBg.setVisible(free);

    this.updatePlayer();
  }

  describe(u, l) {
    switch (u.type) {
      case 'tap': return t('up_tap', { v: u.value });
      case 'dps': return t('up_dps', { v: u.value });
      case 'crit': return t('up_crit', { m: BALANCE.critMult, p: Math.round(u.value * l * 100) });
      case 'mult': return t('up_mult', { v: u.value, c: Math.pow(u.value, l).toFixed(2) });
      default: return '';
    }
  }

  updatePlayer() {
    const st = playerStage();
    if (st.index === this.playerStageIndex) return;
    const upgraded = this.playerStageIndex >= 0;
    this.playerStageIndex = st.index;
    const name = stageName(st.index).toUpperCase();

    this.playerHolder.removeAll(true);
    this.playerHolder.add(this.makeArt(`player_${st.index + 1}`, st.emoji, 110));
    this.playerName.setText(t('you_stage', { s: name })).setScale(1);
    this.playerName.setScale(Math.min(1, 170 / this.playerName.width)); // длинные имена ужимаем

    if (upgraded) {
      this.playerHolder.setScale(0);
      this.tweens.add({ targets: this.playerHolder, scale: 1, duration: 600, ease: 'Elastic.easeOut' });
      this.confetti.explode(40, 92, 620);
      pop(this, 360, 560, t('glowup', { s: name }), 40, HEX.lime, 120);
      sound.prize();
    }
  }

  showOffline(amount) {
    let busy = false;
    let taken = false;
    const { panel, close } = modal(this, 620, 500, t('offline_title'), { onX: () => take(1) });
    const take = (mult) => {
      if (taken || (busy && mult === 1)) return;
      taken = true;
      addAura(amount * mult);
      pop(this, 360, 500, `+${format(amount * mult)} ✨`, 48, HEX.yellow, 120);
      close();
      this.refresh();
      save();
    };

    panel.add(body(this, 0, -110, t('offline_text'), 26, HEX.soft).setOrigin(0.5));
    panel.add(txt(this, 0, -30, `✨ ${format(amount)}`, 62, HEX.yellow).setOrigin(0.5));
    const double = button(this, 0, 90, 540, 84, t('offline_ad'), COLORS.purple, async () => {
      if (busy) return;
      busy = true;
      double.setEnabled(false);
      if (await askReward(this)) take(2);
      else { busy = false; double.setEnabled(true); }
    }, { size: 21 });
    const one = button(this, 0, 190, 360, 76, t('take'), COLORS.lime, () => take(1), { size: 24, textColor: HEX.ink });
    one.label.setStroke('#ffffff', 0);
    panel.add([double, one]);
  }
}
