import { CH, PAL, BRICKS, BrickType, POWERS, PowerKind, BW, BH, PaddleMode } from './defs';

const cache = new Map<string, HTMLCanvasElement>();

export function mkCanvas(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const g = c.getContext('2d')!;
  g.imageSmoothingEnabled = false;
  return [c, g];
}

export function cached(key: string, make: () => HTMLCanvasElement): HTMLCanvasElement {
  let c = cache.get(key);
  if (!c) {
    c = make();
    cache.set(key, c);
  }
  return c;
}

export function makeSprite(rows: string[], map: Record<string, string> = {}): HTMLCanvasElement {
  const h = rows.length;
  const w = Math.max(...rows.map((r) => r.length));
  const [c, g] = mkCanvas(w, h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < rows[y].length; x++) {
      const ch = rows[y][x];
      if (ch === '.' || ch === ' ') continue;
      const col = map[ch] ?? CH[ch];
      if (!col) continue;
      g.fillStyle = col;
      g.fillRect(x, y, 1, 1);
    }
  }
  return c;
}

export const mirrorRows = (rows: string[]) => rows.map((r) => r + r.split('').reverse().join(''));

// ---------- Bricks ----------
export function brickSprite(t: BrickType, dmg: number, frame: number): HTMLCanvasElement {
  return cached(`brick:${t}:${dmg}:${frame}`, () => {
    const [c, g] = mkCanvas(BW, BH);
    const px = (x: number, y: number, col: string) => {
      g.fillStyle = col;
      g.fillRect(x, y, 1, 1);
    };
    const rect = (x: number, y: number, w: number, h: number, col: string) => {
      g.fillStyle = col;
      g.fillRect(x, y, w, h);
    };
    const pts = (list: number[][], col: string) => list.forEach(([x, y]) => px(x, y, col));
    const bevel = (base: string, hi: string, lo: string) => {
      rect(0, 0, 16, 8, base);
      rect(0, 0, 16, 1, hi);
      rect(0, 0, 1, 8, hi);
      rect(0, 7, 16, 1, lo);
      rect(15, 0, 1, 8, lo);
    };
    const P = PAL;
    switch (t) {
      case 'S':
        bevel(P.grey, P.white, P.dgrey);
        pts([[4, 2], [9, 4], [12, 2], [6, 5], [2, 5], [13, 5]], P.dgrey);
        pts([[5, 2], [10, 3], [3, 4]], P.white);
        break;
      case 'M':
        bevel(P.brown, P.tan, P.maroon);
        pts([[3, 2], [4, 3], [5, 3], [6, 4], [7, 4], [10, 1], [10, 2], [11, 3], [12, 4], [12, 5], [8, 6]], P.maroon);
        pts([[2, 5], [8, 2], [13, 2], [5, 6]], P.tan);
        break;
      case 'G':
        bevel(P.green, P.lgreen, P.dgreen);
        for (let i = 0; i < 10; i++) px(3 + i, 5 - Math.floor(i / 2), P.lgreen);
        pts([[5, 6], [8, 5], [11, 4], [6, 2], [9, 1], [13, 3]], P.dgreen);
        break;
      case 'W':
        bevel(P.tan, P.cream, P.brown);
        rect(2, 2, 8, 1, P.brown);
        rect(6, 5, 8, 1, P.brown);
        rect(1, 4, 4, 1, P.brown);
        pts([[11, 2], [12, 2], [11, 3], [12, 3]], P.brown);
        px(11, 3, P.maroon);
        break;
      case 'B':
        bevel(P.dgrey, P.grey, P.black);
        rect(3, 3, 10, 2, P.cream);
        rect(1, 2, 3, 4, P.cream);
        rect(12, 2, 3, 4, P.cream);
        pts([[2, 1], [13, 1], [2, 6], [13, 6]], P.cream);
        rect(4, 3, 8, 1, P.white);
        pts([[2, 2], [13, 2]], P.white);
        pts([[2, 5], [13, 5], [1, 4], [14, 4]], P.grey);
        break;
      case 'E':
        rect(3, 0, 10, 1, P.cream);
        rect(1, 1, 14, 1, P.cream);
        rect(0, 2, 16, 4, P.cream);
        rect(1, 6, 14, 1, P.sand);
        rect(3, 7, 10, 1, P.sand);
        rect(15, 2, 1, 4, P.sand);
        rect(3, 1, 5, 1, P.white);
        px(2, 2, P.white);
        pts([[4, 3], [5, 3], [4, 4], [9, 2], [10, 2], [11, 5], [12, 4], [7, 5], [13, 2]], P.olive);
        break;
      case 'A':
        bevel(P.lorange, P.lyellow, P.brown);
        rect(2, 2, 3, 1, P.yellow);
        px(2, 3, P.yellow);
        rect(8, 3, 2, 2, P.maroon);
        pts([[7, 2], [10, 2], [7, 5], [10, 5], [6, 4], [11, 4]], P.maroon);
        pts([[12, 6], [13, 5]], P.brown);
        break;
      case 'L': {
        bevel(P.dred, P.orange, P.maroon);
        const hot = frame ? P.yellow : P.lorange;
        const hot2 = frame ? P.lorange : P.yellow;
        [[2, 4], [3, 3], [4, 3], [5, 4], [6, 5], [7, 4], [8, 3], [9, 3], [10, 4], [11, 5], [12, 5], [13, 4]].forEach(([x, y], i) =>
          px(x, y, i % 2 ? hot : hot2),
        );
        pts([[5, 1], [11, 2], [9, 6], [3, 6]], P.orange);
        pts([[7, 6], [12, 1]], P.black);
        break;
      }
      case 'I':
        bevel(P.ice, P.white, P.sky);
        pts([[2, 5], [3, 4], [4, 3], [5, 2], [9, 6], [10, 5], [11, 4], [12, 3], [13, 2]], P.white);
        pts([[4, 5], [12, 5], [7, 2], [10, 2]], P.sky);
        break;
      case 'F':
        bevel(P.slate, P.lslate, P.dblue);
        pts([[6, 2], [7, 2], [8, 2], [9, 2], [10, 3], [10, 4], [9, 5], [8, 5], [7, 5], [6, 4], [8, 4], [5, 5], [4, 6], [3, 6]], P.lslate);
        pts([[12, 2], [13, 3], [2, 2]], P.dblue);
        break;
      case 'R':
        bevel(P.dgrey, P.grey, P.black);
        rect(3, 2, 3, 1, P.grey);
        px(3, 3, P.grey);
        rect(10, 4, 3, 1, P.grey);
        px(12, 5, P.grey);
        px(8, 2, P.grey);
        pts([[7, 1], [13, 6], [2, 6]], P.black);
        if (dmg >= 1) pts([[6, 1], [7, 2], [7, 3], [8, 4], [8, 5], [9, 6]], P.black);
        if (dmg >= 2) pts([[13, 1], [12, 2], [12, 3], [11, 4], [11, 5], [10, 6], [3, 4], [4, 5], [4, 6]], P.black);
        break;
      case 'D':
        bevel(P.purple, P.lpurple, P.violet);
        pts([[1, 5], [2, 4], [3, 3], [4, 2], [5, 1]], P.lpurple);
        pts([[9, 6], [10, 5], [11, 4], [12, 3], [13, 2], [14, 1]], P.lpurple);
        pts([[3, 2], [4, 1], [12, 2]], P.white);
        rect(6, 6, 3, 1, P.violet);
        pts([[7, 4], [8, 5]], P.violet);
        if (dmg >= 1) pts([[7, 1], [7, 2], [8, 3], [8, 4], [7, 5], [7, 6]], P.black);
        if (dmg >= 2) pts([[3, 6], [4, 5], [5, 4], [10, 1], [11, 2], [12, 4], [13, 5]], P.black);
        break;
      case 'X':
        bevel(P.dblue, P.slate, P.black);
        pts([[3, 2], [10, 5], [6, 5], [12, 2], [8, 3]], P.slate);
        pts([[4, 4], [9, 2], [13, 5]], P.lorange);
        pts([[7, 5], [2, 5], [11, 3]], P.lyellow);
        break;
    }
    return c;
  });
}

export const brickColor = (t: BrickType) => BRICKS[t].color;

// ---------- Paddle (a bone!) ----------
const KNOB = ['.333.', '3m113', '3m111', '3mmmm', '3mmmm', '3m222', '3m223', '.333.'];

export function paddleSprite(w: number, mode: PaddleMode): HTMLCanvasElement {
  return cached(`paddle:${w}:${mode}`, () => {
    const [c, g] = mkCanvas(w, 8);
    const knobMap: Record<string, string> =
      mode === 'laser'
        ? { '3': PAL.maroon, m: PAL.orange, '1': PAL.lyellow, '2': PAL.dred }
        : { '3': PAL.dgrey, m: PAL.cream, '1': PAL.white, '2': PAL.grey };
    const shaft = mode === 'catch' ? [PAL.lgreen, PAL.green, PAL.green, PAL.dgreen] : [PAL.white, PAL.cream, PAL.cream, PAL.grey];
    // shaft
    g.fillStyle = PAL.dgrey;
    g.fillRect(4, 1, w - 8, 1);
    g.fillRect(4, 6, w - 8, 1);
    for (let r = 0; r < 4; r++) {
      g.fillStyle = shaft[r];
      g.fillRect(4, 2 + r, w - 8, 1);
    }
    if (mode === 'catch') {
      g.fillStyle = PAL.lgreen;
      for (let x = 7; x < w - 6; x += 5) g.fillRect(x, 3, 1, 1);
    }
    // knobs
    for (let y = 0; y < 8; y++) {
      for (let x = 0; x < 5; x++) {
        const ch = KNOB[y][x];
        if (ch === '.') continue;
        g.fillStyle = knobMap[ch];
        g.fillRect(x, y, 1, 1);
        g.fillRect(w - 1 - x, y, 1, 1);
      }
    }
    if (mode === 'laser') {
      g.fillStyle = PAL.yellow;
      g.fillRect(2, 0, 1, 1);
      g.fillRect(w - 3, 0, 1, 1);
    }
    return c;
  });
}

// ---------- Ball (a round stone) ----------
export const ballSprite = () => cached('ball', () => makeSprite(['.21.', '2113', '2233', '.33.']));

// ---------- Power-up capsules (spotted eggs with letters) ----------
const MINI: Record<string, string[]> = {
  E: ['111', '100', '110', '100', '111'],
  L: ['100', '100', '100', '100', '111'],
  C: ['111', '100', '100', '100', '111'],
  S: ['111', '100', '111', '001', '111'],
  D: ['110', '101', '101', '101', '110'],
  P: ['111', '101', '111', '100', '100'],
  B: ['110', '101', '110', '101', '110'],
};

export function capsuleSprite(kind: PowerKind, frame: number): HTMLCanvasElement {
  return cached(`cap:${kind}:${frame}`, () => {
    const info = POWERS[kind];
    const [c, g] = mkCanvas(16, 8);
    for (let y = 0; y < 8; y++) {
      const inset = y === 0 || y === 7 ? 2 : y === 1 || y === 6 ? 1 : 0;
      g.fillStyle = y === 1 ? info.hi : y >= 6 ? info.lo : info.base;
      g.fillRect(inset, y, 16 - inset * 2, 1);
    }
    g.fillStyle = info.hi;
    g.fillRect(2, 2, 1, 1);
    g.fillStyle = info.lo;
    [[3, 4], [12, 3], [13, 5], [2, 5]].forEach(([x, y]) => g.fillRect(x, y, 1, 1));
    // shine sweep
    const sx = 1 + ((frame * 4) % 14);
    g.fillStyle = PAL.white;
    g.fillRect(sx, 2, 1, 1);
    g.fillRect(sx + 1, 1, 1, 1);
    // letter
    const gl = MINI[kind];
    for (let r = 0; r < 5; r++)
      for (let cc = 0; cc < 3; cc++) {
        if (gl[r][cc] !== '1') continue;
        g.fillStyle = PAL.black;
        g.fillRect(7 + cc, 2 + r, 1, 1);
        g.fillStyle = PAL.white;
        g.fillRect(6 + cc, 1 + r, 1, 1);
      }
    return c;
  });
}

// ---------- Enemies ----------
const FLYER = [
  ['WW........WW', '.WWW....WWW.', '..WWWBBWWW..', '....BOOB....', '....BBBB....', '.....BB.....', '.....BB.....', '............'],
  ['............', '.....BB.....', '....BOOB....', '....BBBB....', '..WWWBBWWW..', '.WWW....WWW.', 'WW........WW', '............'],
];

const FLAME = [
  ['...A....', '...A....', '..AAA...', '..ABA...', '.AABBA..', '.ABBBA..', '.ABCBA..', 'AABCBAA.', '.ABBBA..', '..AAA...'],
  ['....A...', '....A...', '...AAA..', '...ABA..', '..ABBA..', '.AABBBA.', '.ABCCBA.', '.ABCCBA.', '..ABBA..', '...AA...'],
];

const SKULL = ['..SSSS..', '.SSSSSS.', 'SSSSSSSS', 'SEESSEES', 'SEESSEES', 'SSSNNSSS', '.SSSSSS.', '..S.S.S.'];

export type EnemyKind = 'dragonfly' | 'bat' | 'flame' | 'ice' | 'skull';

export function enemySprite(kind: EnemyKind, frame: number): HTMLCanvasElement {
  return cached(`enemy:${kind}:${frame}`, () => {
    switch (kind) {
      case 'dragonfly':
        return makeSprite(FLYER[frame], { W: PAL.cyan, B: PAL.green, O: PAL.red });
      case 'bat':
        return makeSprite(FLYER[frame], { W: PAL.brown, B: PAL.maroon, O: PAL.yellow });
      case 'flame':
        return makeSprite(FLAME[frame], { A: PAL.orange, B: PAL.lorange, C: PAL.lyellow });
      case 'ice':
        return makeSprite(FLAME[frame], { A: PAL.sky, B: PAL.ice, C: PAL.white });
      case 'skull':
        return makeSprite(SKULL, { S: PAL.white, E: frame ? PAL.red : PAL.black, N: PAL.dgrey });
      default:
        return makeSprite(FLYER[frame]);
    }
  });
}

export const flameSprite = (frame: number) => enemySprite('flame', frame);

// ---------- Boss: T-REX ----------
const REX_HALF = [
  '..........cccccccccc',
  '........ccaaaaaaaaaa',
  '.......caaaaaaaaaaaa',
  '......caaaaaaaaaaaaa',
  '.....caaaaaaaabaaaaa',
  '.....caaaaaaabbbaaaa',
  '....caaaaaaaaabaaaaa',
  '....caaacccccaaaaaaa',
  '...caaac88888caaaaaa',
  '...caaac88008caaaaaa',
  '...caaac88008caaaaaa',
  '...caaac88888caaaaaa',
  '...caaaacccccaaaaaaa',
  '..caaaaaaaaaaaaaaaaa',
  '..caaaaaaaaaaaaaaaaa',
  '..caaaaaaaaaaaaaaaaa',
  '.caaaaaaaaaaaaaaa0aa',
  '.caaaaaaaaaaaaaa00aa',
  '.caaaaaaaaaaaaaaaaaa',
  '.ccaaaaaaaaaaaaaaaaa',
  '.ccccccccccccccccccc',
  '..c55555555555555555',
  '..c51555155515551555',
  '..c51555155515551555',
  '..c55555555555555555',
  '..c55554444444444444',
  '..c55554444444444444',
  '..c55555555555555555',
  '..c55155515551555155',
  '..c55155515551555155',
  '..cccccccccccccccccc',
  '...ccccccccccccccccc',
];

export const bossSprite = () => cached('boss', () => makeSprite(mirrorRows(REX_HALF)));
export const bossFlashSprite = () =>
  cached('bossflash', () => {
    const s = bossSprite();
    const [c, g] = mkCanvas(s.width, s.height);
    g.drawImage(s, 0, 0);
    g.globalCompositeOperation = 'source-in';
    g.fillStyle = PAL.white;
    g.fillRect(0, 0, s.width, s.height);
    return c;
  });

const FIREBALL = [
  ['..77..', '.7887.', '788887', '788887', '.7887.', '..77..'],
  ['..66..', '.6776.', '677886', '678886', '.6776.', '..66..'],
];
export const fireballSprite = (frame: number) => cached(`fire:${frame}`, () => makeSprite(FIREBALL[frame]));

// ---------- Title scenery ----------
const PTERO = [
  ['00..........00..', '.000.......000..', '..0000...0000...', '....0000000.....', '......00000000..', '................'],
  ['................', '......00000000..', '....0000000.....', '..0000...0000...', '.000.......000..', '00..........00..'],
];
export const pteroSprite = (frame: number, map?: Record<string, string>) =>
  cached(`ptero:${frame}:${map ? 'c' : 'b'}`, () => makeSprite(PTERO[frame], map));

const SAUROPOD = [
  '...................................0000.....',
  '..................................000000....',
  '..................................00000.....',
  '...................................000......',
  '...................................000......',
  '..................................000.......',
  '..................................000.......',
  '.................................000........',
  '................................0000........',
  '..............................00000.........',
  '.........................000000000..........',
  '.....................000000000000...........',
  '0.................00000000000000............',
  '00.............000000000000000..............',
  '000..........00000000000000000..............',
  '.0000......00000000000000000000.............',
  '...00000000000000000000000000000............',
  '.....00000000000000000000000000000..........',
  '.......0000000000000000000000000000.........',
  '.........00000000000000000000000000.........',
  '...........000000000000000000000000.........',
  '.............0000000..0000000.000000........',
  '..............00000....00000....0000........',
  '..............0000.....0000.....0000........',
  '..............0000.....0000.....0000........',
  '..............0000.....0000.....0000........',
  '..............0000.....0000.....0000........',
  '.............00000....00000....00000........',
];
export const sauropodSprite = () => cached('sauropod', () => makeSprite(SAUROPOD));

// ---------- Background tile canvas ----------
export function tileCanvas(rows: string[], key: string): HTMLCanvasElement {
  return cached(`tile:${key}`, () => makeSprite(rows));
}
