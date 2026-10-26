/* ═══════════════════════════════════════════════════════════════
   ALCHEMIST'S COVENANT v2 — Clean UI
   Estado central → render por zona → interações (tilt 3D + DnD).
   Toda transmutação de comportamento é logada no console.
   ═══════════════════════════════════════════════════════════════ */

'use strict';

const $ = sel => document.querySelector(sel);

/* ── Estado ──────────────────────────────────────────────────── */

const ENERGIA_POR_TURNO = 4;

const Estado = {
  energia: ENERGIA_POR_TURNO,
  energiaQueimada: 0,      // ataque do Paradoxo reduz a recarga seguinte
  estabilidade: 40,        // vida do Paradoxo
  estabilidadeMax: 40,
  turno: 1,
  encerrado: false,
  intencaoIndice: 0,
  daemons: {
    ferro:  { nome: 'Homúnculo de Ferro', glifo: '♂', dano: 4, cicloBase: 3, ciclo: 3, dobro: false },
    sangue: { nome: 'Daemon de Sangue',   glifo: '🜆', dano: 2, cicloBase: 2, ciclo: 2, dobro: false }
  },
  mao: []
};

/* As intenções do Paradoxo: sempre anunciadas ANTES de acontecer */
const INTENCOES = [
  { id: 'queimar',   icone: '🔥', valor: 2, rotulo: 'vai queimar 2 de Energia',
    agir() { Estado.energiaQueimada = 2; } },
  { id: 'atrasar',   icone: '⏳', valor: 1, rotulo: 'vai atrasar um Daemon em 1 ciclo',
    agir() {
      const ids = Object.keys(Estado.daemons);
      const d = Estado.daemons[ids[Math.floor(Math.random() * ids.length)]];
      d.ciclo += 1;
      console.log(`☍ Paradoxo atrasa ${d.nome}: ciclo agora em ${d.ciclo}.`);
    } },
  { id: 'observar',  icone: '👁', valor: 0, rotulo: 'apenas observa',
    agir() {} }
];

/* ── Etapa 2: as 3 cartas (efeito < 10 palavras) ─────────────── */

const CARTAS = {
  'mercurio-fugaz': {
    id: 'mercurio-fugaz',
    nome: 'Mercúrio Fugaz',
    tipo: 'materia',
    glifo: '☿',
    custo: 1,
    efeito: 'O Daemon ativa 1 ciclo mais cedo.',
    aplicar(d) { d.ciclo = Math.max(0, d.ciclo - 1); }
  },
  'essencia-solar': {
    id: 'essencia-solar',
    nome: 'Essência Solar',
    tipo: 'materia',
    glifo: '☉',
    custo: 2,
    efeito: '+3 de dano à ativação do Daemon.',
    aplicar(d) { d.dano += 3; }
  },
  'lei-troca': {
    id: 'lei-troca',
    nome: 'Lei da Troca Equivalente',
    tipo: 'lei',
    glifo: '⚖',
    custo: 0,
    sacrificio: 3, // o custo real está no corpo: Troca Equivalente
    efeito: 'Sacrifique 3 Energia: a próxima ativação dobra.',
    aplicar(d) { d.dobro = true; }
  }
};

const MAO_INICIAL = ['mercurio-fugaz', 'essencia-solar', 'lei-troca', 'essencia-solar', 'mercurio-fugaz'];

/* ── Render: um função por zona, sem estado escondido no DOM ─── */

function renderInimigo() {
  const int = INTENCOES[Estado.intencaoIndice];
  $('#intencao-icone').textContent = int.icone;
  $('#intencao-valor').textContent = int.valor > 0 ? int.valor : '';
  $('#intencao-rotulo').textContent = int.rotulo;
  $('#vida-valor').textContent = Estado.estabilidade;
  $('#vida-fill').style.width = `${(Estado.estabilidade / Estado.estabilidadeMax) * 100}%`;
}

function renderDaemons() {
  for (const [id, d] of Object.entries(Estado.daemons)) {
    $(`#ciclo-${id}`).textContent = d.ciclo;
    $(`#dano-${id}`).textContent = d.dano;
    const slot = $(`.slot-daemon[data-daemon="${id}"]`);
    let selo = slot.querySelector('.selo-dobro');
    if (d.dobro && !selo) {
      selo = document.createElement('span');
      selo.className = 'selo-dobro';
      selo.textContent = '×2';
      slot.appendChild(selo);
    } else if (!d.dobro && selo) {
      selo.remove();
    }
  }
}

function renderEnergia() {
  $('#energia-valor').textContent = Estado.energia;
}

function renderMao() {
  const mao = $('#mao');
  mao.innerHTML = '';
  const n = Estado.mao.length;
  Estado.mao.forEach((carta, i) => {
    const el = document.createElement('div');
    el.className = `carta carta--${carta.tipo}`;
    el.draggable = true;
    el.dataset.indice = i;
    /* leque: rotação simétrica em torno do centro da mão */
    el.style.setProperty('--rot', `${(i - (n - 1) / 2) * 2}deg`);
    el.innerHTML = `
      <span class="carta-custo">${carta.custo}</span>
      <span class="carta-nome">${carta.nome}</span>
      <div class="carta-glifo">${carta.glifo}</div>
      <p class="carta-efeito">${carta.efeito}</p>
      <span class="carta-tipo">${carta.tipo === 'lei' ? 'Lei' : 'Matéria'}</span>`;
    ligarTilt(el);
    ligarDrag(el);
    mao.appendChild(el);
  });
}

function renderTudo() {
  renderInimigo();
  renderDaemons();
  renderEnergia();
  renderMao();
}

/* ── Tilt 3D estilo Balatro ──────────────────────────────────── */

const reduzMovimento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function ligarTilt(el) {
  if (reduzMovimento) return;
  el.addEventListener('mouseenter', () => el.classList.add('em-foco'));
  el.addEventListener('mousemove', e => {
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;   // -0.5 … 0.5
    const py = (e.clientY - r.top) / r.height - 0.5;
    el.style.transform =
      `translateY(-28px) scale(1.12) rotateY(${(px * 24).toFixed(1)}deg) rotateX(${(-py * 24).toFixed(1)}deg)`;
  });
  el.addEventListener('mouseleave', () => {
    el.classList.remove('em-foco');
    el.style.transform = ''; // volta ao leque (--rot) com a transição "mola"
  });
}

/* ── Drag & Drop: mão → slot de Daemon ───────────────────────── */

function ligarDrag(el) {
  el.addEventListener('dragstart', e => {
    e.dataTransfer.setData('text/plain', el.dataset.indice);
    e.dataTransfer.effectAllowed = 'move';
    el.classList.add('arrastando');
    el.classList.remove('em-foco');
    el.style.transform = '';
  });
  el.addEventListener('dragend', () => el.classList.remove('arrastando'));
}

function configurarSlots() {
  document.querySelectorAll('.slot-daemon').forEach(slot => {
    slot.addEventListener('dragover', e => { e.preventDefault(); slot.classList.add('alvo'); });
    slot.addEventListener('dragleave', () => slot.classList.remove('alvo'));
    slot.addEventListener('drop', e => {
      e.preventDefault();
      slot.classList.remove('alvo');
      if (Estado.encerrado) return;

      const indice = Number(e.dataTransfer.getData('text/plain'));
      const carta = Estado.mao[indice];
      if (!carta) return;

      const custoTotal = carta.custo + (carta.sacrificio ?? 0);
      if (Estado.energia < custoTotal) {
        piscarGlobo();
        return;
      }

      const d = Estado.daemons[slot.dataset.daemon];
      const antes = resumoDaemon(d);

      Estado.energia -= custoTotal;
      Estado.mao.splice(indice, 1);
      carta.aplicar(d);

      /* Transmutação de comportamento: log claro no console */
      console.group(`⚗ ${carta.nome} → ${d.nome}`);
      console.log(`antes : ${antes}`);
      console.log(`depois: ${resumoDaemon(d)}`);
      console.groupEnd();

      pulsarCiclo(slot.dataset.daemon);
      renderTudo();
    });
  });
}

function resumoDaemon(d) {
  return `ativa em ${d.ciclo} · dano ${d.dano}${d.dobro ? ' ×2' : ''}`;
}

function piscarGlobo() {
  const globo = $('#globo-energia');
  globo.style.borderColor = 'var(--perigo)';
  setTimeout(() => { globo.style.borderColor = ''; }, 350);
}

function pulsarCiclo(id) {
  const el = $(`#ciclo-${id}`).parentElement;
  el.classList.remove('pulsa');
  void el.offsetWidth;
  el.classList.add('pulsa');
}

/* ── Turno: Selar → ciclos avançam → Paradoxo age ────────────── */

const espera = ms => new Promise(r => setTimeout(r, ms));

async function selarTurno() {
  if (Estado.encerrado) return;
  $('#btn-turno').disabled = true;

  /* 1. Ciclos dos Daemons avançam; em 0, ativam */
  for (const [id, d] of Object.entries(Estado.daemons)) {
    d.ciclo -= 1;
    pulsarCiclo(id);
    renderDaemons();
    await espera(reduzMovimento ? 0 : 300);

    if (d.ciclo <= 0) {
      const dano = d.dano * (d.dobro ? 2 : 1);
      Estado.estabilidade = Math.max(0, Estado.estabilidade - dano);
      console.log(`✦ ${d.nome} ativa: ${dano} de dano na Estabilidade.`);
      d.dobro = false;
      d.ciclo = d.cicloBase;

      const slot = $(`.slot-daemon[data-daemon="${id}"]`);
      slot.classList.add('ativou');
      renderInimigo();
      renderDaemons();
      await espera(reduzMovimento ? 0 : 500);
      slot.classList.remove('ativou');

      if (Estado.estabilidade <= 0) return fimDeJogo('O Paradoxo se dissolveu');
    }
  }

  /* 2. O Paradoxo executa a intenção anunciada e anuncia a próxima */
  const intencao = INTENCOES[Estado.intencaoIndice];
  $('#intencao').classList.add('agindo');
  intencao.agir();
  await espera(reduzMovimento ? 0 : 450);
  $('#intencao').classList.remove('agindo');
  Estado.intencaoIndice = (Estado.intencaoIndice + 1) % INTENCOES.length;

  /* 3. Recarga (menos o que foi queimado) e mão nova */
  Estado.turno += 1;
  Estado.energia = Math.max(0, ENERGIA_POR_TURNO - Estado.energiaQueimada);
  Estado.energiaQueimada = 0;
  while (Estado.mao.length < 5) {
    const ids = Object.keys(CARTAS);
    Estado.mao.push({ ...CARTAS[ids[Math.floor(Math.random() * ids.length)]] });
  }

  renderTudo();
  $('#btn-turno').disabled = false;
}

function fimDeJogo(titulo) {
  Estado.encerrado = true;
  $('#fim-titulo').textContent = titulo;
  $('#fim').hidden = false;
}

/* ── Canvas: vazio espacial sutil + anel de transmutação ─────── */

const Fundo = {
  canvas: null, ctx: null, w: 0, h: 0,
  estrelas: [], angulo: 0,

  init() {
    this.canvas = $('#vazio');
    this.ctx = this.canvas.getContext('2d');
    this.redimensionar();
    window.addEventListener('resize', () => this.redimensionar());
    this.estrelas = Array.from({ length: 70 }, () => ({
      x: Math.random(), y: Math.random(),
      r: Math.random() * 1.1 + 0.3,
      a: Math.random() * 0.4 + 0.15
    }));
    if (reduzMovimento) this.desenhar();
    else this.loop();
  },

  redimensionar() {
    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.parentElement.getBoundingClientRect();
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.w = rect.width;
    this.h = rect.height;
  },

  loop() {
    this.angulo += 0.0008;
    this.desenhar();
    requestAnimationFrame(() => this.loop());
  },

  desenhar() {
    const { ctx, w, h } = this;
    ctx.clearRect(0, 0, w, h);

    // estrelas fixas, discretas — sem cintilação que distraia
    for (const e of this.estrelas) {
      ctx.fillStyle = `rgba(210,215,235,${e.a})`;
      ctx.beginPath();
      ctx.arc(e.x * w, e.y * h, e.r, 0, Math.PI * 2);
      ctx.fill();
    }

    // anel de transmutação tênue atrás dos slots
    const cx = w / 2, cy = h / 2;
    const raio = Math.min(w, h) * 0.42;
    ctx.strokeStyle = 'rgba(212,175,55,0.14)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(cx, cy, raio, 0, Math.PI * 2);
    ctx.stroke();

    // arco rotativo dourado (único movimento do fundo)
    ctx.strokeStyle = 'rgba(212,175,55,0.35)';
    ctx.beginPath();
    ctx.arc(cx, cy, raio, this.angulo, this.angulo + Math.PI / 3);
    ctx.stroke();

    // triângulo interno fixo
    ctx.strokeStyle = 'rgba(212,175,55,0.10)';
    ctx.beginPath();
    for (let i = 0; i <= 3; i++) {
      const a = -Math.PI / 2 + (i * 2 * Math.PI) / 3;
      const x = cx + raio * 0.8 * Math.cos(a);
      const y = cy + raio * 0.8 * Math.sin(a);
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
};

/* ── Bootstrap ───────────────────────────────────────────────── */

function iniciar() {
  Estado.energia = ENERGIA_POR_TURNO;
  Estado.energiaQueimada = 0;
  Estado.estabilidade = Estado.estabilidadeMax;
  Estado.turno = 1;
  Estado.encerrado = false;
  Estado.intencaoIndice = 0;
  Estado.daemons.ferro = { nome: 'Homúnculo de Ferro', glifo: '♂', dano: 4, cicloBase: 3, ciclo: 3, dobro: false };
  Estado.daemons.sangue = { nome: 'Daemon de Sangue', glifo: '🜆', dano: 2, cicloBase: 2, ciclo: 2, dobro: false };
  Estado.mao = MAO_INICIAL.map(id => ({ ...CARTAS[id] }));
  $('#fim').hidden = true;
  $('#btn-turno').disabled = false;
  renderTudo();
}

document.addEventListener('DOMContentLoaded', () => {
  Fundo.init();
  configurarSlots();
  $('#btn-turno').addEventListener('click', selarTurno);
  $('#btn-denovo').addEventListener('click', iniciar);
  iniciar();

  /* gancho de depuração/testes */
  window.Covenant = {
    Estado,
    jogar(indice, daemonId) {
      const carta = Estado.mao[indice];
      const d = Estado.daemons[daemonId];
      if (!carta || !d) return;
      const custoTotal = carta.custo + (carta.sacrificio ?? 0);
      if (Estado.energia < custoTotal) return;
      Estado.energia -= custoTotal;
      Estado.mao.splice(indice, 1);
      carta.aplicar(d);
      renderTudo();
    },
    selarTurno
  };
});
