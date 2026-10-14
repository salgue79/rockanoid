// Screen & playfield constants (Master System: 256x192)
export const W = 256;
export const H = 192;
export const COLS = 13;
export const ROWS = 14;
export const BW = 16;
export const BH = 8;
export const FX = 8; // field inner left
export const FY = 24; // field inner top
export const FW = COLS * BW; // 208
export const FR = FX + FW; // 216 field inner right
export const PADDLE_Y = 176;
export const BALL = 4;
export const TOTAL_LEVELS = 40;
export const GATE_W = 16;
export const GATE_L = FX + 16;
export const GATE_R = FR - 32;
export const EXIT_Y = 156;
export const EXIT_H = 28;

// Sega Master System palette (2 bits per channel: 00/55/AA/FF)
export const PAL = {
  black: '#000000',
  white: '#FFFFFF',
  grey: '#AAAAAA',
  dgrey: '#555555',
  red: '#FF0000',
  dred: '#AA0000',
  maroon: '#550000',
  orange: '#FF5500',
  lorange: '#FFAA00',
  yellow: '#FFFF00',
  lyellow: '#FFFF55',
  cream: '#FFFFAA',
  green: '#00AA00',
  lgreen: '#55FF55',
  dgreen: '#005500',
  olive: '#55AA00',
  lime: '#AAFF00',
  blue: '#0000AA',
  lblue: '#5555FF',
  dblue: '#000055',
  sky: '#55AAFF',
  cyan: '#00FFFF',
  ice: '#AAFFFF',
  teal: '#00AAAA',
  dteal: '#005555',
  brown: '#AA5500',
  tan: '#FFAA55',
  purple: '#AA00AA',
  lpurple: '#FF55FF',
  violet: '#5500AA',
  dpurple: '#550055',
  pink: '#FFAAAA',
  slate: '#5555AA',
  lslate: '#AAAAFF',
  sand: '#AAAA55',
  dolive: '#555500',
};

// Character -> color map used by sprite strings
export const CH: Record<string, string> = {
  '0': PAL.black,
  '1': PAL.white,
  '2': PAL.grey,
  '3': PAL.dgrey,
  '4': PAL.red,
  '5': PAL.dred,
  '6': PAL.orange,
  '7': PAL.lorange,
  '8': PAL.yellow,
  '9': PAL.lyellow,
  a: PAL.green,
  b: PAL.lgreen,
  c: PAL.dgreen,
  d: PAL.blue,
  e: PAL.lblue,
  f: PAL.sky,
  g: PAL.brown,
  h: PAL.maroon,
  i: PAL.tan,
  j: PAL.purple,
  k: PAL.lpurple,
  l: PAL.pink,
  m: PAL.cream,
  n: PAL.dblue,
  o: PAL.olive,
  p: PAL.ice,
  q: PAL.lime,
  r: PAL.violet,
  s: PAL.teal,
  t: PAL.cyan,
  u: PAL.slate,
  v: PAL.lslate,
  w: PAL.dpurple,
  x: PAL.sand,
  y: PAL.dolive,
  z: PAL.dteal,
};

export type BrickType = 'S' | 'M' | 'G' | 'W' | 'B' | 'E' | 'A' | 'L' | 'I' | 'F' | 'R' | 'D' | 'X';

export interface BrickInfo {
  name: string;
  score: number;
  hp: number;
  color: string;
}

export const BRICKS: Record<BrickType, BrickInfo> = {
  S: { name: 'PIEDRA', score: 50, hp: 1, color: PAL.grey },
  M: { name: 'BARRO', score: 60, hp: 1, color: PAL.brown },
  G: { name: 'HOJA', score: 70, hp: 1, color: PAL.green },
  W: { name: 'MADERA', score: 80, hp: 1, color: PAL.tan },
  B: { name: 'HUESO', score: 90, hp: 1, color: PAL.cream },
  E: { name: 'HUEVO', score: 100, hp: 1, color: PAL.cream },
  A: { name: 'AMBAR', score: 110, hp: 1, color: PAL.lorange },
  L: { name: 'LAVA', score: 120, hp: 1, color: PAL.orange },
  I: { name: 'HIELO', score: 130, hp: 1, color: PAL.ice },
  F: { name: 'FOSIL', score: 150, hp: 1, color: PAL.lslate },
  R: { name: 'ROCA', score: 200, hp: 2, color: PAL.grey },
  D: { name: 'CRISTAL', score: 300, hp: 3, color: PAL.lpurple },
  X: { name: 'OBSIDIANA', score: 0, hp: Infinity, color: PAL.slate },
};

export const isBrickType = (c: string): c is BrickType => c in BRICKS;

export type PowerKind = 'E' | 'L' | 'C' | 'S' | 'D' | 'P' | 'B';

export interface PowerInfo {
  base: string;
  hi: string;
  lo: string;
  name: string;
  desc: string;
  weight: number;
}

export const POWERS: Record<PowerKind, PowerInfo> = {
  E: { base: PAL.blue, hi: PAL.lblue, lo: PAL.dblue, name: 'HUESO LARGO', desc: 'HUESO MAS LARGO', weight: 22 },
  L: { base: PAL.dred, hi: PAL.orange, lo: PAL.maroon, name: 'LANZAS DE FUEGO', desc: 'DISPARA LANZAS', weight: 18 },
  C: { base: PAL.green, hi: PAL.lgreen, lo: PAL.dgreen, name: 'BREA PEGAJOSA', desc: 'ATRAPA PIEDRA', weight: 16 },
  S: { base: PAL.orange, hi: PAL.lorange, lo: PAL.dred, name: 'PIEDRA LENTA', desc: 'MENOS VELOCIDAD', weight: 14 },
  D: { base: PAL.teal, hi: PAL.cyan, lo: PAL.dteal, name: 'TRIPLE PIEDRA', desc: 'TRES PIEDRAS', weight: 16 },
  P: { base: PAL.dgrey, hi: PAL.grey, lo: PAL.black, name: 'VIDA EXTRA', desc: 'UN HUESO MAS', weight: 4 },
  B: { base: PAL.purple, hi: PAL.lpurple, lo: PAL.dpurple, name: 'SALIDA SECRETA', desc: 'ABRE EL MURO', weight: 3 },
};

export const POWER_KINDS = Object.keys(POWERS) as PowerKind[];

export type PaddleMode = 'normal' | 'expand' | 'laser' | 'catch';
