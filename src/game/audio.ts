type Note = [freq: number, beats: number];

const N = {
  D2: 73.42, E2: 82.41, F2: 87.31, G2: 98.0, A2: 110.0, C3: 130.81,
  G4: 392.0, A4: 440.0, B4: 493.88, C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99, A5: 880.0,
  C6: 1046.5, E6: 1318.5, G6: 1568.0, C7: 2093.0, F4: 349.23, E4: 329.63,
};

// Title theme (A minor, tribal)
const LEAD: Note[] = [
  [N.A4, 0.5], [N.A4, 0.5], [N.C5, 0.5], [N.A4, 0.5], [N.E5, 1], [N.D5, 0.5], [N.C5, 0.5],
  [N.D5, 0.5], [N.C5, 0.5], [N.A4, 0.5], [N.G4, 0.5], [N.A4, 2],
  [N.A4, 0.5], [N.A4, 0.5], [N.C5, 0.5], [N.A4, 0.5], [N.G5, 1], [N.E5, 0.5], [N.D5, 0.5],
  [N.E5, 0.5], [N.D5, 0.5], [N.C5, 0.5], [N.D5, 0.5], [N.A4, 1], [0, 1],
  [N.C5, 0.5], [N.C5, 0.5], [N.E5, 0.5], [N.C5, 0.5], [N.G5, 1], [N.F5, 0.5], [N.E5, 0.5],
  [N.F5, 0.5], [N.E5, 0.5], [N.D5, 0.5], [N.C5, 0.5], [N.D5, 2],
  [N.E5, 0.5], [N.E5, 0.5], [N.G5, 0.5], [N.E5, 0.5], [N.A5, 1], [N.G5, 0.5], [N.E5, 0.5],
  [N.D5, 0.5], [N.E5, 0.5], [N.C5, 0.5], [N.B4, 0.5], [N.A4, 2],
];

const BASS: Note[] = [
  [N.A2, 1], [N.A2, 1], [N.E2, 1], [N.A2, 1], [N.A2, 1], [N.A2, 1], [N.G2, 1], [N.G2, 1],
  [N.A2, 1], [N.A2, 1], [N.E2, 1], [N.A2, 1], [N.F2, 1], [N.F2, 1], [N.G2, 1], [N.G2, 1],
  [N.C3, 1], [N.C3, 1], [N.G2, 1], [N.C3, 1], [N.F2, 1], [N.F2, 1], [N.G2, 1], [N.G2, 1],
  [N.A2, 1], [N.A2, 1], [N.E2, 1], [N.A2, 1], [N.D2, 1], [N.E2, 1], [N.A2, 1], [N.A2, 1],
];

export type SfxName =
  | 'wall' | 'paddle' | 'brick' | 'hard' | 'bedrock' | 'capsule' | 'lose' | 'clear' | 'enemy'
  | 'shoot' | 'move' | 'select' | '1up' | 'boss' | 'start' | 'gameover' | 'fire' | 'warp' | 'bossdie';

interface ToneOpts {
  type?: OscillatorType;
  vol?: number;
  slide?: number;
  delay?: number;
  at?: number;
}

export class Sfx {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private noiseBuf: AudioBuffer | null = null;
  private _enabled = true;
  private track: string | null = null;
  private li = 0;
  private bi = 0;
  private lt = 0;
  private bt = 0;
  private dt = 0;
  private dn = 0;

  get enabled() {
    return this._enabled;
  }

  set enabled(v: boolean) {
    this._enabled = v;
    if (this.master) this.master.gain.value = v ? 0.22 : 0;
  }

  ensure() {
    if (!this.ctx) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = this._enabled ? 0.22 : 0;
      this.master.connect(this.ctx.destination);
      const len = this.ctx.sampleRate * 0.5;
      this.noiseBuf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const d = this.noiseBuf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume();
  }

  private get ready() {
    return !!this.ctx && !!this.master && this._enabled;
  }

  tone(freq: number, dur: number, o: ToneOpts = {}) {
    if (!this.ready || !this.ctx || !this.master) return;
    const t = o.at ?? this.ctx.currentTime + (o.delay ?? 0);
    const osc = this.ctx.createOscillator();
    osc.type = o.type ?? 'square';
    osc.frequency.setValueAtTime(freq, t);
    if (o.slide) osc.frequency.exponentialRampToValueAtTime(Math.max(20, o.slide), t + dur);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(o.vol ?? 0.5, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.connect(g).connect(this.master);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }

  noise(dur: number, vol = 0.3, delay = 0, at?: number) {
    if (!this.ready || !this.ctx || !this.master || !this.noiseBuf) return;
    const t = at ?? this.ctx.currentTime + delay;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    src.connect(g).connect(this.master);
    src.start(t);
    src.stop(t + dur + 0.02);
  }

  play(name: SfxName) {
    if (!this.ready) return;
    switch (name) {
      case 'wall':
        this.tone(520, 0.04, { vol: 0.25 });
        break;
      case 'paddle':
        this.tone(330, 0.07, { vol: 0.35 });
        break;
      case 'brick':
        this.tone(880, 0.05, { vol: 0.35 });
        this.tone(1320, 0.06, { vol: 0.3, delay: 0.035 });
        break;
      case 'hard':
        this.tone(1500, 0.03, { vol: 0.3 });
        this.tone(900, 0.05, { vol: 0.3, delay: 0.03 });
        break;
      case 'bedrock':
        this.tone(140, 0.08, { vol: 0.4, slide: 90 });
        break;
      case 'capsule':
        [523, 659, 784, 1046].forEach((f, i) => this.tone(f, 0.08, { vol: 0.3, delay: i * 0.055 }));
        break;
      case '1up':
        [1046, 1318, 1568, 2093, 1568, 2093].forEach((f, i) => this.tone(f, 0.1, { vol: 0.3, delay: i * 0.08 }));
        break;
      case 'lose':
        this.tone(440, 0.6, { vol: 0.4, slide: 60 });
        this.noise(0.4, 0.2, 0.1);
        break;
      case 'clear':
        [N.C5, N.E5, N.G5, N.C6, N.G5, N.C6, N.E6].forEach((f, i) => this.tone(f, i === 6 ? 0.5 : 0.12, { vol: 0.3, delay: i * 0.1 }));
        break;
      case 'enemy':
        this.noise(0.18, 0.35);
        this.tone(220, 0.2, { vol: 0.3, slide: 50 });
        break;
      case 'shoot':
        this.tone(1400, 0.08, { vol: 0.25, slide: 500 });
        break;
      case 'fire':
        this.noise(0.12, 0.3);
        this.tone(200, 0.25, { vol: 0.3, slide: 80, type: 'sawtooth' });
        break;
      case 'move':
        this.tone(700, 0.03, { vol: 0.25 });
        break;
      case 'select':
        this.tone(900, 0.05, { vol: 0.3 });
        this.tone(1350, 0.09, { vol: 0.3, delay: 0.05 });
        break;
      case 'boss':
        this.tone(120, 0.12, { vol: 0.5, slide: 60 });
        this.tone(1800, 0.04, { vol: 0.2 });
        break;
      case 'bossdie':
        this.noise(0.5, 0.5);
        this.tone(300, 0.8, { vol: 0.5, slide: 30, type: 'sawtooth' });
        break;
      case 'start':
        [N.A4, N.C5, N.E5, N.A5].forEach((f, i) => this.tone(f, i === 3 ? 0.4 : 0.12, { vol: 0.3, delay: i * 0.12 }));
        break;
      case 'warp':
        for (let i = 0; i < 8; i++) this.tone(400 + i * 150, 0.08, { vol: 0.25, delay: i * 0.05 });
        break;
      case 'gameover':
        [N.A4, N.G4, N.F4, N.E4].forEach((f, i) => this.tone(f, 0.35, { vol: 0.35, delay: i * 0.3 }));
        this.tone(110, 1.2, { vol: 0.4, slide: 40, delay: 1.2 });
        break;
    }
  }

  music(track: 'title' | null) {
    if (track === this.track) return;
    this.track = track;
    this.li = this.bi = this.dn = 0;
    this.lt = this.bt = this.dt = 0;
  }

  tick() {
    if (!this.ready || !this.ctx || !this.track) return;
    const now = this.ctx.currentTime;
    const beat = 60 / 132;
    const ahead = now + 0.25;
    if (this.lt < now) {
      this.lt = this.bt = this.dt = now + 0.05;
    }
    while (this.lt < ahead) {
      const [f, d] = LEAD[this.li];
      if (f > 0) this.tone(f, d * beat * 0.85, { type: 'square', vol: 0.16, at: this.lt });
      this.lt += d * beat;
      this.li = (this.li + 1) % LEAD.length;
    }
    while (this.bt < ahead) {
      const [f, d] = BASS[this.bi];
      if (f > 0) this.tone(f, d * beat * 0.8, { type: 'triangle', vol: 0.4, at: this.bt });
      this.bt += d * beat;
      this.bi = (this.bi + 1) % BASS.length;
    }
    while (this.dt < ahead) {
      const step = this.dn % 8;
      if (step === 0 || step === 5) this.tone(100, 0.14, { type: 'triangle', vol: 0.6, slide: 35, at: this.dt });
      if (step === 2 || step === 6) this.noise(0.07, 0.18, 0, this.dt);
      if (step % 2 === 1) this.noise(0.02, 0.06, 0, this.dt);
      this.dt += beat / 2;
      this.dn++;
    }
  }
}
