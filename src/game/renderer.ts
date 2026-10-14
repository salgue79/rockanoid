import { W, H, FX, FY, FR, FW, COLS, ROWS, BW, BH, PADDLE_Y, PAL, BRICKS, PowerKind, POWERS, POWER_KINDS } from './defs';
import { WORLDS, LEVEL_NAMES, worldOf } from './levels';
import { drawText, drawTextCentered, makeStoneText } from './font';
import {
  brickSprite, paddleSprite, ballSprite, capsuleSprite, enemySprite, bossSprite, bossFlashSprite, fireballSprite,
  pteroSprite, sauropodSprite, tileCanvas, mkCanvas, cached, flameSprite,
} from './sprites';
import type { Game } from './game';

const pad = (n: number, w: number) => String(Math.max(0, Math.floor(n))).padStart(w, '0');
const CX = FX + FW / 2;

export class Renderer {
  private g: CanvasRenderingContext2D;

  constructor(canvas: HTMLCanvasElement) {
    canvas.width = W;
    canvas.height = H;
    this.g = canvas.getContext('2d')!;
    this.g.imageSmoothingEnabled = false;
  }

  private rect(x: number, y: number, w: number, h: number, col: string) {
    this.g.fillStyle = col;
    this.g.fillRect(x, y, w, h);
  }

  private panel(x: number, y: number, w: number, h: number) {
    this.rect(x, y, w, h, PAL.black);
    this.rect(x, y, w, 1, PAL.grey);
    this.rect(x, y + h - 1, w, 1, PAL.dgrey);
    this.rect(x, y, 1, h, PAL.grey);
    this.rect(x + w - 1, y, 1, h, PAL.dgrey);
    this.rect(x + 1, y + 1, w - 2, 1, PAL.dgrey);
    this.rect(x + 1, y + 1, 1, h - 2, PAL.dgrey);
  }

  // ---------- static frame per world ----------
  private frameCanvas(world: number) {
    return cached(`frame:${world}`, () => {
      const [c, g] = mkCanvas(W, H);
      const wi = WORLDS[world];
      g.fillStyle = PAL.black;
      g.fillRect(0, 0, W, H);
      const tile = tileCanvas(wi.tile, String(world));
      for (let y = FY; y < H; y += 16) for (let x = FX; x < FR; x += 16) g.drawImage(tile, x, y);
      g.fillStyle = PAL.black;
      g.fillRect(FR, FY, W - FR, H - FY);
      const [base, hi, lo] = wi.wall;
      const block = (x: number, y: number, alt: boolean) => {
        g.fillStyle = base;
        g.fillRect(x, y, 8, 8);
        g.fillStyle = hi;
        g.fillRect(x, y, 8, 1);
        g.fillRect(x, y, 1, 8);
        g.fillStyle = lo;
        g.fillRect(x, y + 7, 8, 1);
        g.fillRect(x + 7, y, 1, 8);
        if (alt) {
          g.fillRect(x + 3, y + 3, 1, 1);
          g.fillRect(x + 5, y + 5, 1, 1);
        } else {
          g.fillStyle = hi;
          g.fillRect(x + 4, y + 3, 1, 1);
        }
      };
      for (let x = 0; x < 224; x += 8) block(x, 16, (x >> 3) % 2 === 0);
      for (let y = 16; y < H; y += 8) {
        block(0, y, (y >> 3) % 2 === 1);
        block(216, y, (y >> 3) % 2 === 0);
      }
      // right panel: dark stone tablet
      g.fillStyle = PAL.black;
      g.fillRect(224, 16, 32, H - 16);
      g.fillStyle = PAL.dgrey;
      g.fillRect(224, 16, 32, 1);
      g.fillRect(224, H - 1, 32, 1);
      g.fillRect(255, 16, 1, H - 16);
      g.fillRect(226, 44, 28, 1);
      g.fillRect(226, 96, 28, 1);
      g.fillRect(226, 140, 28, 1);
      // top bar separator
      g.fillStyle = PAL.dgrey;
      g.fillRect(0, 15, W, 1);
      return c;
    });
  }

  // ---------- public ----------
  render(game: Game) {
    switch (game.state) {
      case 'title':
        this.drawTitle(game);
        break;
      case 'menu':
        this.drawTitle(game);
        this.drawMenu(game);
        break;
      case 'howto':
        this.drawHowto(game);
        break;
      case 'ending':
        this.drawEnding(game);
        break;
      default:
        this.drawGame(game);
    }
  }

  // ---------- gameplay ----------
  private drawGame(game: Game) {
    const g = this.g;
    const t = game.frame;
    const world = game.world;
    g.drawImage(this.frameCanvas(world), 0, 0);

    // gates
    game.gateRects.forEach((gr, i) => {
      if (game.gates[i] > 0) {
        this.rect(gr.x, FY - 8, gr.w, 8, PAL.black);
        this.rect(gr.x, FY - 8, 1, 8, PAL.lorange);
        this.rect(gr.x + gr.w - 1, FY - 8, 1, 8, PAL.lorange);
      }
    });
    // secret exit
    if (game.exitOpen) {
      const e = game.exitRect;
      this.rect(e.x, e.y, e.w, e.h, PAL.black);
      this.rect(e.x, e.y, e.w, 1, PAL.yellow);
      this.rect(e.x, e.y + e.h - 1, e.w, 1, PAL.yellow);
      if ((t >> 3) & 1) drawText(g, '>', e.x + 1, e.y + 10, PAL.yellow);
    }

    // bricks
    const lf = (t >> 4) & 1;
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const cell = game.grid[r * COLS + c];
        if (!cell.t) continue;
        const info = BRICKS[cell.t];
        const dmg = info.hp === Infinity ? 0 : Math.max(0, cell.max - cell.hp);
        const x = FX + c * BW;
        const y = FY + r * BH;
        g.drawImage(brickSprite(cell.t, dmg, cell.t === 'L' ? lf : 0), x, y);
        if (cell.flash > 0) this.rect(x, y, BW, BH, PAL.white);
      }
    }

    // boss
    if (game.boss) {
      const b = game.boss;
      const flash = b.flash > 0 && (t & 2) !== 0;
      const visible = !(b.dying > 0 && (t & 2) !== 0);
      if (visible) g.drawImage(flash ? bossFlashSprite() : bossSprite(), Math.round(b.x), Math.round(b.y));
      if (b.dying === 0 && !flash && ((t >> 4) & 1) === 0) {
        // eye glint
        this.rect(Math.round(b.x) + 10, Math.round(b.y) + 9, 1, 1, PAL.white);
        this.rect(Math.round(b.x) + 29, Math.round(b.y) + 9, 1, 1, PAL.white);
      }
    }

    // capsules
    for (const c of game.capsules) g.drawImage(capsuleSprite(c.kind, (c.anim >> 3) & 3), Math.round(c.x), Math.round(c.y));

    // enemies
    const kind = WORLDS[world].enemy;
    for (const e of game.enemies) {
      if (e.dead > 0) {
        const k = 20 - e.dead;
        const r = k * 0.7;
        const cx = e.x + e.w / 2;
        const cy = e.y + e.h / 2;
        const col = k < 6 ? PAL.white : k < 13 ? PAL.yellow : PAL.orange;
        for (let i = 0; i < 8; i++) {
          const a = (i * Math.PI) / 4 + k * 0.1;
          this.rect(Math.round(cx + Math.cos(a) * r), Math.round(cy + Math.sin(a) * r), 2, 2, col);
        }
      } else if (e.dead === 0) {
        g.drawImage(enemySprite(kind, (e.anim >> 3) & 1), Math.round(e.x), Math.round(e.y));
      }
    }

    // spears
    for (const s of game.spears) {
      this.rect(s.x, s.y, 2, 6, PAL.lorange);
      this.rect(s.x, s.y, 2, 1, PAL.lyellow);
      this.rect(s.x, s.y + 5, 2, 1, PAL.dred);
    }
    // fireballs
    for (const f of game.fireballs) g.drawImage(fireballSprite((t >> 2) & 1), Math.round(f.x), Math.round(f.y));

    // paddle & balls
    if (game.state !== 'dying') {
      const p = game.paddle;
      g.drawImage(paddleSprite(p.w, p.mode), Math.round(p.x), PADDLE_Y);
      for (const b of game.balls) g.drawImage(ballSprite(), Math.round(b.x), Math.round(b.y));
    }

    // particles
    for (const p of game.particles) this.rect(Math.round(p.x), Math.round(p.y), p.s, p.s, p.color);

    this.drawHUD(game);
    this.drawOverlays(game);
  }

  private drawHUD(game: Game) {
    const g = this.g;
    const t = game.frame;
    drawText(g, 'SCORE', 8, 4, PAL.lorange);
    drawText(g, pad(game.score, 7), 56, 4, PAL.white);
    if (game.boss) {
      drawText(g, 'REX', 128, 4, PAL.lgreen);
      this.rect(152, 4, 64, 7, PAL.dgrey);
      this.rect(153, 5, 62, 5, PAL.maroon);
      const w = Math.round((62 * game.boss.hp) / game.boss.max);
      if (w > 0) {
        this.rect(153, 5, w, 5, PAL.green);
        this.rect(153, 5, w, 1, PAL.lgreen);
      }
    } else {
      drawText(g, 'HI', 136, 4, PAL.lorange);
      drawText(g, pad(game.hi, 7), 160, 4, PAL.white);
    }

    // right panel
    drawText(g, 'RND', 228, 22, PAL.lorange);
    drawText(g, pad(game.level, 2), 232, 32, PAL.white);

    const spare = Math.max(0, game.lives - 1);
    for (let i = 0; i < Math.min(spare, 4); i++) g.drawImage(paddleSprite(16, 'normal'), 232, 50 + i * 10);
    if (spare > 4) drawText(g, '+' + Math.min(9, spare - 4), 232, 88, PAL.white);
    if (spare === 0 && ((t >> 4) & 1)) drawText(g, '!', 237, 60, PAL.red);

    const mode = game.paddle.mode;
    if (mode !== 'normal') {
      const k: PowerKind = mode === 'expand' ? 'E' : mode === 'laser' ? 'L' : 'C';
      g.drawImage(capsuleSprite(k, (t >> 3) & 3), 232, 104);
    }
    drawText(g, 'Z' + (game.world + 1), 232, 124, PAL.grey);
    this.campfire(t);
  }

  private campfire(t: number) {
    const g = this.g;
    // glow
    if ((t >> 3) & 1) this.rect(230, 170, 20, 12, PAL.maroon);
    // logs
    this.rect(229, 181, 22, 3, PAL.brown);
    this.rect(229, 181, 22, 1, PAL.tan);
    this.rect(232, 184, 16, 3, PAL.maroon);
    this.rect(232, 184, 16, 1, PAL.brown);
    // flame
    g.drawImage(flameSprite((t >> 3) & 1), 236, 171);
    // sparks
    const s1 = (t * 3) % 24;
    const s2 = (t * 3 + 12) % 24;
    this.rect(236 + ((t >> 2) % 7), 170 - s1, 1, 1, s1 < 12 ? PAL.yellow : PAL.orange);
    this.rect(243 - ((t >> 3) % 5), 170 - s2, 1, 1, s2 < 12 ? PAL.lyellow : PAL.dred);
  }

  private drawOverlays(game: Game) {
    const g = this.g;
    const t = game.frame;
    const blink = ((t >> 3) & 1) === 1;

    if (game.msgTimer > 0 && game.state === 'play' && game.lastPower) {
      drawTextCentered(g, '¡' + POWERS[game.lastPower].name + '!', CX, 148, blink ? PAL.yellow : PAL.white, { shadow: PAL.black });
    }

    switch (game.state) {
      case 'intro': {
        const zone = game.world + 1;
        if (game.introLen > 100) {
          this.panel(FX + 12, 68, FW - 24, 68);
          drawTextCentered(g, `ZONA ${zone}`, CX, 74, PAL.lorange);
          drawTextCentered(g, WORLDS[game.world].name, CX, 84, PAL.white);
          drawTextCentered(g, `RONDA ${pad(game.level, 2)}`, CX, 99, PAL.lorange);
          drawTextCentered(g, LEVEL_NAMES[game.level - 1], CX, 109, PAL.white);
          if (blink) drawTextCentered(g, '¡PREPARADO!', CX, 124, PAL.yellow);
        } else {
          this.panel(FX + 48, 88, FW - 96, 22);
          if (blink) drawTextCentered(g, '¡PREPARADO!', CX, 95, PAL.yellow);
        }
        break;
      }
      case 'paused':
        this.panel(FX + 40, 82, FW - 80, 36);
        drawTextCentered(g, 'PAUSA', CX, 89, PAL.white);
        drawTextCentered(g, 'Q: SALIR', CX, 103, PAL.grey);
        break;
      case 'gameover':
        this.panel(FX + 24, 82, FW - 48, 36);
        drawTextCentered(g, 'GAME OVER', CX, 90, PAL.red, { scale: 2 });
        break;
      case 'clear': {
        this.panel(FX + 20, 84, FW - 40, 30);
        const msg = game.level === 40 ? '¡T-REX DERROTADO!' : '¡RONDA SUPERADA!';
        drawTextCentered(g, msg, CX, 91, blink ? PAL.yellow : PAL.white);
        if (game.level < 40) drawTextCentered(g, 'AVANZANDO...', CX, 103, PAL.grey);
        else drawTextCentered(g, '¡ERES LA LEYENDA!', CX, 103, PAL.lgreen);
        break;
      }
    }
  }

  // ---------- title scenery ----------
  private tri(cx: number, hw: number, h: number, baseY: number, col: string) {
    for (let i = 0; i < h; i++) {
      const w = Math.max(1, Math.floor((hw * (i + 1)) / h));
      this.rect(cx - w, baseY - h + i, w * 2, 1, col);
    }
  }

  private palm(x: number, baseY: number, h: number, dir: number, t: number) {
    for (let i = 0; i < h; i++) {
      const ox = Math.round((dir * i * i) / (h * 5));
      this.rect(x + ox, baseY - i, 3, 1, PAL.black);
    }
    const topX = x + Math.round((dir * h * h) / (h * 5)) + 1;
    const topY = baseY - h;
    const sway = Math.round(Math.sin(t / 30 + x) * 1);
    const fronds: [number, number, number][] = [
      [-1, 0, 14], [1, 0, 14], [-1, -0.4, 10], [1, -0.4, 10], [0, -1, 5], [-0.7, 0.4, 9], [0.7, 0.4, 9],
    ];
    for (const [dx, dy, len] of fronds) {
      for (let i = 0; i < len; i++) {
        const px = topX + Math.round(dx * i) + sway;
        const py = topY + Math.round(dy * i + (i * i) / (len * 1.3)) - 3;
        this.rect(px, py, 2, 1, PAL.black);
      }
    }
  }

  private drawScene(t: number) {
    const g = this.g;
    const bands: [number, number, string][] = [
      [0, 24, PAL.dblue], [24, 46, PAL.violet], [46, 68, PAL.purple], [68, 88, PAL.dred],
      [88, 106, PAL.orange], [106, 122, PAL.lorange], [122, 136, PAL.lyellow],
    ];
    for (const [y0, y1, c] of bands) this.rect(0, y0, W, y1 - y0, c);
    const stars = [
      [12, 6], [40, 14], [70, 4], [100, 10], [130, 16], [160, 6], [190, 12], [220, 8], [240, 18],
      [28, 30], [90, 34], [150, 28], [210, 36], [60, 40], [180, 42], [245, 32], [8, 44],
    ];
    stars.forEach(([x, y], i) => {
      if (((t >> 4) + i) % 6 !== 0) this.rect(x, y, 1, 1, i % 3 === 0 ? PAL.white : PAL.lslate);
    });
    // sun
    for (let dy = -24; dy < 0; dy++) {
      const hw = Math.floor(Math.sqrt(24 * 24 - dy * dy));
      const y = 136 + dy;
      const stripe = dy > -12 && ((y >> 1) & 1) === 1;
      this.rect(188 - hw, y, hw * 2, 1, stripe ? PAL.lorange : PAL.yellow);
    }
    // distant mountains
    this.tri(150, 42, 18, 136, PAL.dpurple);
    this.tri(205, 30, 12, 136, PAL.dpurple);
    this.tri(112, 26, 10, 136, PAL.dpurple);
    this.tri(242, 36, 16, 136, PAL.dpurple);
    // volcano
    this.tri(50, 80, 80, 136, PAL.black);
    this.rect(44, 56, 13, 1, PAL.black);
    this.rect(46, 55, 9, 1, PAL.orange);
    this.rect(48, 54, 5, 1, PAL.red);
    if ((t >> 2) & 1) this.rect(49, 53, 3, 1, PAL.yellow);
    for (let i = 0; i < 30; i++) {
      const x = 51 + Math.floor(i * 1.5);
      const y = 58 + i * 2;
      this.rect(x, y, 2, 2, (i + (t >> 3)) % 3 === 0 ? PAL.yellow : PAL.orange);
    }
    // smoke
    for (let i = 0; i < 4; i++) {
      const ph = (t * 0.35 + i * 22) % 88;
      const cy = Math.round(52 - ph);
      const cx = Math.round(50 + Math.sin(t / 40 + i * 1.7) * 3 + ph * 0.2);
      const r = 2 + Math.floor(ph / 25);
      if (cy - r < 1) continue;
      for (let dy = -r; dy <= r; dy++) {
        const hw = Math.floor(Math.sqrt(r * r - dy * dy));
        this.rect(cx - hw, cy + dy, hw * 2 + 1, 1, PAL.dgrey);
      }
      this.rect(cx - 1, cy - 1, 1, 1, PAL.grey);
    }
    // ground
    this.rect(0, 136, W, H - 136, PAL.black);
    this.rect(0, 136, W, 1, PAL.maroon);
    // dinosaur
    g.drawImage(sauropodSprite(), 112, 108 + ((t >> 5) & 1));
    // palms
    this.palm(228, 136, 46, 1, t);
    this.palm(246, 136, 32, -1, t + 40);
    this.palm(6, 136, 26, -1, t + 80);
    // pterodactyls
    for (let i = 0; i < 3; i++) {
      const x = ((t * 0.5 + i * 110) % 330) - 40;
      const y = 44 + i * 16 + Math.round(Math.sin(t / 25 + i * 2) * 3);
      g.drawImage(pteroSprite(((t >> 3) + i) & 1), Math.round(x), y);
    }
  }

  private drawTitle(game: Game) {
    const g = this.g;
    const t = game.frame;
    this.drawScene(t);
    const logo = cached('logo', () => makeStoneText('ROCKANOID', 3));
    g.drawImage(logo, Math.round((W - logo.width) / 2), 10);
    drawTextCentered(g, 'LA ERA DE PIEDRA', W / 2, 38, PAL.yellow, { shadow: PAL.maroon });
    if (game.state === 'title') {
      if ((t >> 4) & 1) drawTextCentered(g, 'PULSA ENTER', W / 2, 150, PAL.white);
      drawTextCentered(g, 'HI-SCORE ' + pad(game.hi, 7), W / 2, 166, PAL.lorange);
      drawTextCentered(g, '(C) 2026 PHYSICAL DREAMS', W / 2, 180, PAL.grey);
    }
  }

  private drawMenu(game: Game) {
    const g = this.g;
    const t = game.frame;
    const m = game.menu;
    this.panel(40, 54, 176, 112);
    const items = [
      'COMENZAR',
      `RONDA  < ${pad(m.startLevel, 2)} >`,
      `MODO   ${m.hard ? 'DIFICIL' : 'NORMAL'}`,
      `SONIDO ${game.sfx.enabled ? 'SI' : 'NO'}`,
      'COMO JUGAR',
    ];
    items.forEach((it, i) => {
      const sel = i === m.index;
      const y = 64 + i * 15;
      if (sel) {
        drawText(g, '>', 52, y, (t >> 3) & 1 ? PAL.yellow : PAL.lorange);
        g.drawImage(ballSprite(), 60, y + 2);
      }
      drawText(g, it, 68, y, sel ? PAL.white : PAL.grey);
    });
    const zone = worldOf(m.startLevel);
    drawTextCentered(g, `ZONA ${zone + 1}: ${WORLDS[zone].name}`, W / 2, 142, PAL.lorange);
    drawTextCentered(g, LEVEL_NAMES[m.startLevel - 1], W / 2, 153, PAL.lgreen);
    drawTextCentered(g, 'ENTER: OK   ESC: VOLVER', W / 2, 174, PAL.dgrey);
  }

  private drawHowto(game: Game) {
    const g = this.g;
    const t = game.frame;
    this.rect(0, 0, W, H, PAL.black);
    this.panel(4, 4, W - 8, H - 8);
    drawTextCentered(g, 'COMO JUGAR', W / 2, 10, PAL.yellow);
    drawText(g, 'MOVER: FLECHAS, A/D O RATON', 16, 24, PAL.white);
    drawText(g, 'LANZAR/DISPARAR: ESPACIO', 16, 35, PAL.white);
    drawText(g, 'PAUSA: P O ESC   SONIDO: M', 16, 46, PAL.white);
    drawText(g, 'HUEVOS MAGICOS:', 16, 58, PAL.lorange);
    POWER_KINDS.forEach((k, i) => {
      const y = 69 + i * 11;
      g.drawImage(capsuleSprite(k, (t >> 3) & 3), 16, y);
      drawText(g, POWERS[k].name, 40, y, PAL.white);
      drawText(g, POWERS[k].desc, 160, y, PAL.grey, { spacing: 6 });
    });
    g.drawImage(brickSprite('X', 0, 0), 16, 152);
    drawText(g, '= OBSIDIANA, INDESTRUCTIBLE', 36, 152, PAL.lgreen);
    drawText(g, 'ROMPE EL RESTO DE BLOQUES', 16, 163, PAL.lgreen);
    if ((t >> 4) & 1) drawTextCentered(g, 'PULSA ENTER', W / 2, 176, PAL.yellow);
  }

  private drawEnding(game: Game) {
    const g = this.g;
    const t = game.frame;
    this.drawScene(t);
    this.panel(16, 44, 224, 116);
    drawTextCentered(g, '¡LO LOGRASTE!', W / 2, 52, PAL.yellow, { shadow: PAL.maroon });
    drawTextCentered(g, 'EL T-REX HA SIDO DERROTADO', W / 2, 68, PAL.white);
    drawTextCentered(g, 'Y LA ERA DE PIEDRA', W / 2, 80, PAL.white);
    drawTextCentered(g, 'VUELVE A ESTAR EN PAZ.', W / 2, 92, PAL.white);
    drawTextCentered(g, 'PUNTUACION FINAL', W / 2, 112, PAL.lorange);
    drawTextCentered(g, pad(game.score, 7), W / 2, 124, PAL.white);
    drawTextCentered(g, 'GRACIAS POR JUGAR', W / 2, 142, PAL.lgreen);
    if ((t >> 4) & 1) drawTextCentered(g, 'PULSA ENTER', W / 2, 170, PAL.white);
  }
}
