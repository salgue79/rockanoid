#!/usr/bin/env node
// Genera los iconos de la app (PWA + Android/Capacitor) en pixel-art, sin dependencias.
//   node scripts/make-icons.mjs
// Salida:
//   public/favicon.png, public/icons/icon-192.png, icon-512.png, icon-maskable-512.png
//   assets/icon-only.png, icon-foreground.png, icon-background.png, splash.png, splash-dark.png
// Nota: public/icons/icon-512.png e icon-maskable-512.png ya existen como versiones provisionales
// para que la web sea instalable sin ejecutar este script; aquí se SOBRESCRIBEN con el arte exacto.
import { deflateSync } from 'node:zlib';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

// ---------- Codificador PNG (RGBA 8 bits, sin filtro) ----------
const CRC_TABLE = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  CRC_TABLE[n] = c >>> 0;
}
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crc]);
}
function encodePNG(img) {
  const { w, h, data } = img;
  const stride = w * 4;
  const raw = Buffer.alloc((stride + 1) * h);
  for (let y = 0; y < h; y++) {
    raw[y * (stride + 1)] = 0;
    data.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; // profundidad
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 6 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// ---------- Lienzo mínimo ----------
const hex = (s) => [parseInt(s.slice(1, 3), 16), parseInt(s.slice(3, 5), 16), parseInt(s.slice(5, 7), 16), 255];
class Img {
  constructor(w, h, bg) {
    this.w = w;
    this.h = h;
    this.data = Buffer.alloc(w * h * 4);
    if (bg) this.rect(0, 0, w, h, bg);
  }
  rect(x, y, w, h, col) {
    const [r, g, b, a] = typeof col === 'string' ? hex(col) : col;
    const x0 = Math.max(0, x), y0 = Math.max(0, y);
    const x1 = Math.min(this.w, x + w), y1 = Math.min(this.h, y + h);
    for (let yy = y0; yy < y1; yy++) {
      let i = (yy * this.w + x0) * 4;
      for (let xx = x0; xx < x1; xx++) {
        this.data[i++] = r;
        this.data[i++] = g;
        this.data[i++] = b;
        this.data[i++] = a;
      }
    }
  }
  // Dibuja un sprite de cadenas (un char = un pixel) escalado
  sprite(rows, map, x0, y0, s) {
    rows.forEach((row, y) => {
      for (let x = 0; x < row.length; x++) {
        const col = map[row[x]];
        if (col) this.rect(x0 + x * s, y0 + y * s, s, s, col);
      }
    });
  }
}

// ---------- Paleta Master System ----------
const P = {
  black: '#000000', white: '#FFFFFF', grey: '#AAAAAA', dgrey: '#555555', cream: '#FFFFAA',
  orange: '#FF5500', lorange: '#FFAA00', dred: '#AA0000',
  green: '#00AA00', lgreen: '#55FF55', dgreen: '#005500',
  sky: '#55AAFF', ice: '#AAFFFF', blue: '#0000AA',
  bg: '#14121c', bg2: '#1f1a2e',
};

// ---------- Arte del icono: 32x32 unidades ----------
const BALL = ['..00..', '.0210.', '021130', '022330', '.0330.', '..00..'];
// Hueso de 20x8: nudillo izquierdo + caña de 12 px + nudillo derecho (espejo)
const KNOB = ['.00.', '0m10', '0m1m', '0mmm', '0mmm', '0m2m', '0m20', '.00.'];
const SHAFT = ['............', '000000000000', '111111111111', 'mmmmmmmmmmmm', 'mmmmmmmmmmmm', '222222222222', '000000000000', '............'];
const BONE = KNOB.map((k, i) => k + SHAFT[i] + [...k].reverse().join(''));
const MAP = { 0: P.black, 1: P.white, 2: P.grey, 3: P.dgrey, m: P.cream };

function brick(img, x, y, s, [hi, base, lo]) {
  img.rect(x, y, 10 * s, 4 * s, base);
  img.rect(x, y, 10 * s, s, hi);
  img.rect(x, y, s, 4 * s, hi);
  img.rect(x, y + 3 * s, 10 * s, s, lo);
  img.rect(x + 9 * s, y, s, 4 * s, lo);
}

// Dibuja el arte completo (32x32 unidades) en (ox, oy) con escala s
function drawArt(img, ox, oy, s) {
  const rows = [
    [P.lorange, P.orange, P.dred],
    [P.lgreen, P.green, P.dgreen],
    [P.ice, P.sky, P.blue],
  ];
  rows.forEach((cols, r) => {
    for (let c = 0; c < 3; c++) brick(img, ox + c * 11 * s, oy + (1 + r * 5) * s, s, cols);
  });
  img.sprite(BALL, MAP, ox + 13 * s, oy + 16 * s, s);
  img.sprite(BONE, MAP, ox + 6 * s, oy + 23 * s, s);
}

// ---------- Fuente 5x7 para el texto del splash ----------
const FONT = {
  R: [0x1e, 0x11, 0x11, 0x1e, 0x14, 0x12, 0x11],
  O: [0x0e, 0x11, 0x11, 0x11, 0x11, 0x11, 0x0e],
  C: [0x0e, 0x11, 0x10, 0x10, 0x10, 0x11, 0x0e],
  K: [0x11, 0x12, 0x14, 0x18, 0x14, 0x12, 0x11],
  A: [0x0e, 0x11, 0x11, 0x1f, 0x11, 0x11, 0x11],
  N: [0x11, 0x11, 0x19, 0x15, 0x13, 0x11, 0x11],
  I: [0x0e, 0x04, 0x04, 0x04, 0x04, 0x04, 0x0e],
  D: [0x1e, 0x11, 0x11, 0x11, 0x11, 0x11, 0x1e],
};
function text(img, str, x, y, s, col, shadow) {
  let cx = x;
  for (const ch of str) {
    const gl = FONT[ch];
    if (gl) {
      for (let r = 0; r < 7; r++)
        for (let c = 0; c < 5; c++)
          if (gl[r] & (0x10 >> c)) {
            if (shadow) img.rect(cx + c * s + s, y + r * s + s, s, s, shadow);
            img.rect(cx + c * s, y + r * s, s, s, col);
          }
    }
    cx += 6 * s;
  }
}

// ---------- Generación ----------
function save(rel, img) {
  const file = resolve(ROOT, rel);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, encodePNG(img));
  console.log(`✔ ${rel} (${img.w}x${img.h})`);
}

// Fondo con un degradado sutil en bandas (estilo 8 bits)
function background(size, color = P.bg) {
  const img = new Img(size, size, color);
  const band = Math.max(1, Math.floor(size / 8));
  img.rect(0, 0, size, band * 3, P.bg2);
  return img;
}

// PWA
const fav = background(32);
drawArt(fav, 0, 0, 1);
save('public/favicon.png', fav);

for (const size of [192, 512]) {
  const img = background(size);
  drawArt(img, 0, 0, size / 32);
  save(`public/icons/icon-${size}.png`, img);
}
{
  const img = background(512);
  drawArt(img, 128, 128, 8); // dentro del circulo seguro (80% central)
  save('public/icons/icon-maskable-512.png', img);
}

// Capacitor / Android (@capacitor/assets)
{
  const img = background(1024);
  drawArt(img, 0, 0, 32);
  save('assets/icon-only.png', img);
}
{
  const img = new Img(1024, 1024, [0, 0, 0, 0]); // primer plano transparente
  drawArt(img, 272, 272, 15); // dentro de la zona segura adaptativa (66% central)
  save('assets/icon-foreground.png', img);
}
save('assets/icon-background.png', background(1024));

for (const name of ['splash', 'splash-dark']) {
  const img = new Img(2732, 2732, P.bg);
  drawArt(img, 982, 860, 24);
  text(img, 'ROCKANOID', 1048, 1720, 12, P.cream, P.black);
  save(`assets/${name}.png`, img);
}

console.log('\nIconos generados. Ahora: npm run build  (y para Android: npx cap sync android)');
