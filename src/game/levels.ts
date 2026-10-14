import { COLS, ROWS, PAL } from './defs';

export interface WorldInfo {
  name: string;
  wall: [string, string, string]; // base, highlight, shadow
  tile: string[];
  enemy: 'dragonfly' | 'bat' | 'flame' | 'ice' | 'skull';
}

// 16x16 background tiles (dark, so bricks stand out)
const TILE_JUNGLE = [
  '0000000000000000',
  '00c0000000000000',
  '0ccc0000000c0000',
  '00c0c00000ccc000',
  '0000cc00000c0c00',
  '00000c000000cc00',
  '0000000000000c00',
  '0000000c00000000',
  '000000ccc0000000',
  '00000c0c00000000',
  '0000cc0000000000',
  '0000c00000000000',
  '0000000000000c00',
  '0c0000000000ccc0',
  'ccc000000000c0c0',
  '0c00000000000cc0',
];

const TILE_CAVE = [
  'nnnnnnnnnnnnnnnn',
  'n000000000000000',
  'n000000000000000',
  'n000000000000000',
  'n000030000000000',
  'n000000000000000',
  'n000000000000000',
  'n000000000000000',
  'nnnnnnnnnnnnnnnn',
  '00000000n0000000',
  '00000000n0000000',
  '00000000n0000000',
  '00000000n0000300',
  '00000000n0000000',
  '00000000n0000000',
  '00000000n0000000',
];

const TILE_VOLCANO = [
  'hhhhhhhhhhhhhhhh',
  'hhhhhhhhhhhhhhhh',
  'hhh0hhhhhhhhhhhh',
  'hhhh0hhhhhhh0hhh',
  'hhhh0hhhhhh0hhhh',
  'hhhhh0hhhh0hhhhh',
  'hhhhh0hhh0hhhhhh',
  'hhhhhh0h0hhhhhhh',
  'hhhhhhh0hhhhhhhh',
  'hhhhhhh5hhhhhhhh',
  'hhhhhhh0hhhhhhhh',
  'hhhhhhh0hhhhhhhh',
  'hhhhhh0hhhhhhhhh',
  'hhhhh0hhhhhhhhhh',
  'hhhh0hhhhhhhhhhh',
  'hhh0hhhhhhhhhhhh',
];

const TILE_ICE = [
  'nnnnnnnnnnnnnnnn',
  'nnnnnnndnnnnnnnn',
  'nnndnnndnnndnnnn',
  'nnnndnndnndnnnnn',
  'nnnnndnddnnnnnnn',
  'nndddddddddnnnnn',
  'nnnnndnddnnnnnnn',
  'nnnndnndnndnnnnn',
  'nnndnnndnnndnnnn',
  'nnnnnnndnnnnnnnn',
  'nnnnnnnnnnnnnnnn',
  'nnnnnnnnnnnn1nnn',
  'nnnnnnnnnnnnnnnn',
  'nn1nnnnnnnnnnnnn',
  'nnnnnnnnnnnnnnnn',
  'nnnnnnnnnnnnnnnn',
];

const TILE_BONES = [
  '0000000000000000',
  '0w00000000000000',
  'w3ww000000000000',
  '0w00000000000w00',
  '00000000000ww3ww',
  '0000000000000w00',
  '0000000000000000',
  '00000w0000000000',
  '0000w3ww00000000',
  '00000w0000000000',
  '0000000000000000',
  '0000000000000000',
  '00000000000w0000',
  '0w00000000ww3w00',
  'w3ww0000000w0000',
  '0w00000000000000',
];

export const WORLDS: WorldInfo[] = [
  { name: 'LA JUNGLA', wall: [PAL.brown, PAL.tan, PAL.maroon], tile: TILE_JUNGLE, enemy: 'dragonfly' },
  { name: 'LAS CAVERNAS', wall: [PAL.grey, PAL.white, PAL.dgrey], tile: TILE_CAVE, enemy: 'bat' },
  { name: 'EL VOLCAN', wall: [PAL.dred, PAL.orange, PAL.maroon], tile: TILE_VOLCANO, enemy: 'flame' },
  { name: 'LA EDAD DE HIELO', wall: [PAL.sky, PAL.ice, PAL.blue], tile: TILE_ICE, enemy: 'ice' },
  { name: 'EL VALLE DE HUESOS', wall: [PAL.slate, PAL.lslate, PAL.dblue], tile: TILE_BONES, enemy: 'skull' },
];

export const worldOf = (level: number) => Math.min(WORLDS.length - 1, Math.floor((level - 1) / 8));

// Brick legend:
// S Piedra  M Barro  G Hoja  W Madera  B Hueso  E Huevo  A Ambar  L Lava
// I Hielo   F Fosil  R Roca(2-3 golpes)  D Cristal(3 golpes)  X Obsidiana(indestructible)
const RAW: string[][] = [
  // ===== ZONA 1: LA JUNGLA =====
  // 1 - Primeros pasos
  [
    '.............',
    '.............',
    'GGGGGGGGGGGGG',
    'MMMMMMMMMMMMM',
    'WWWWWWWWWWWWW',
    'EEEEEEEEEEEEE',
    'SSSSSSSSSSSSS',
  ],
  // 2 - Piramide
  [
    '.............',
    '......A......',
    '.....AAA.....',
    '....EEEEE....',
    '...GGGGGGG...',
    '..MMMMMMMMM..',
    '.WWWWWWWWWWW.',
    'SSSSSSSSSSSSS',
  ],
  // 3 - Escalera
  [
    'G............',
    'GM...........',
    'GMW..........',
    'GMWE.........',
    'GMWEA........',
    'GMWEAS.......',
    'GMWEASG......',
    'GMWEASGM.....',
    'GMWEASGMW....',
    'GMWEASGMWE...',
    'GMWEASGMWEA..',
    'GMWEASGMWEAS.',
  ],
  // 4 - Huevo de dino
  [
    '.....EEE.....',
    '....EEEEE....',
    '...EEEEEEE...',
    '...EEGEEEE...',
    '..EEEEEEEEE..',
    '..EEEEEGEEE..',
    '..EGEEEEEEE..',
    '..EEEEEEEEE..',
    '...EEEEEGE...',
    '...EEEEEEE...',
    '....EEEEE....',
    '.....EEE.....',
  ],
  // 5 - Troncos
  [
    '.............',
    '.W.G.W.G.W.G.',
    '.W.G.W.G.W.G.',
    '.M.E.M.E.M.E.',
    '.M.E.M.E.M.E.',
    '.S.A.S.A.S.A.',
    '.S.A.S.A.S.A.',
    '.R.B.R.B.R.B.',
  ],
  // 6 - Tablero
  [
    'S.S.S.S.S.S.S',
    '.M.M.M.M.M.M.',
    'G.G.G.G.G.G.G',
    '.W.W.W.W.W.W.',
    'B.B.B.B.B.B.B',
    '.E.E.E.E.E.E.',
    'A.A.A.A.A.A.A',
    '.S.S.S.S.S.S.',
  ],
  // 7 - Brontosaurio
  [
    '..........GG.',
    '.........GGGG',
    '.........GG..',
    '.........GG..',
    '........GGG..',
    '......GGGGGG.',
    '..GGGGGGGGGG.',
    '.GGGGGGGGGG..',
    'GG.GGGGGGG...',
    '...MM...MM...',
    '...MM...MM...',
    '...SS...SS...',
  ],
  // 8 - Templo de la jungla
  [
    '......A......',
    '.....AAA.....',
    '....XAAAX....',
    '...XXWWWXX...',
    '..XWWEEEWWX..',
    '..WWWEEEWWW..',
    '..WWEEEEEWW..',
    '..WWWEEEWWW..',
    '..SSSSSSSSS..',
    '..S.R.R.R.S..',
    '..S.R.R.R.S..',
  ],
  // ===== ZONA 2: LAS CAVERNAS =====
  // 9 - Estalactitas
  [
    'SSSSSSSSSSSSS',
    'S.SSS.SSS.SSS',
    'S..SS..SS..SS',
    'F..FS..FS..FS',
    'F...F...F...F',
    '.............',
    '.............',
    '.............',
    '..A...A...A..',
    '.AAA.AAA.AAA.',
    '.R.R.R.R.R.R.',
  ],
  // 10 - Cristales
  [
    '.............',
    '......F......',
    '.....FAF.....',
    '....FASAF....',
    '...FASDSAF...',
    '..FASDDDSAF..',
    '...FASDSAF...',
    '....FASAF....',
    '.....FAF.....',
    '......F......',
  ],
  // 11 - Murcielago
  [
    '.............',
    '.SS.......SS.',
    '.SSS.....SSS.',
    '..SSS...SSS..',
    '..SSSSFSSSS..',
    '...SSFFFSS...',
    '....SSFSS....',
    '.....SSS.....',
    '......S......',
    '.............',
    '..R.......R..',
    '.RRR.....RRR.',
  ],
  // 12 - Laberinto
  [
    'XXXXX.X.XXXXX',
    'X...........X',
    'X.AAAAAAAAA.X',
    '..A.......A..',
    'X.A.FFFFF.A.X',
    'X.A.F.D.F.A.X',
    '..A.FFFFF.A..',
    'X.A.......A.X',
    'X.AAAAAAAAA.X',
    'X...........X',
    'XXXX.....XXXX',
  ],
  // 13 - Amonita
  [
    '.............',
    '....FFFFF....',
    '...F.....F...',
    '..F..FFF..F..',
    '..F.F...F.F..',
    '..F.F.D.F.F..',
    '..F.F...F.F..',
    '..F..FF...F..',
    '...F......F..',
    '....FFFFFF...',
  ],
  // 14 - Pilares
  [
    'R.....S.....R',
    'R....SSS....R',
    'R...SSFSS...R',
    'R..SSFAFSS..R',
    'R.SSFAAAFSS.R',
    'R..SSFAFSS..R',
    'R...SSFSS...R',
    'R....SSS....R',
    'R.....S.....R',
  ],
  // 15 - Oscuridad
  [
    '.............',
    'X.X.X.X.X.X.X',
    '.A.A.A.A.A.A.',
    'X.X.X.X.X.X.X',
    '.F.F.F.F.F.F.',
    'X.X.X.X.X.X.X',
    '.S.S.S.D.S.S.',
  ],
  // 16 - Guardian de la cueva
  [
    '....BBBBB....',
    '...BBBBBBB...',
    '..BBBBBBBBB..',
    '..BXXBBBXXB..',
    '..BXXBBBXXB..',
    '..BBBBBBBBB..',
    '...BBBXBBB...',
    '...BBBBBBB...',
    '....B.B.B....',
    '....RRRRR....',
  ],
  // ===== ZONA 3: EL VOLCAN =====
  // 17 - Erupcion
  [
    '......L......',
    '.....LLL.....',
    '.....LLL.....',
    '....LLALL....',
    '....LLALL....',
    '...LLAAALL...',
    '...LLAAALL...',
    '..SSSSSSSSS..',
    '.SSSSSSSSSSS.',
    'SSSSSSSSSSSSS',
  ],
  // 18 - Rios de lava
  [
    'LLLLLLLLLLLLL',
    '.............',
    'MMMMM...MMMMM',
    '.............',
    '..LLLLLLLLL..',
    '.............',
    'RRR...R...RRR',
    '.............',
    'LLLLLLLLLLLLL',
  ],
  // 19 - Meteoritos
  [
    '..R.......R..',
    '.RRR.....RRR.',
    '..R...R...R..',
    '.....RRR.....',
    '..L...R...L..',
    '.LLL.....LLL.',
    '..L.......L..',
    '......L......',
    '.....LLL.....',
    '......L......',
  ],
  // 20 - Lago de lava
  [
    '.............',
    '.X.........X.',
    '.............',
    '...R.....R...',
    '..RAR...RAR..',
    '...R.....R...',
    '.............',
    'LLLLLLLLLLLLL',
    'LLLLLLLLLLLLL',
    '.............',
    'MMMMMMMMMMMMM',
  ],
  // 21 - Fortaleza de obsidiana
  [
    'XXX.......XXX',
    'X.A.......A.X',
    'X.A.LLLLL.A.X',
    '..A.LSRSL.A..',
    '..A.LRDRL.A..',
    '..A.LSRSL.A..',
    'X.A.LLLLL.A.X',
    'X.A.......A.X',
    'XXX.......XXX',
  ],
  // 22 - Dientes
  [
    'LLLLLLLLLLLLL',
    'L.L.L.L.L.L.L',
    '.............',
    '.............',
    'R...........R',
    'RR.........RR',
    '.............',
    '.............',
    'A.A.A.A.A.A.A',
    'AAAAAAAAAAAAA',
  ],
  // 23 - Pterodactilo
  [
    'L...........L',
    'LL.........LL',
    '.LLL.....LLL.',
    '..LLLL.LLLL..',
    '...LLLLLLL...',
    '.....LAL.....',
    '......A......',
    '......A......',
    '.....RAR.....',
    '.....R.R.....',
  ],
  // 24 - Corazon del volcan
  [
    '.............',
    '..LL.....LL..',
    '.LLLL...LLLL.',
    '.LLLLL.LLLLL.',
    '.LLLLLLLLLLL.',
    '..LLLALALLL..',
    '...LLAAALL...',
    '....LLALL....',
    '.....LLL.....',
    '......L......',
    '.............',
    '.RR.......RR.',
    'XRRX.....XRRX',
  ],
  // ===== ZONA 4: LA EDAD DE HIELO =====
  // 25 - Nevada
  [
    'I.I.I.I.I.I.I',
    '.............',
    '.I.I.I.I.I.I.',
    '.............',
    'I.I.I.I.I.I.I',
    '.............',
    '.I.I.I.I.I.I.',
    '.............',
    'BBBBBBBBBBBBB',
  ],
  // 26 - Copo de nieve
  [
    '......I......',
    '..I...I...I..',
    '...I..I..I...',
    '....I.I.I....',
    '.....III.....',
    'IIIIIIDIIIIII',
    '.....III.....',
    '....I.I.I....',
    '...I..I..I...',
    '..I...I...I..',
    '......I......',
  ],
  // 27 - Mamut
  [
    '.............',
    '......MMMM...',
    '....MMMMMMMM.',
    '...MMMMMMMMMM',
    '..MMMMMMMMMMM',
    '..MMMMMMMMM.M',
    '..MMMMMMMMBBM',
    '..MM..MMM.B.M',
    '..MM..MMM...M',
    '..SS..SSS....',
  ],
  // 28 - Glaciar
  [
    '.............',
    'RIIIIIIIIIIIR',
    'RIIIIIIIIIIIR',
    'RIIIFFFFFIIIR',
    'RIIIFDDDFIIIR',
    'RIIIFFFFFIIIR',
    'RIIIIIIIIIIIR',
    'RIIIIIIIIIIIR',
  ],
  // 29 - Carambanos
  [
    'IIIIIIIIIIIII',
    'III.III.III.I',
    '.II..II..II..',
    '.I...I...I...',
    '.............',
    '.............',
    '...S.....S...',
    '..SSS...SSS..',
    '.SSSSS.SSSSS.',
  ],
  // 30 - Cueva helada
  [
    'X...........X',
    'XX.........XX',
    'XIX.......XIX',
    'XIIX.....XIIX',
    '.III.....III.',
    '.IIFFFFFFFII.',
    '.IIFDDDDDFII.',
    '.IIFFFFFFFII.',
    '.III.....III.',
    '..I.......I..',
  ],
  // 31 - Aurora
  [
    '.IIII...IIII.',
    'IIIIII.IIIIII',
    '.IIII...IIII.',
    '.............',
    '..FFF...FFF..',
    '.FFFFF.FFFFF.',
    '..FFF...FFF..',
    '.............',
    '...BB...BB...',
    '..BBBB.BBBB..',
    '...BB...BB...',
  ],
  // 32 - Trono de hielo
  [
    'I.....D.....I',
    'II...DID...II',
    'IDI..DID..IDI',
    'IIDI.DID.IDII',
    'IIIDDDIDDDIII',
    'XIIIIIIIIIIIX',
    'XIRIRIRIRIRIX',
    '.X.........X.',
  ],
  // ===== ZONA 5: EL VALLE DE HUESOS =====
  // 33 - Costillas
  [
    '......B......',
    '...BBBBBBB...',
    '..B...B...B..',
    '.B....B....B.',
    '.B.BBBBBBB.B.',
    '.B.B..B..B.B.',
    '.B.B..B..B.B.',
    '.B.BBBBBBB.B.',
    '.B....B....B.',
    '..B...B...B..',
    '...BBBBBBB...',
    '......B......',
  ],
  // 34 - Craneo gigante
  [
    '...BBBBBBB...',
    '..BBBBBBBBB..',
    '.BBBBBBBBBBB.',
    '.BBXXBBBXXBB.',
    '.BBXXBBBXXBB.',
    '.BBBBBBBBBBB.',
    '..BBBBFBBBB..',
    '..BBBFBFBBB..',
    '...BBBBBBB...',
    '...B.B.B.B...',
  ],
  // 35 - Pozos de brea
  [
    'S.S.S.S.S.S.S',
    '.F.F.F.F.F.F.',
    '..X.......X..',
    '.XXX.....XXX.',
    '..X.......X..',
    '.............',
    '..LLL...LLL..',
    '.LLLLL.LLLLL.',
    '..LLL...LLL..',
  ],
  // 36 - Huellas
  [
    '..B.B.B......',
    '..BBBBB......',
    '...BBB.......',
    '......B.B.B..',
    '......BBBBB..',
    '.......BBB...',
    '..F.F.F......',
    '..FFFFF......',
    '...FFF.......',
    '......F.F.F..',
    '......FFFFF..',
    '.......FFF...',
  ],
  // 37 - Espiral de huesos
  [
    'BBBBBBBBBBBBB',
    '............B',
    '.BBBBBBBBBB.B',
    '.B........B.B',
    '.B.BBBBBB.B.B',
    '.B.B....B.B.B',
    '.B.B.DD.B.B.B',
    '.B.B....B.B.B',
    '.B.BBBBBB.B.B',
    '.B..........B',
    '.BBBBBBBBBBBB',
  ],
  // 38 - Lluvia de meteoritos
  [
    'L.....R.....L',
    '.L...RRR...L.',
    '..L...R...L..',
    '...L.....L...',
    '....L...L....',
    '.....L.L.....',
    '......D......',
    '.....L.L.....',
    '....L...L....',
    '...L.....L...',
    '..L.......L..',
    '.L.........L.',
  ],
  // 39 - La ultima muralla
  [
    'XRXRXRXRXRXRX',
    '.............',
    'FDFDFDFDFDFDF',
    '.............',
    'BSBSBSBSBSBSB',
    '.............',
    'LLLLLLLLLLLLL',
    '.............',
    'R.R.R.R.R.R.R',
  ],
  // 40 - Guarida del T-REX (jefe)
  [
    'X...........X',
    'X...........X',
    'X...........X',
    '.............',
    '.............',
    '.............',
    '.............',
    '.............',
    '.............',
    '.............',
    'LL.........LL',
  ],
];

export const LEVEL_NAMES = [
  'PRIMEROS PASOS', 'LA PIRAMIDE', 'LA ESCALERA', 'HUEVO DE DINO', 'LOS TRONCOS', 'EL TABLERO', 'BRONTOSAURIO', 'EL TEMPLO',
  'ESTALACTITAS', 'CRISTALES', 'MURCIELAGO', 'EL LABERINTO', 'LA AMONITA', 'LOS PILARES', 'OSCURIDAD', 'EL GUARDIAN',
  'ERUPCION', 'RIOS DE LAVA', 'METEORITOS', 'LAGO DE LAVA', 'LA FORTALEZA', 'DIENTES', 'PTERODACTILO', 'CORAZON DE FUEGO',
  'NEVADA', 'COPO DE NIEVE', 'EL MAMUT', 'EL GLACIAR', 'CARAMBANOS', 'CUEVA HELADA', 'LA AURORA', 'TRONO DE HIELO',
  'COSTILLAS', 'CRANEO GIGANTE', 'POZOS DE BREA', 'LAS HUELLAS', 'LA ESPIRAL', 'LLUVIA DE FUEGO', 'ULTIMA MURALLA', 'GUARIDA DEL T-REX',
];

// Normalize every level to exactly ROWS x COLS characters
export const LEVELS: string[][] = RAW.map((rows) => {
  const out: string[] = [];
  for (let r = 0; r < ROWS; r++) {
    const row = (rows[r] ?? '').padEnd(COLS, '.').slice(0, COLS);
    out.push(row);
  }
  return out;
});
