import {
  BALL, BH, BRICKS, BW, BrickType, COLS, EXIT_H, EXIT_Y, FR, FX, FY, FW, GATE_L, GATE_R, GATE_W, H, PADDLE_Y, PAL,
  PaddleMode, POWERS, POWER_KINDS, PowerKind, ROWS, TOTAL_LEVELS, isBrickType,
} from './defs';
import { LEVELS, worldOf } from './levels';
import { Sfx } from './audio';

export type State = 'title' | 'menu' | 'howto' | 'intro' | 'play' | 'paused' | 'dying' | 'clear' | 'gameover' | 'ending';

export interface Cell {
  t: BrickType | null;
  hp: number;
  max: number;
  flash: number;
}
export interface Ball {
  x: number;
  y: number;
  vx: number;
  vy: number;
  stuck: boolean;
  off: number;
}
export interface Capsule {
  x: number;
  y: number;
  kind: PowerKind;
  anim: number;
}
export interface Enemy {
  x: number;
  y: number;
  w: number;
  h: number;
  vx: number;
  vy: number;
  anim: number;
  dead: number;
  phase: number;
}
export interface Spear {
  x: number;
  y: number;
}
export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
  s: number;
}
export interface Fireball {
  x: number;
  y: number;
  vx: number;
  vy: number;
}
export interface Boss {
  x: number;
  y: number;
  w: number;
  h: number;
  hp: number;
  max: number;
  flash: number;
  fire: number;
  dir: number;
  dying: number;
  cd: number;
}

export interface Input {
  held: Set<string>;
  pressed: Set<string>;
  mouseX: number | null;
  mouseMoved: boolean;
}

const HI_KEY = 'rockanoid-hi';
const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v);
const overlap = (ax: number, ay: number, aw: number, ah: number, bx: number, by: number, bw: number, bh: number) =>
  ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;

export class Game {
  state: State = 'title';
  timer = 0;
  frame = 0;
  introLen = 150;

  level = 1;
  score = 0;
  hi = 0;
  lives = 3;
  nextExtra = 20000;

  grid: Cell[] = [];
  bricksLeft = 0;

  paddle = { x: FX + (FW - 32) / 2, w: 32, mode: 'normal' as PaddleMode };
  balls: Ball[] = [];
  capsules: Capsule[] = [];
  enemies: Enemy[] = [];
  spears: Spear[] = [];
  particles: Particle[] = [];
  fireballs: Fireball[] = [];
  boss: Boss | null = null;

  speed = 2;
  baseSpeed = 2;
  maxSpeed = 3.3;
  speedTimer = 0;
  stuckTimer = 0;
  fireCooldown = 0;
  enemyTimer = 0;
  gates = [0, 0];
  exitOpen = false;
  lastPower: PowerKind | null = null;
  message = '';
  msgTimer = 0;

  menu = { index: 0, startLevel: 1, hard: false };
  input: Input = { held: new Set(), pressed: new Set(), mouseX: null, mouseMoved: false };
  sfx = new Sfx();

  constructor() {
    try {
      this.hi = Number(localStorage.getItem(HI_KEY) ?? 0) || 0;
    } catch {
      this.hi = 0;
    }
    this.loadLevel();
  }

  // ---------- helpers ----------
  private pressed(k: string) {
    return this.input.pressed.has(k);
  }

  private saveHi() {
    try {
      localStorage.setItem(HI_KEY, String(this.hi));
    } catch {
      /* ignore */
    }
  }

  addScore(n: number) {
    this.score += n;
    if (this.score >= this.nextExtra) {
      this.lives++;
      this.nextExtra += 60000;
      this.sfx.play('1up');
    }
    if (this.score > this.hi) this.hi = this.score;
  }

  spawnParticles(x: number, y: number, color: string, n: number, power = 1.5) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = (0.4 + Math.random()) * power;
      this.particles.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 0.5, life: 18 + Math.random() * 14, color, s: Math.random() < 0.4 ? 2 : 1 });
    }
  }

  // ---------- level setup ----------
  loadLevel() {
    const rows = LEVELS[this.level - 1];
    this.grid = [];
    this.bricksLeft = 0;
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const ch = rows[r][c];
        if (isBrickType(ch)) {
          const hp = ch === 'R' ? (this.level < 15 ? 2 : 3) : BRICKS[ch].hp;
          this.grid.push({ t: ch, hp, max: hp, flash: 0 });
          if (hp !== Infinity) this.bricksLeft++;
        } else {
          this.grid.push({ t: null, hp: 0, max: 0, flash: 0 });
        }
      }
    }
    this.baseSpeed = (1.85 + this.level * 0.03) * (this.menu.hard ? 1.2 : 1);
    this.maxSpeed = this.baseSpeed + 1.3;
    this.capsules = [];
    this.enemies = [];
    this.spears = [];
    this.fireballs = [];
    this.particles = [];
    this.exitOpen = false;
    this.gates = [0, 0];
    this.enemyTimer = 360;
    this.speedTimer = 0;
    this.boss =
      this.level === TOTAL_LEVELS
        ? { x: FX + (FW - 40) / 2, y: FY + 12, w: 40, h: 32, hp: 24, max: 24, flash: 0, fire: 200, dir: 1, dying: 0, cd: 0 }
        : null;
    this.resetPaddle();
  }

  resetPaddle() {
    this.paddle.mode = 'normal';
    this.paddle.w = 32;
    this.paddle.x = FX + (FW - 32) / 2;
    this.balls = [{ x: this.paddle.x + 14, y: PADDLE_Y - BALL, vx: 0, vy: 0, stuck: true, off: 14 }];
    this.speed = this.baseSpeed;
    this.stuckTimer = 0;
    this.fireCooldown = 0;
    this.spears = [];
    this.lastPower = null;
  }

  startGame(level: number) {
    this.level = level;
    this.score = 0;
    this.lives = 3;
    this.nextExtra = 20000;
    this.sfx.music(null);
    this.loadLevel();
    this.state = 'intro';
    this.timer = 0;
    this.introLen = 150;
    this.sfx.play('start');
  }

  // ---------- main update ----------
  update() {
    this.frame++;
    this.sfx.tick();
    switch (this.state) {
      case 'title':
        this.sfx.music('title');
        if (this.pressed('confirm') || this.pressed('fire')) {
          this.state = 'menu';
          this.sfx.play('select');
        }
        break;
      case 'menu':
        this.updateMenu();
        break;
      case 'howto':
        if (this.pressed('confirm') || this.pressed('back') || this.pressed('fire')) {
          this.state = 'menu';
          this.sfx.play('select');
        }
        break;
      case 'intro':
        this.timer++;
        if (this.timer >= this.introLen || (this.timer > 40 && (this.pressed('fire') || this.pressed('confirm')))) {
          this.state = 'play';
          this.stuckTimer = 0;
        }
        break;
      case 'play':
        this.updatePlay();
        break;
      case 'paused':
        if (this.pressed('pause') || this.pressed('back') || this.pressed('confirm')) {
          this.state = 'play';
          this.sfx.play('select');
        } else if (this.pressed('quit')) {
          this.saveHi();
          this.state = 'title';
          this.timer = 0;
        }
        break;
      case 'dying':
        this.updateDying();
        break;
      case 'clear':
        this.updateClear();
        break;
      case 'gameover':
        this.timer++;
        if (this.timer > 320 || (this.timer > 60 && (this.pressed('confirm') || this.pressed('fire')))) {
          this.state = 'title';
          this.timer = 0;
        }
        break;
      case 'ending':
        this.timer++;
        this.sfx.music('title');
        if (this.timer > 120 && (this.pressed('confirm') || this.pressed('fire'))) {
          this.state = 'title';
          this.timer = 0;
        }
        break;
    }
    this.updateParticles();
    this.input.pressed.clear();
    this.input.mouseMoved = false;
  }

  private updateMenu() {
    this.sfx.music('title');
    const n = 5;
    const m = this.menu;
    if (this.pressed('up')) {
      m.index = (m.index + n - 1) % n;
      this.sfx.play('move');
    }
    if (this.pressed('down')) {
      m.index = (m.index + 1) % n;
      this.sfx.play('move');
    }
    const dir = (this.pressed('right') ? 1 : 0) - (this.pressed('left') ? 1 : 0);
    if (dir !== 0) {
      if (m.index === 1) {
        m.startLevel = ((m.startLevel - 1 + dir + TOTAL_LEVELS) % TOTAL_LEVELS) + 1;
        this.sfx.play('move');
      } else if (m.index === 2) {
        m.hard = !m.hard;
        this.sfx.play('move');
      } else if (m.index === 3) {
        this.sfx.enabled = !this.sfx.enabled;
        this.sfx.play('move');
      }
    }
    if (this.pressed('confirm') || this.pressed('fire')) {
      if (m.index === 0 || m.index === 1) {
        this.sfx.play('select');
        this.startGame(m.startLevel);
      } else if (m.index === 2) {
        m.hard = !m.hard;
        this.sfx.play('move');
      } else if (m.index === 3) {
        this.sfx.enabled = !this.sfx.enabled;
        this.sfx.play('move');
      } else {
        this.state = 'howto';
        this.sfx.play('select');
      }
    }
    if (this.pressed('back')) {
      this.state = 'title';
      this.sfx.play('move');
    }
  }

  // ---------- gameplay ----------
  private updatePlay() {
    if (this.pressed('pause') || this.pressed('back')) {
      this.state = 'paused';
      this.sfx.play('select');
      return;
    }
    const inp = this.input;
    const p = this.paddle;

    // paddle movement
    if (inp.mouseMoved && inp.mouseX !== null) p.x = inp.mouseX - p.w / 2;
    if (inp.held.has('left')) p.x -= 3.4;
    if (inp.held.has('right')) p.x += 3.4;
    p.x = clamp(p.x, FX, FR - p.w);

    // stuck balls
    let anyStuck = false;
    for (const b of this.balls) {
      if (b.stuck) {
        anyStuck = true;
        b.x = clamp(p.x + b.off, FX, FR - BALL);
        b.y = PADDLE_Y - BALL;
      }
    }
    if (anyStuck) {
      this.stuckTimer++;
      if (this.pressed('fire') || this.stuckTimer > 180) this.releaseBalls();
    }

    // laser spears
    this.fireCooldown--;
    if (p.mode === 'laser' && (inp.held.has('fire') || this.pressed('fire')) && this.fireCooldown <= 0 && this.spears.length < 6 && !anyStuck) {
      this.spears.push({ x: p.x + 2, y: PADDLE_Y - 6 }, { x: p.x + p.w - 4, y: PADDLE_Y - 6 });
      this.fireCooldown = 14;
      this.sfx.play('shoot');
    }

    // speed creeps up over time
    if (!anyStuck) {
      this.speedTimer++;
      if (this.speedTimer % 720 === 0) this.setSpeed(Math.min(this.speed + 0.07, this.maxSpeed));
    }

    // balls
    for (const b of this.balls) if (!b.stuck) this.moveBall(b);
    if (this.state !== 'play') return;
    this.balls = this.balls.filter((b) => b.y < H + 4);
    if (this.balls.length === 0) {
      this.startDying();
      return;
    }

    this.updateCapsules();
    this.updateSpears();
    this.updateEnemies(anyStuck);
    if (this.boss) this.updateBoss(anyStuck);
    if (this.state !== 'play') return;

    for (let i = 0; i < 2; i++) if (this.gates[i] > 0) this.gates[i]--;
    for (const c of this.grid) if (c.flash > 0) c.flash--;
    if (this.msgTimer > 0) this.msgTimer--;

    // secret exit
    if (this.exitOpen && p.x + p.w >= FR - 0.5) {
      this.addScore(10000);
      this.sfx.play('warp');
      this.levelCleared();
      return;
    }
    if (this.bricksLeft <= 0 && !this.boss) this.levelCleared();
  }

  private setSpeed(s: number) {
    this.speed = s;
    for (const b of this.balls) {
      if (b.stuck) continue;
      const m = Math.hypot(b.vx, b.vy) || 1;
      b.vx = (b.vx / m) * s;
      b.vy = (b.vy / m) * s;
    }
  }

  private releaseBalls() {
    const p = this.paddle;
    for (const b of this.balls) {
      if (!b.stuck) continue;
      b.stuck = false;
      let off = (b.x + BALL / 2 - (p.x + p.w / 2)) / (p.w / 2);
      if (Math.abs(off) < 0.15) off = Math.random() < 0.5 ? -0.3 : 0.3;
      const ang = clamp(off, -0.85, 0.85) * (Math.PI / 3);
      b.vx = Math.sin(ang) * this.speed;
      b.vy = -Math.cos(ang) * this.speed;
    }
    this.stuckTimer = 0;
  }

  private fixAngle(b: Ball) {
    const sp = Math.hypot(b.vx, b.vy) || this.speed;
    const minV = sp * 0.25;
    const minH = sp * 0.1;
    if (Math.abs(b.vy) < minV) {
      b.vy = (b.vy < 0 ? -1 : 1) * minV;
      b.vx = (b.vx < 0 ? -1 : 1) * Math.sqrt(Math.max(0, sp * sp - minV * minV));
    }
    if (Math.abs(b.vx) < minH) {
      b.vx = (b.vx < 0 ? -1 : 1) * minH;
      b.vy = (b.vy < 0 ? -1 : 1) * Math.sqrt(Math.max(0, sp * sp - minH * minH));
    }
  }

  private moveBall(b: Ball) {
    const sp = Math.hypot(b.vx, b.vy);
    const steps = Math.max(1, Math.ceil(sp / 1.5));
    const p = this.paddle;
    for (let i = 0; i < steps; i++) {
      // --- X axis ---
      b.x += b.vx / steps;
      if (b.x < FX) {
        b.x = FX;
        b.vx = Math.abs(b.vx);
        this.fixAngle(b);
        this.sfx.play('wall');
      } else if (b.x + BALL > FR) {
        b.x = FR - BALL;
        b.vx = -Math.abs(b.vx);
        this.fixAngle(b);
        this.sfx.play('wall');
      }
      this.collideBricks(b, 'x');
      // --- Y axis ---
      b.y += b.vy / steps;
      if (b.y < FY) {
        b.y = FY;
        b.vy = Math.abs(b.vy);
        this.fixAngle(b);
        this.sfx.play('wall');
      }
      this.collideBricks(b, 'y');

      // paddle
      if (b.vy > 0 && b.y + BALL >= PADDLE_Y && b.y + BALL <= PADDLE_Y + 6 && b.x + BALL > p.x && b.x < p.x + p.w) {
        b.y = PADDLE_Y - BALL;
        let off = (b.x + BALL / 2 - (p.x + p.w / 2)) / (p.w / 2);
        off = clamp(off, -1, 1);
        if (Math.abs(off) < 0.08) off = off < 0 ? -0.08 : 0.08;
        const ang = off * (Math.PI / 3);
        this.speed = Math.min(this.speed + 0.025, this.maxSpeed);
        b.vx = Math.sin(ang) * this.speed;
        b.vy = -Math.cos(ang) * this.speed;
        if (p.mode === 'catch') {
          b.stuck = true;
          b.off = b.x - p.x;
          this.stuckTimer = 0;
        }
        this.sfx.play('paddle');
      }

      // enemies
      for (const e of this.enemies) {
        if (e.dead) continue;
        if (overlap(b.x, b.y, BALL, BALL, e.x, e.y, e.w, e.h)) {
          this.killEnemy(e);
          const bc = b.y + BALL / 2;
          const ec = e.y + e.h / 2;
          b.vy = bc < ec ? -Math.abs(b.vy) : Math.abs(b.vy);
          this.fixAngle(b);
        }
      }

      // boss
      const bs = this.boss;
      if (bs && !bs.dying && overlap(b.x, b.y, BALL, BALL, bs.x, bs.y, bs.w, bs.h)) {
        const ox1 = b.x + BALL - bs.x;
        const ox2 = bs.x + bs.w - b.x;
        const oy1 = b.y + BALL - bs.y;
        const oy2 = bs.y + bs.h - b.y;
        const m = Math.min(ox1, ox2, oy1, oy2);
        if (m === oy1) {
          b.y = bs.y - BALL;
          b.vy = -Math.abs(b.vy);
        } else if (m === oy2) {
          b.y = bs.y + bs.h;
          b.vy = Math.abs(b.vy);
        } else if (m === ox1) {
          b.x = bs.x - BALL;
          b.vx = -Math.abs(b.vx);
        } else {
          b.x = bs.x + bs.w;
          b.vx = Math.abs(b.vx);
        }
        this.damageBoss(1);
      }

      if (b.stuck || b.y > H) break;
    }
  }

  private collideBricks(b: Ball, axis: 'x' | 'y') {
    const c0 = Math.floor((b.x - FX) / BW);
    const c1 = Math.floor((b.x + BALL - 0.001 - FX) / BW);
    const r0 = Math.floor((b.y - FY) / BH);
    const r1 = Math.floor((b.y + BALL - 0.001 - FY) / BH);
    let hc = -1;
    let hr = -1;
    for (let r = r0; r <= r1 && hc < 0; r++) {
      if (r < 0 || r >= ROWS) continue;
      for (let c = c0; c <= c1; c++) {
        if (c < 0 || c >= COLS) continue;
        if (this.grid[r * COLS + c].t) {
          hc = c;
          hr = r;
          break;
        }
      }
    }
    if (hc < 0) return;
    if (axis === 'x') {
      if (b.vx > 0) b.x = FX + hc * BW - BALL;
      else b.x = FX + (hc + 1) * BW;
      b.vx = -b.vx;
    } else {
      if (b.vy > 0) b.y = FY + hr * BH - BALL;
      else b.y = FY + (hr + 1) * BH;
      b.vy = -b.vy;
    }
    this.fixAngle(b);
    this.damageBrick(hc, hr);
  }

  damageBrick(c: number, r: number) {
    const cell = this.grid[r * COLS + c];
    const t = cell.t;
    if (!t) return;
    const info = BRICKS[t];
    if (info.hp === Infinity) {
      cell.flash = 3;
      this.sfx.play('bedrock');
      return;
    }
    cell.hp--;
    if (cell.hp > 0) {
      cell.flash = 4;
      this.sfx.play('hard');
      return;
    }
    cell.t = null;
    this.bricksLeft--;
    this.addScore(info.score + (t === 'R' ? this.level * 10 : 0));
    this.sfx.play('brick');
    const bx = FX + c * BW;
    const by = FY + r * BH;
    this.spawnParticles(bx + 8, by + 4, info.color, 6);
    this.maybeCapsule(bx, by);
  }

  private maybeCapsule(x: number, y: number) {
    if (this.balls.length > 1 || this.capsules.length > 0) return;
    if (Math.random() > 0.14) return;
    const kinds = POWER_KINDS.filter((k) => !(k === 'B' && (this.boss || this.exitOpen)) && !(k === 'P' && this.lives >= 6));
    const total = kinds.reduce((s, k) => s + POWERS[k].weight, 0);
    let r = Math.random() * total;
    let kind: PowerKind = 'E';
    for (const k of kinds) {
      r -= POWERS[k].weight;
      if (r <= 0) {
        kind = k;
        break;
      }
    }
    this.capsules.push({ x, y, kind, anim: 0 });
  }

  private updateCapsules() {
    const p = this.paddle;
    const vy = this.menu.hard ? 1.15 : 0.9;
    for (const c of this.capsules) {
      c.y += vy;
      c.anim++;
    }
    this.capsules = this.capsules.filter((c) => {
      if (overlap(c.x, c.y, 16, 8, p.x, PADDLE_Y, p.w, 8)) {
        this.applyPower(c.kind);
        return false;
      }
      return c.y < H;
    });
  }

  private setMode(mode: PaddleMode) {
    const p = this.paddle;
    const cx = p.x + p.w / 2;
    p.mode = mode;
    p.w = mode === 'expand' ? 48 : 32;
    p.x = clamp(cx - p.w / 2, FX, FR - p.w);
    if (mode !== 'catch') this.releaseBalls();
  }

  private applyPower(k: PowerKind) {
    this.addScore(1000);
    this.lastPower = k;
    this.message = POWERS[k].name;
    this.msgTimer = 110;
    switch (k) {
      case 'E':
        this.setMode('expand');
        this.sfx.play('capsule');
        break;
      case 'L':
        this.setMode('laser');
        this.sfx.play('capsule');
        break;
      case 'C':
        this.setMode('catch');
        this.sfx.play('capsule');
        break;
      case 'S':
        this.setMode('normal');
        this.setSpeed(Math.max(1.3, this.baseSpeed * 0.7));
        this.sfx.play('capsule');
        break;
      case 'D': {
        this.setMode('normal');
        const src = this.balls[0];
        if (src) {
          const sp = Math.hypot(src.vx, src.vy) || this.speed;
          const a = Math.atan2(src.vy, src.vx);
          for (const d of [-0.5, 0.5]) {
            this.balls.push({ x: src.x, y: src.y, vx: Math.cos(a + d) * sp, vy: Math.sin(a + d) * sp, stuck: false, off: 0 });
          }
        }
        this.sfx.play('capsule');
        break;
      }
      case 'P':
        this.lives++;
        this.sfx.play('1up');
        break;
      case 'B':
        this.setMode('normal');
        this.exitOpen = true;
        this.sfx.play('capsule');
        break;
    }
  }

  private updateSpears() {
    const keep: Spear[] = [];
    for (const s of this.spears) {
      s.y -= 4;
      if (s.y < FY) continue;
      let hit = false;
      const c = Math.floor((s.x + 1 - FX) / BW);
      const r = Math.floor((s.y - FY) / BH);
      if (c >= 0 && c < COLS && r >= 0 && r < ROWS && this.grid[r * COLS + c].t) {
        this.damageBrick(c, r);
        hit = true;
      }
      if (!hit) {
        for (const e of this.enemies) {
          if (!e.dead && overlap(s.x, s.y, 2, 6, e.x, e.y, e.w, e.h)) {
            this.killEnemy(e);
            hit = true;
            break;
          }
        }
      }
      if (!hit && this.boss && !this.boss.dying && overlap(s.x, s.y, 2, 6, this.boss.x, this.boss.y, this.boss.w, this.boss.h)) {
        this.damageBoss(1);
        hit = true;
      }
      if (!hit) {
        const fi = this.fireballs.findIndex((f) => overlap(s.x, s.y, 2, 6, f.x, f.y, 6, 6));
        if (fi >= 0) {
          this.spawnParticles(this.fireballs[fi].x + 3, this.fireballs[fi].y + 3, PAL.lorange, 6);
          this.fireballs.splice(fi, 1);
          this.addScore(200);
          this.sfx.play('enemy');
          hit = true;
        }
      }
      if (!hit) keep.push(s);
    }
    this.spears = keep;
  }

  // ---------- enemies ----------
  private maxEnemies() {
    if (this.level < 5) return 0;
    if (this.level < 13) return 1;
    if (this.level < 25) return 2;
    return 3;
  }

  private blocked(x: number, y: number, w: number, h: number) {
    const c0 = Math.floor((x - FX) / BW);
    const c1 = Math.floor((x + w - 0.001 - FX) / BW);
    const r0 = Math.floor((y - FY) / BH);
    const r1 = Math.floor((y + h - 0.001 - FY) / BH);
    for (let r = Math.max(0, r0); r <= Math.min(ROWS - 1, r1); r++)
      for (let c = Math.max(0, c0); c <= Math.min(COLS - 1, c1); c++) if (this.grid[r * COLS + c].t) return true;
    return false;
  }

  private updateEnemies(anyStuck: boolean) {
    const p = this.paddle;
    if (this.maxEnemies() > this.enemies.length && !anyStuck && !this.boss) {
      this.enemyTimer--;
      if (this.enemyTimer <= 0) {
        const side = Math.random() < 0.5 ? 0 : 1;
        const gx = side === 0 ? GATE_L : GATE_R;
        this.enemies.push({ x: gx + 2, y: FY - 10, w: 12, h: 10, vx: side === 0 ? 0.5 : -0.5, vy: 0.35, anim: 0, dead: 0, phase: Math.random() * 6.28 });
        this.gates[side] = 50;
        const base = Math.max(240, 760 - this.level * 11) * (this.menu.hard ? 0.7 : 1);
        this.enemyTimer = base + Math.random() * 150;
      }
    }
    for (const e of this.enemies) {
      e.anim++;
      if (e.dead !== 0) {
        if (e.dead > 0) e.dead--;
        if (e.dead === 0) e.dead = -1;
        continue;
      }
      const ny = e.y + e.vy;
      if (ny + e.h > FY && this.blocked(e.x, ny, e.w, e.h)) {
        const dir = e.vx < 0 ? -1 : 1;
        const nx = e.x + dir * 0.6;
        if (nx < FX || nx + e.w > FR || this.blocked(nx, e.y, e.w, e.h)) e.vx = -e.vx;
        else e.x = nx;
      } else {
        e.y = ny;
        const nx = e.x + Math.sin(e.anim / 30 + e.phase) * 0.7;
        if (nx >= FX && nx + e.w <= FR && !(nx + e.h > FY && this.blocked(nx, e.y, e.w, e.h))) e.x = nx;
      }
      if (overlap(e.x, e.y, e.w, e.h, p.x, PADDLE_Y, p.w, 8)) this.killEnemy(e);
    }
    // dead === -1 means the explosion finished; off-screen enemies are dropped too
    this.enemies = this.enemies.filter((e) => e.dead >= 0 && e.y < H);
  }

  private killEnemy(e: Enemy) {
    if (e.dead) return;
    e.dead = 20;
    this.addScore(100);
    this.sfx.play('enemy');
    this.spawnParticles(e.x + e.w / 2, e.y + e.h / 2, PAL.lorange, 8);
  }

  // ---------- boss ----------
  private updateBoss(anyStuck: boolean) {
    const b = this.boss!;
    if (b.dying > 0) {
      b.dying--;
      if (b.dying % 5 === 0) {
        const cols = [PAL.orange, PAL.yellow, PAL.white, PAL.lgreen];
        this.spawnParticles(b.x + Math.random() * b.w, b.y + Math.random() * b.h, cols[Math.floor(Math.random() * cols.length)], 10, 2);
        this.sfx.play('enemy');
      }
      if (b.dying === 0) {
        this.boss = null;
        this.addScore(10000);
        this.levelCleared();
      }
      return;
    }
    if (b.flash > 0) b.flash--;
    if (b.cd > 0) b.cd--;
    b.x += b.dir * 0.3;
    if (b.x < FX + 20) {
      b.x = FX + 20;
      b.dir = 1;
    } else if (b.x + b.w > FR - 20) {
      b.x = FR - 20 - b.w;
      b.dir = -1;
    }
    if (!anyStuck) {
      b.fire--;
      if (b.fire <= 0) {
        const sx = b.x + b.w / 2 - 3;
        const sy = b.y + b.h - 6;
        const tx = this.paddle.x + this.paddle.w / 2 - 3;
        const dx = tx - sx;
        const dy = PADDLE_Y - sy;
        const m = Math.hypot(dx, dy) || 1;
        const sp = this.menu.hard ? 1.7 : 1.35;
        this.fireballs.push({ x: sx, y: sy, vx: (dx / m) * sp, vy: (dy / m) * sp });
        this.sfx.play('fire');
        b.fire = Math.max(75, 190 - (b.max - b.hp) * 5) * (this.menu.hard ? 0.75 : 1);
      }
    }
    const p = this.paddle;
    for (const f of this.fireballs) {
      f.x += f.vx;
      f.y += f.vy;
      if (overlap(f.x, f.y, 6, 6, p.x, PADDLE_Y, p.w, 8)) {
        this.fireballs = [];
        this.startDying();
        return;
      }
    }
    this.fireballs = this.fireballs.filter((f) => f.y < H && f.x > FX - 6 && f.x < FR);
  }

  private damageBoss(n: number) {
    const b = this.boss;
    if (!b || b.cd > 0 || b.dying) return;
    b.hp -= n;
    b.flash = 8;
    b.cd = 8;
    this.addScore(500);
    this.sfx.play('boss');
    this.spawnParticles(b.x + b.w / 2, b.y + b.h / 2, PAL.lgreen, 5);
    if (b.hp <= 0) {
      b.hp = 0;
      b.dying = 160;
      this.fireballs = [];
      this.sfx.play('bossdie');
    }
  }

  // ---------- life / level flow ----------
  private startDying() {
    this.state = 'dying';
    this.timer = 0;
    this.sfx.play('lose');
    this.spawnParticles(this.paddle.x + this.paddle.w / 2, PADDLE_Y + 4, PAL.cream, 24, 2.2);
    this.spears = [];
    this.capsules = [];
    this.fireballs = [];
    this.enemies = [];
    this.balls = [];
  }

  private updateDying() {
    this.timer++;
    if (this.timer === 100) {
      this.lives--;
      if (this.lives <= 0) {
        this.state = 'gameover';
        this.timer = 0;
        this.saveHi();
        this.sfx.play('gameover');
      } else {
        this.resetPaddle();
        this.state = 'intro';
        this.timer = 0;
        this.introLen = 90;
      }
    }
  }

  private levelCleared() {
    this.state = 'clear';
    this.timer = 0;
    this.sfx.play('clear');
    this.balls = [];
    this.spears = [];
    this.capsules = [];
    this.fireballs = [];
    this.enemies = [];
  }

  private updateClear() {
    this.timer++;
    if (this.timer >= 170) {
      if (this.level >= TOTAL_LEVELS) {
        this.saveHi();
        this.state = 'ending';
        this.timer = 0;
      } else {
        this.level++;
        this.loadLevel();
        this.state = 'intro';
        this.timer = 0;
        this.introLen = 150;
        this.sfx.play('start');
      }
    }
  }

  private updateParticles() {
    for (const p of this.particles) {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.08;
      p.life--;
    }
    this.particles = this.particles.filter((p) => p.life > 0 && p.y < H);
  }

  // exposed for the renderer
  get world() {
    return worldOf(this.level);
  }
  get exitRect() {
    return { x: FR, y: EXIT_Y, w: 8, h: EXIT_H };
  }
  get gateRects() {
    return [
      { x: GATE_L, w: GATE_W },
      { x: GATE_R, w: GATE_W },
    ];
  }
}
