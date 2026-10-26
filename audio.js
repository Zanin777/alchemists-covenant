/* ═══════════════════════════════════════════════════════════════
   Som — tudo sintetizado com Web Audio (nenhum arquivo para baixar).
   Música: drone em Ré menor + sinos esparsos com eco.
   O AudioContext só nasce num clique (regra dos navegadores).
   ═══════════════════════════════════════════════════════════════ */

'use strict';

const Som = {
  ctx: null, mestre: null, efeitos: null, trilha: null, eco: null,
  mudo: (() => { try { return localStorage.getItem('covenant-mudo') === '1'; } catch { return false; } })(),
  timerSino: null,

  iniciar() {
    if (this.ctx) return this.ctx.resume();
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    this.ctx = new Ctx();
    this.mestre = this.ctx.createGain();
    this.mestre.connect(this.ctx.destination);
    this.efeitos = this.ganho(0.9, this.mestre);
    this.trilha = this.ganho(0.55, this.mestre);

    // eco simples: atraso com realimentação, para os sinos e as Reações
    this.eco = this.ctx.createDelay(1);
    this.eco.delayTime.value = 0.32;
    const volta = this.ganho(0.35, this.eco);
    this.eco.connect(volta);
    this.eco.connect(this.ganho(0.5, this.mestre));

    this.aplicarMudo();
    this.musica();
  },

  ganho(valor, destino) {
    const g = this.ctx.createGain();
    g.gain.value = valor;
    g.connect(destino);
    return g;
  },

  alternarMudo() {
    this.mudo = !this.mudo;
    try { localStorage.setItem('covenant-mudo', this.mudo ? '1' : '0'); } catch {}
    this.aplicarMudo();
    return this.mudo;
  },

  aplicarMudo() {
    if (this.mestre) this.mestre.gain.setTargetAtTime(this.mudo ? 0 : 1, this.ctx.currentTime, 0.05);
  },

  /* nota com envelope: ataque curto, queda exponencial; `ate` faz glissando */
  tom(freq, dur, { tipo = 'sine', vol = 0.2, atraso = 0, ate = null, destino = null, eco = false } = {}) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime + atraso;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = tipo;
    osc.frequency.setValueAtTime(freq, t);
    if (ate) osc.frequency.exponentialRampToValueAtTime(ate, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g);
    g.connect(destino || this.efeitos);
    if (eco) g.connect(this.eco);
    osc.start(t);
    osc.stop(t + dur + 0.05);
  },

  /* ruído filtrado: sopros, impactos, rachaduras */
  ruido(dur, { vol = 0.2, freq = 1200, q = 0.8, atraso = 0, ate = null } = {}) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime + atraso;
    const n = Math.floor(this.ctx.sampleRate * dur);
    const buf = this.ctx.createBuffer(1, n, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const filtro = this.ctx.createBiquadFilter();
    filtro.type = 'bandpass';
    filtro.Q.value = q;
    filtro.frequency.setValueAtTime(freq, t);
    if (ate) filtro.frequency.exponentialRampToValueAtTime(ate, t + dur);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(filtro);
    filtro.connect(g);
    g.connect(this.efeitos);
    src.start(t);
  },

  /* ── Efeitos ─────────────────────────────────────────────────── */

  carta()   { this.ruido(0.16, { vol: 0.12, freq: 900, ate: 3200, q: 1.2 }); },
  dano()    { this.tom(140, 0.2, { tipo: 'triangle', vol: 0.32, ate: 55 }); this.ruido(0.1, { vol: 0.22, freq: 700 }); },
  escudo()  { this.tom(988, 0.3, { vol: 0.09 }); this.tom(1480, 0.25, { vol: 0.06, atraso: 0.04 }); },
  bloqueio(){ this.tom(660, 0.18, { tipo: 'square', vol: 0.05 }); this.ruido(0.08, { vol: 0.1, freq: 3000 }); },
  semEnergia() { this.tom(180, 0.14, { tipo: 'square', vol: 0.06, ate: 120 }); },
  selecionar() { this.tom(1200, 0.05, { vol: 0.04 }); },

  reacao(nome) {
    // cada Reação tem seu acorde: Magma grave, Lama aberto, Vapor agudo e aéreo
    const acordes = { Magma: [147, 220, 294], Lama: [196, 247, 330], Vapor: [440, 554, 659] };
    (acordes[nome] || [262, 330, 392]).forEach((f, i) =>
      this.tom(f, 0.9, { tipo: 'triangle', vol: 0.12, atraso: i * 0.06, eco: true }));
    this.ruido(0.5, { vol: 0.12, freq: 400, ate: 4000, q: 0.6 });
  },

  ataqueInimigo() {
    this.ruido(0.25, { vol: 0.3, freq: 300, ate: 90, q: 0.7 });
    this.tom(90, 0.35, { tipo: 'sawtooth', vol: 0.12, ate: 40 });
  },
  danoJogador() { this.tom(100, 0.3, { tipo: 'triangle', vol: 0.35, ate: 45 }); this.ruido(0.18, { vol: 0.25, freq: 500 }); },
  defesaInimigo() { this.tom(330, 0.4, { tipo: 'triangle', vol: 0.1 }); this.tom(495, 0.35, { vol: 0.06, atraso: 0.05 }); },
  maldicao() { [311, 294, 262].forEach((f, i) => this.tom(f, 0.4, { tipo: 'sawtooth', vol: 0.05, atraso: i * 0.09, eco: true })); },
  fortalecer() { [196, 262, 330].forEach((f, i) => this.tom(f, 0.3, { tipo: 'square', vol: 0.04, atraso: i * 0.07 })); },

  /* cada casa do círculo soa um degrau acima (Ré menor pentatônica) */
  slot(i) { const f = [293.7, 349.2, 392, 440, 523.3][i % 5]; this.tom(f, 0.5, { tipo: 'triangle', vol: 0.09, eco: true }); },
  transmutar() {
    this.ruido(1.5, { vol: 0.16, freq: 200, ate: 5000, q: 0.5 });
    this.tom(73.4, 1.8, { tipo: 'sawtooth', vol: 0.08, ate: 147 });
    [147, 220, 294].forEach((f, i) => this.tom(f, 1.6, { tipo: 'triangle', vol: 0.06, atraso: 0.1 * i, eco: true }));
  },
  sacrificio() {
    this.ruido(0.5, { vol: 0.18, freq: 600, ate: 150, q: 0.9 });
    this.tom(98, 0.6, { tipo: 'triangle', vol: 0.15, ate: 65, eco: true });
  },
  equivalencia() { [294, 440, 587, 880].forEach((f, i) => this.tom(f, 1.6, { vol: 0.07, atraso: 0.5 + i * 0.05, eco: true })); },
  imperfeita() {
    // trítono desafinado e rachadura: algo saiu errado
    [277, 392, 415].forEach((f, i) => this.tom(f, 1.4, { tipo: 'sawtooth', vol: 0.05, atraso: 0.4 + i * 0.03, eco: true }));
    this.ruido(0.3, { vol: 0.2, freq: 3500, atraso: 0.9, q: 2 });
    this.ruido(0.25, { vol: 0.18, freq: 2500, atraso: 1.2, q: 2 });
  },
  impacto() {
    this.ruido(0.6, { vol: 0.35, freq: 1500, ate: 120, q: 0.4 });
    this.tom(110, 0.7, { tipo: 'triangle', vol: 0.4, ate: 36 });
    [587, 740, 880].forEach((f, i) => this.tom(f, 1, { vol: 0.05, atraso: 0.02 * i, eco: true }));
  },

  turno() { this.tom(196, 1.4, { vol: 0.14, eco: true }); this.tom(294, 1.2, { vol: 0.08, atraso: 0.02, eco: true }); },
  turnoInimigo() { this.tom(147, 1.2, { tipo: 'triangle', vol: 0.12, eco: true }); this.tom(139, 1.1, { vol: 0.08 }); },
  derrotaInimigo() { this.ruido(0.9, { vol: 0.2, freq: 2000, ate: 200, q: 0.5 }); [523, 659, 784, 1047].forEach((f, i) => this.tom(f, 0.8, { vol: 0.08, atraso: 0.2 + i * 0.08, eco: true })); },
  vitoria() { [294, 370, 440, 587, 740, 880].forEach((f, i) => this.tom(f, 1.2, { tipo: 'triangle', vol: 0.1, atraso: i * 0.12, eco: true })); },
  derrota() { [294, 262, 233, 196].forEach((f, i) => this.tom(f, 1.1, { tipo: 'triangle', vol: 0.12, atraso: i * 0.28, eco: true })); },

  /* ── Música ──────────────────────────────────────────────────── */

  musica() {
    const ctx = this.ctx;
    const filtro = ctx.createBiquadFilter();
    filtro.type = 'lowpass';
    filtro.frequency.value = 420;
    filtro.Q.value = 2;
    const g = this.ganho(0.09, this.trilha);
    filtro.connect(g);

    // drone: Ré + Lá, levemente desafinados, respirando pelo filtro
    [[73.4, 'sawtooth', 0], [73.4, 'sawtooth', 6], [110, 'triangle', -4], [146.8, 'sine', 3]].forEach(([f, tipo, desafino]) => {
      const osc = ctx.createOscillator();
      osc.type = tipo;
      osc.frequency.value = f;
      osc.detune.value = desafino;
      osc.connect(filtro);
      osc.start();
    });
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.07;
    const lfoGanho = this.ganho(180, filtro.frequency);
    lfo.connect(lfoGanho);
    lfo.start();

    // sinos em Ré menor pentatônica, de vez em quando
    const escala = [293.7, 349.2, 392, 440, 523.3, 587.3, 698.5];
    const tocarSino = () => {
      const f = escala[Math.floor(Math.random() * escala.length)];
      this.tom(f, 2.6, { vol: 0.045, destino: this.trilha, eco: true });
      if (Math.random() < 0.35) this.tom(f * 1.5, 2.2, { vol: 0.025, atraso: 0.18, destino: this.trilha, eco: true });
      this.timerSino = setTimeout(tocarSino, 1800 + Math.random() * 3200);
    };
    tocarSino();
  }
};
