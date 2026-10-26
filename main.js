/* ═══════════════════════════════════════════════════════════════
   ALCHEMIST'S COVENANT v3 — Combate direto + Reações
   Cartas atacam/defendem na hora. O último elemento jogado vira o
   Catalisador; um elemento diferente em seguida causa uma Reação.
   Run de 3 lutas, com recompensa de carta entre elas.
   ═══════════════════════════════════════════════════════════════ */

'use strict';

const $ = sel => document.querySelector(sel);
const reduzMovimento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
// Teste.rapido pula todas as esperas (partidas automáticas de balanceamento)
const Teste = { rapido: false };
const espera = ms => (reduzMovimento || Teste.rapido ? Promise.resolve() : new Promise(r => setTimeout(r, ms)));

const VIDA_MAX = 50;
const ENERGIA_POR_TURNO = 3;
const CARTAS_POR_TURNO = 5;
const MAO_MAX = 8;
const CURA_ENTRE_LUTAS = 8;

/* ── Elementos: os triângulos alquímicos clássicos ───────────── */

const ELEMENTOS = {
  fogo:  { nome: 'Fogo',  cor: '#e0703a', ponta: 'cima',  barra: false },
  agua:  { nome: 'Água',  cor: '#4f9bd9', ponta: 'baixo', barra: false },
  terra: { nome: 'Terra', cor: '#8db35a', ponta: 'baixo', barra: true }
};

/* SVG em vez de caracteres Unicode alquímicos, que faltam em muitas fontes de celular */
function glifo(elemento) {
  const e = ELEMENTOS[elemento];
  const tri = e.ponta === 'cima' ? '50,10 90,85 10,85' : '10,15 90,15 50,90';
  const barra = !e.barra ? '' : e.ponta === 'cima'
    ? '<line x1="8" y1="58" x2="92" y2="58"/>'
    : '<line x1="8" y1="42" x2="92" y2="42"/>';
  return `<svg viewBox="0 0 100 100" aria-hidden="true" style="color:${e.cor}">
    <g fill="none" stroke="currentColor" stroke-width="8" stroke-linejoin="round">
      <polygon points="${tri}"/>${barra}</g></svg>`;
}

/* ── Reações: par de elementos diferentes (a ordem não importa) ─ */

/* três elementos, três Reações — uma de cada tipo: dano, Escudo, cartas */
const REACOES = {
  'fogo+terra': { nome: 'Magma', texto: '+6 de dano',      dano: 6,   cor: '#ff8a3a' },
  'agua+terra': { nome: 'Lama',  texto: '+6 de Escudo',    escudo: 6, cor: '#8fc0a0' },
  'agua+fogo':  { nome: 'Vapor', texto: 'compre 2 cartas', compra: 2, cor: '#d6e8f7' }
};

const CIRCULO_MAX = 5; // posições no Círculo de Transmutação

const chaveReacao = (a, b) => [a, b].sort().join('+');
const reacaoEntre = (a, b) => (a && b && a !== b ? REACOES[chaveReacao(a, b)] : null);

/* ── Cartas ──────────────────────────────────────────────────── */

/* Uma carta é só números: dano, escudo, compra. Texto e ícones saem daqui. */
const CARTAS = {
  faisca:    { nome: 'Faísca',    elemento: 'fogo',  custo: 1, dano: 6 },
  gota:      { nome: 'Gota',      elemento: 'agua',  custo: 1, escudo: 5 },
  pedra:     { nome: 'Pedra',     elemento: 'terra', custo: 1, dano: 4, escudo: 3 },
  // recompensas
  labareda:  { nome: 'Labareda',  elemento: 'fogo',  custo: 2, dano: 14 },
  brasa:     { nome: 'Brasa',     elemento: 'fogo',  custo: 0, dano: 3 },
  mare:      { nome: 'Maré',      elemento: 'agua',  custo: 2, escudo: 12 },
  orvalho:   { nome: 'Orvalho',   elemento: 'agua',  custo: 0, escudo: 2, compra: 1 },
  terremoto: { nome: 'Terremoto', elemento: 'terra', custo: 2, dano: 9, escudo: 7 },
  seixo:     { nome: 'Seixo',     elemento: 'terra', custo: 0, dano: 2, escudo: 2 },
  // maldição: o inimigo põe no seu baralho; não tem elemento e some quando jogada
  escoria:   { nome: 'Escória',   custo: 1, some: true }
};

/* ── Troca Equivalente ────────────────────────────────────────────
   O centro do círculo é um altar. O preço é metade das casas ocupadas (arred. p/ cima).
   Cartas oferecidas saem do baralho pela run (Lei da Perda); vida paga 1 a cada 6.
   Oferenda que cobre o preço → Equivalência: o círculo dobra o resultado.
   Oferenda menor → Imperfeita: dobra também, mas a realidade cobra o que faltou. */
const VIDA_POR_VALOR = 6;
const MULT_TROCA = 2;
const BARALHO_MINIMO = 5; // abaixo disso a Lei da Perda travaria a run

const precoTroca = () => Math.ceil(Luta.circulo.length / 2);
// cartas raras (de recompensa) valem mais; Escória vale 1 — oferecê-la é limpar a maldição
const valorCarta = id => (INICIAIS.has(id) || CARTAS[id].some ? 1 : 2);
const valorOferenda = () => Luta.oferenda.reduce((s, id) => s + valorCarta(id), 0) + Luta.vidaOferecida;

function estadoTroca() {
  const v = valorOferenda();
  if (!v) return null;
  return v >= precoTroca() ? 'equivalente' : 'imperfeita';
}

/* o que o círculo vai causar ao transmutar: cartas + Reações dos elos, × troca */
function totaisCirculo() {
  const soma = campo => Luta.circulo.reduce((s, id) => s + (CARTAS[id][campo] || 0), 0)
    + Luta.elos.reduce((s, r) => s + (r?.[campo] || 0), 0);
  const mult = estadoTroca() ? MULT_TROCA : 1;
  return { dano: soma('dano') * mult, escudo: soma('escudo') * mult, mult };
}

/* o que a realidade cobra numa Transmutação Imperfeita — quem escolhe não é você */
const CONSEQUENCIAS = {
  rebote(falta) {
    const dano = 5 * falta;
    Run.vida = Math.max(0, Run.vida - dano);
    flutuar('#barra-jogador', `−${dano}`, 'dano');
    piscarDano();
    return `Rebote: o círculo devolveu ${dano} de dano em você.`;
  },
  cicatriz(falta) {
    const nomes = [];
    for (let k = 0; k < falta; k++) {
      const alvos = Run.deck.map((id, i) => i).filter(i => Run.deck[i] !== 'escoria');
      if (!alvos.length) break;
      const i = alvos[Math.floor(Math.random() * alvos.length)];
      nomes.push(CARTAS[Run.deck[i]].nome);
      Run.deck[i] = 'escoria';
      Luta.descarte.push('escoria');
    }
    flutuar('#jogador-alvo', `+${nomes.length} Escória`, 'maldicao');
    return `Cicatriz: ${nomes.join(' e ')} ${nomes.length > 1 ? 'viraram' : 'virou'} Escória no seu baralho.`;
  },
  exaustao(falta) {
    Luta.exaustao += falta;
    flutuar('#globo-energia', `−${falta} Energia`, 'maldicao');
    return `Exaustão: −${falta} de Energia no próximo turno.`;
  }
};

function textoCarta(c) {
  return [
    c.dano && `Causa ${c.dano} de dano.`,
    c.escudo && `Ganha ${c.escudo} de Escudo.`,
    c.compra && `Compra ${c.compra} carta${c.compra > 1 ? 's' : ''}.`,
    c.some && 'Não faz nada. Some ao ser jogada.'
  ].filter(Boolean).join(' ');
}

const DECK_INICIAL = ['faisca', 'faisca', 'faisca', 'faisca', 'gota', 'gota', 'gota', 'pedra', 'pedra', 'pedra'];
const RECOMPENSAS = ['labareda', 'brasa', 'mare', 'orvalho', 'terremoto', 'seixo'];

/* ── Inimigos: intenções em ciclo fixo, sempre anunciadas ────── */

/* tipos de intenção: ataque (com `vezes` = golpes), defesa, fortalecer, maldicao (põe Escória) */
const INIMIGOS = [
  { nome: 'Homúnculo Falho', vida: 50, arte: 'homunculo', cor: '#b08a6a',
    historia: 'Nos porões do laboratório, um homúnculo malfeito quebrou o próprio frasco. Ele não sabe o que é. Só sabe ferir.',
    padrao: [{ tipo: 'ataque', valor: 9 }, { tipo: 'ataque', valor: 5, vezes: 2 }, { tipo: 'defesa', valor: 8 }] },
  { nome: 'Quimera de Mercúrio', vida: 80, arte: 'quimera', cor: '#8fb3c9',
    historia: 'O mercúrio do grande alambique ganhou forma: leão, cabra e serpente. Nenhuma das três cabeças sabe recuar.',
    padrao: [{ tipo: 'ataque', valor: 13 }, { tipo: 'maldicao', valor: 2 }, { tipo: 'ataque', valor: 8, vezes: 2 }, { tipo: 'defesa', valor: 12 }] },
  { nome: 'O Paradoxo', vida: 120, arte: 'paradoxo', cor: '#a988cf',
    historia: 'No centro do círculo, a coisa que olha de volta. Toda troca tem um preço, e ele veio cobrar o seu.',
    padrao: [{ tipo: 'ataque', valor: 15 }, { tipo: 'fortalecer', valor: 3 }, { tipo: 'ataque', valor: 7, vezes: 3 },
             { tipo: 'maldicao', valor: 2 }, { tipo: 'defesa', valor: 16 }] }
];
// balanceado com partidas automáticas: bot guloso vence ~70%, quase sempre perdendo no Paradoxo

const CAPITULOS = ['Capítulo I', 'Capítulo II', 'Capítulo III'];

/* A arte dos inimigos (ARTES, arteInimigo) vive em arte.js */

/* ── Estado ──────────────────────────────────────────────────── */

const Run = { vida: VIDA_MAX, deck: [], luta: 0, encerrada: false };

const Luta = {
  inimigo: null,
  escudo: 0, energia: 0,
  compra: [], descarte: [], mao: [],
  catalisador: null,
  turno: 0,
  selecionada: null, // toque: 1º toque seleciona, 2º joga
  ocupado: false,
  voando: false,     // carta a caminho do círculo: segura novas jogadas
  circulo: [],       // cartas colocadas no Círculo de Transmutação, em ordem
  elos: [],          // elos[i] = Reação entre a carta i-1 e a i (ou null)
  oferenda: [],      // cartas no altar do centro (Troca Equivalente)
  vidaOferecida: 0,  // em unidades de VIDA_POR_VALOR; só é paga ao transmutar
  modoOferenda: false,
  exaustao: 0        // Energia a menos no próximo turno (consequência)
};

function embaralhar(lista) {
  for (let i = lista.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [lista[i], lista[j]] = [lista[j], lista[i]];
  }
  return lista;
}

function comprar(n) {
  for (let k = 0; k < n && Luta.mao.length < MAO_MAX; k++) {
    if (!Luta.compra.length) {
      Luta.compra = embaralhar(Luta.descarte);
      Luta.descarte = [];
    }
    if (!Luta.compra.length) return;
    Luta.mao.push(Luta.compra.pop());
  }
}

function intencaoAtual() {
  const ini = Luta.inimigo;
  return ini.padrao[ini.passo % ini.padrao.length];
}

function danoDaIntencao(int) {
  return int.valor + Luta.inimigo.forca;
}

/* ── Efeitos ─────────────────────────────────────────────────── */

function causarDano(n) {
  const ini = Luta.inimigo;
  const absorvido = Math.min(ini.escudo, n);
  ini.escudo -= absorvido;
  const dano = n - absorvido;
  ini.vida = Math.max(0, ini.vida - dano);
  flutuar('#inimigo-alvo', dano ? `−${dano}` : 'bloqueado', dano ? 'dano' : 'escudo');
  if (dano) {
    tremer('#inimigo-alvo');
    marcar('#inimigo-alvo', 'atingido');
    Som.dano();
  } else {
    Som.bloqueio();
  }
}

function ganharEscudo(n) {
  Luta.escudo += n;
  flutuar('#barra-jogador', `+${n} escudo`, 'escudo');
  Som.escudo();
}

/* golpe do inimigo no jogador; o Escudo absorve primeiro */
function receberGolpe(bruto) {
  const absorvido = Math.min(Luta.escudo, bruto);
  Luta.escudo -= absorvido;
  const dano = bruto - absorvido;
  Run.vida = Math.max(0, Run.vida - dano);
  flutuar('#barra-jogador', dano ? `−${dano}` : 'bloqueado', dano ? 'dano' : 'escudo');
  if (dano) {
    tremer('#zona-mao');
    piscarDano();
    Som.danoJogador();
  } else {
    Som.bloqueio();
  }
}

/* ── Fluxo da run ────────────────────────────────────────────── */

function iniciarRun() {
  Run.vida = VIDA_MAX;
  Run.deck = [...DECK_INICIAL];
  Run.luta = 0;
  Run.encerrada = false;
  $('#fim').hidden = true;
  mostrarHistoria();
}

/* um parágrafo antes de cada luta, com a criatura que vem pela frente */
function mostrarHistoria() {
  const def = INIMIGOS[Run.luta];
  $('#historia-capitulo').textContent = CAPITULOS[Run.luta];
  $('#historia-nome').textContent = def.nome;
  $('#historia-texto').textContent = def.historia;
  $('#historia-arte').innerHTML = arteInimigo(def.arte);
  $('#historia-arte').style.color = def.cor;
  $('#historia').hidden = false;
  $('#btn-lutar').focus();
}

function iniciarLuta() {
  $('#historia').hidden = true;
  const def = INIMIGOS[Run.luta];
  Luta.inimigo = { ...def, vidaMax: def.vida, escudo: 0, forca: 0, passo: 0 };
  Luta.compra = embaralhar([...Run.deck]);
  Luta.descarte = [];
  Luta.mao = [];
  Luta.turno = 0;
  Luta.exaustao = 0;
  Luta.oferenda = [];
  Luta.vidaOferecida = 0;
  Luta.modoOferenda = false;
  $('#inimigo-arte').innerHTML = arteInimigo(def.arte);
  $('#inimigo-arte').style.color = def.cor;
  $('#inimigo-alvo').classList.remove('derrotado');
  iniciarTurno();
}

function iniciarTurno() {
  Luta.turno += 1;
  Luta.energia = Math.max(0, ENERGIA_POR_TURNO - Luta.exaustao);
  Luta.exaustao = 0;
  Luta.escudo = 0;
  Luta.catalisador = null;
  Luta.selecionada = null;
  Luta.circulo = [];
  Luta.elos = [];
  comprar(CARTAS_POR_TURNO);
  Luta.ocupado = false;
  renderTudo();
  bannerTurno(Luta.turno === 1 ? Luta.inimigo.nome : 'Seu turno');
  Som.turno();
}

/* Jogar uma carta = colocá-la na próxima posição do Círculo de Transmutação.
   Dano e Escudo só acontecem ao Transmutar; compra de cartas acontece na hora. */
async function jogarCarta(indice) {
  if (Luta.ocupado || Luta.voando || Run.encerrada) return;
  const id = Luta.mao[indice];
  const carta = CARTAS[id];
  if (!carta) return;
  if (Luta.circulo.length >= CIRCULO_MAX) {
    anunciar('O círculo está completo', 'aviso');
    Som.semEnergia();
    return;
  }
  if (Luta.energia < carta.custo) {
    piscarGlobo();
    anunciar('Energia insuficiente', 'aviso');
    Som.semEnergia();
    return;
  }

  const origem = $('#mao').children[indice]?.getBoundingClientRect();
  const posicao = Luta.circulo.length;
  Luta.energia -= carta.custo;
  Luta.mao.splice(indice, 1);
  Luta.selecionada = null;
  Luta.voando = true;
  renderTudo();
  Som.carta();
  if (origem) await voarCarta(id, origem, retanguloSlot(posicao));
  Luta.voando = false;

  // Reação com a carta anterior do círculo; Escória quebra a corrente
  const reacao = carta.elemento ? reacaoEntre(Luta.catalisador, carta.elemento) : null;
  Luta.circulo.push(id);
  Luta.elos.push(reacao);
  if (carta.compra) comprar(carta.compra);
  if (reacao) {
    if (reacao.compra) comprar(reacao.compra);
    anunciar(`⚗ ${reacao.nome}! ${reacao.texto}`, 'reacao');
    Fundo.explodir([ELEMENTOS[Luta.catalisador].cor, ELEMENTOS[carta.elemento].cor]);
    Som.reacao(reacao.nome);
    Luta.catalisador = null;
  } else {
    Luta.catalisador = carta.elemento || null;
    Som.slot(posicao);
  }
  renderTudo();
}

/* posição (na tela) da casa i do círculo — o SVG tem viewBox 240 */
const SLOT_RAIO = 84, SLOT_TAM = 25;
const slotXY = i => {
  const a = -Math.PI / 2 + (i * 2 * Math.PI) / CIRCULO_MAX;
  return [120 + SLOT_RAIO * Math.cos(a), 120 + SLOT_RAIO * Math.sin(a)];
};
function retanguloSlot(i) {
  const r = $('#circulo').getBoundingClientRect();
  const k = r.width / 240;
  const [x, y] = slotXY(i);
  return { left: r.left + (x - SLOT_TAM) * k, top: r.top + (y - SLOT_TAM) * k, width: SLOT_TAM * 2 * k, height: SLOT_TAM * 2 * k };
}

/* um fantasma da carta voa da mão e encolhe até caber na casa do círculo */
function voarCarta(id, origem, alvo) {
  if (reduzMovimento || Teste.rapido) return Promise.resolve();
  const fantasma = criarCarta(id);
  fantasma.classList.add('carta-voando');
  Object.assign(fantasma.style, { left: `${origem.left}px`, top: `${origem.top}px` });
  document.body.appendChild(fantasma);
  const dx = alvo.left + alvo.width / 2 - (origem.left + origem.width / 2);
  const dy = alvo.top + alvo.height / 2 - (origem.top + origem.height / 2);
  const escala = alvo.width / origem.width;
  const voo = fantasma.animate([
    { transform: 'translate(0, 0) scale(1) rotate(0deg)', opacity: 1 },
    { transform: `translate(${dx * 0.5}px, ${dy * 0.5 - 50}px) scale(0.8) rotate(-10deg)`, opacity: 1, offset: 0.5 },
    { transform: `translate(${dx}px, ${dy}px) scale(${escala}) rotate(180deg)`, opacity: 0.3 }
  ], { duration: 380, easing: 'cubic-bezier(0.45, 0, 0.7, 0.5)' });
  // teto de tempo: com a aba em segundo plano o navegador pausa animações e `finished` não chega
  const teto = new Promise(r => setTimeout(r, 600));
  return Promise.race([voo.finished, teto]).then(() => fantasma.remove(), () => fantasma.remove());
}

/* Transmutar: o círculo deita em 3D, gira, acende casa por casa,
   levanta e dispara uma coluna de luz no inimigo com todo o dano somado. */
async function transmutar() {
  const { dano, escudo } = totaisCirculo();
  const troca = estadoTroca();
  const falta = troca === 'imperfeita' ? precoTroca() - valorOferenda() : 0;

  // a oferenda é paga antes: vida sai agora, cartas deixam de existir na run
  if (Luta.vidaOferecida) {
    const custo = Luta.vidaOferecida * VIDA_POR_VALOR;
    Run.vida = Math.max(1, Run.vida - custo);
    flutuar('#barra-jogador', `−${custo} oferenda`, 'maldicao');
  }
  for (const id of Luta.oferenda) {
    const i = Run.deck.indexOf(id);
    if (i >= 0) Run.deck.splice(i, 1);
  }

  const anima = !(reduzMovimento || Teste.rapido);
  if (anima) {
    $('#centro').classList.add('transmutando');
    if (troca) $('#centro').classList.add(`troca-${troca}`);
    Som.transmutar();
    if (troca === 'equivalente') Som.equivalencia();
    if (troca === 'imperfeita') Som.imperfeita();
    await espera(420);
    for (let i = 0; i < Luta.circulo.length; i++) {
      $(`#circulo .slot[data-i="${i}"]`)?.classList.add('aceso');
      $(`#circulo .elo-c[data-i="${i}"]`)?.classList.add('aceso');
      Som.slot(i);
      await espera(170);
    }
    await espera(Math.max(0, 1250 - 420 - Luta.circulo.length * 170));
    const cores = Luta.circulo.map(id => ELEMENTOS[CARTAS[id].elemento]?.cor).filter(Boolean);
    Fundo.explodir(cores.length ? cores : ['#f0d67c']);
    await espera(380);
    if (dano) {
      colunaDeLuz();
      await espera(180);
    }
  }
  if (dano) causarDano(dano);
  if (escudo) ganharEscudo(escudo);
  if (troca === 'equivalente') anunciar('⚖ Equivalência! Resultado ×2', 'reacao');
  if (troca === 'imperfeita') {
    const tipos = Object.keys(CONSEQUENCIAS);
    const texto = CONSEQUENCIAS[tipos[Math.floor(Math.random() * tipos.length)]](falta);
    anunciar(`Transmutação Imperfeita! ${texto}`, 'aviso');
  }
  if (anima) {
    await espera(troca === 'imperfeita' ? 1100 : 500);
    $('#centro').classList.remove('transmutando', 'troca-equivalente', 'troca-imperfeita');
  }
  Luta.descarte.push(...Luta.circulo.filter(id => !CARTAS[id].some)); // Escória some de vez
  Luta.circulo = [];
  Luta.elos = [];
  Luta.oferenda = [];
  Luta.vidaOferecida = 0;
  Luta.modoOferenda = false;
  Luta.catalisador = null;
  renderTudo();
}

/* ── Oferenda: cartas da mão (e vida) vão para o altar do centro ── */

function alternarOferenda() {
  if (Luta.ocupado || Luta.voando) return;
  if (!Luta.modoOferenda && !Luta.circulo.length) {
    anunciar('Coloque cartas no círculo antes da oferenda', 'aviso');
    Som.semEnergia();
    return;
  }
  Luta.modoOferenda = !Luta.modoOferenda;
  Luta.selecionada = null;
  Som.selecionar();
  renderTudo();
}

async function sacrificar(indice) {
  if (Luta.ocupado || Luta.voando || Run.encerrada) return;
  const id = Luta.mao[indice];
  if (!id) return;
  // conta quantas cartas do baralho já estão prometidas ao altar
  const doBaralho = [...Luta.oferenda, id].filter(x => Run.deck.includes(x)).length;
  if (Run.deck.includes(id) && Run.deck.length - doBaralho < BARALHO_MINIMO) {
    anunciar(`Seu baralho não pode ter menos de ${BARALHO_MINIMO} cartas`, 'aviso');
    Som.semEnergia();
    return;
  }
  const origem = $('#mao').children[indice]?.getBoundingClientRect();
  Luta.mao.splice(indice, 1);
  Luta.selecionada = null;
  Luta.voando = true;
  renderTudo();
  if (origem) await voarCarta(id, origem, retanguloAltar());
  Luta.voando = false;
  Luta.oferenda.push(id);
  Som.sacrificio();
  renderTudo();
}

function oferecerVida() {
  if (Luta.ocupado || Luta.voando) return;
  if (Run.vida - (Luta.vidaOferecida + 1) * VIDA_POR_VALOR < 1) {
    anunciar('Você não tem vida suficiente para oferecer', 'aviso');
    Som.semEnergia();
    return;
  }
  Luta.vidaOferecida += 1;
  Som.sacrificio();
  renderTudo();
}

function desfazerOferenda() {
  if (Luta.ocupado || Luta.voando) return;
  Luta.mao.push(...Luta.oferenda);
  Luta.oferenda = [];
  Luta.vidaOferecida = 0;
  Som.selecionar();
  renderTudo();
}

function retanguloAltar() {
  const r = $('#circulo').getBoundingClientRect();
  const k = r.width / 240;
  return { left: r.left + 92 * k, top: r.top + 92 * k, width: 56 * k, height: 56 * k };
}

function colunaDeLuz() {
  const c = $('#circulo').getBoundingClientRect();
  const a = $('#inimigo-arte').getBoundingClientRect();
  const yBase = c.top + c.height / 2, yTopo = a.top + a.height * 0.45;
  const raio = document.createElement('div');
  raio.className = 'coluna-luz';
  Object.assign(raio.style, { left: `${c.left + c.width / 2}px`, top: `${yTopo}px`, height: `${yBase - yTopo}px` });
  document.body.appendChild(raio);
  Som.impacto();
  marcar('#inimigo-alvo', 'fulminado', 600);
  raio.animate([
    { transform: 'translateX(-50%) scaleY(0) scaleX(0.4)', opacity: 1 },
    { transform: 'translateX(-50%) scaleY(1) scaleX(1)', opacity: 1, offset: 0.3 },
    { transform: 'translateX(-50%) scaleY(1) scaleX(2.2)', opacity: 0 }
  ], { duration: 650, easing: 'ease-out' }).finished.then(() => raio.remove(), () => raio.remove());
}

async function fimDoTurno() {
  if (Luta.ocupado || Luta.voando || Run.encerrada) return;
  Luta.ocupado = true;
  if (Luta.circulo.length) {
    Luta.modoOferenda = false;
    renderTudo();
    await transmutar();
    if (Run.vida <= 0) { // o Rebote de uma Transmutação Imperfeita também mata
      Som.derrota();
      return fimDeRun('O círculo cobrou tudo', 'A Transmutação Imperfeita levou o resto da sua vida. Toda troca tem um preço.');
    }
    if (Luta.inimigo.vida <= 0) return venceuLuta();
  }
  Luta.descarte.push(...Luta.mao);
  Luta.mao = [];
  Luta.catalisador = null;
  Luta.selecionada = null;
  renderTudo();
  bannerTurno('Turno do inimigo', 'inimigo');
  Som.turnoInimigo();
  await espera(650);

  const ini = Luta.inimigo;
  const int = intencaoAtual();
  ini.escudo = 0; // o escudo do inimigo dura só até o turno seguinte dele
  $('#intencao').classList.add('agindo');

  if (int.tipo === 'ataque') {
    for (let golpe = 0; golpe < (int.vezes || 1) && Run.vida > 0; golpe++) {
      if (golpe) await espera(320);
      marcar('#inimigo-alvo', 'ataca', 450);
      Som.ataqueInimigo();
      receberGolpe(danoDaIntencao(int));
      renderJogador();
    }
  } else if (int.tipo === 'defesa') {
    ini.escudo += int.valor;
    flutuar('#inimigo-alvo', `+${int.valor} escudo`, 'escudo');
    Som.defesaInimigo();
  } else if (int.tipo === 'fortalecer') {
    ini.forca += int.valor;
    flutuar('#inimigo-alvo', `ataques +${int.valor}`, 'aviso');
    Som.fortalecer();
  } else if (int.tipo === 'maldicao') {
    for (let k = 0; k < int.valor; k++) Luta.descarte.push('escoria');
    flutuar('#jogador-alvo', `+${int.valor} Escória`, 'maldicao');
    Som.maldicao();
  }
  ini.passo += 1;
  renderTudo();
  await espera(600);
  $('#intencao').classList.remove('agindo');

  if (Run.vida <= 0) {
    Som.derrota();
    return fimDeRun('O círculo se apaga',
      `${ini.nome} venceu na luta ${Run.luta + 1} de ${INIMIGOS.length}. A transmutação terá de esperar.`);
  }
  iniciarTurno();
}

async function venceuLuta() {
  Luta.ocupado = true;
  $('#inimigo-alvo').classList.add('derrotado');
  Som.derrotaInimigo();
  await espera(900);
  Run.luta += 1;
  if (Run.luta >= INIMIGOS.length) {
    Som.vitoria();
    return fimDeRun('O olho se fecha',
      `A troca está completa. Você transmutou as ${INIMIGOS.length} criaturas com ${Run.vida} de vida.`);
  }
  const curado = Math.min(CURA_ENTRE_LUTAS, VIDA_MAX - Run.vida);
  Run.vida += curado;
  mostrarRecompensa(curado);
}

function mostrarRecompensa(curado) {
  const opcoes = embaralhar([...RECOMPENSAS]).slice(0, 3);
  $('#recompensa-sub').textContent =
    `${curado ? `+${curado} de vida recuperada. ` : ''}Escolha uma carta para o seu baralho.`;
  const caixa = $('#recompensa-cartas');
  caixa.innerHTML = '';
  for (const id of opcoes) {
    const el = criarCarta(id);
    el.addEventListener('click', () => escolherRecompensa(id));
    caixa.appendChild(el);
  }
  $('#recompensa').hidden = false;
}

function escolherRecompensa(id) {
  if (id) Run.deck.push(id);
  $('#recompensa').hidden = true;
  mostrarHistoria();
}

function fimDeRun(titulo, sub) {
  Run.encerrada = true;
  $('#fim-titulo').textContent = titulo;
  $('#fim-sub').textContent = sub;
  $('#fim').hidden = false;
}

/* ── Render ──────────────────────────────────────────────────── */

const pct = (v, max) => `${Math.min(100, (v / max) * 100)}%`;

const ICONES = {
  ataque: `<svg viewBox="0 0 24 24"><path d="M21.5 2.5 L20.4 8 L10.4 18 L6 13.6 L16 3.6 Z" fill="currentColor"/>
    <path d="M4.2 12.4 L11.6 19.8 M7.6 16.4 L3.6 20.4" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/>
    <circle cx="3" cy="21" r="1.8" fill="currentColor"/></svg>`,
  defesa: `<svg viewBox="0 0 24 24"><path d="M12 2 L20 5 V11 C20 16.5 16.5 20.5 12 22 C7.5 20.5 4 16.5 4 11 V5 Z" fill="currentColor"/></svg>`,
  fortalecer: `<svg viewBox="0 0 24 24"><path d="M12 3 L19.5 11 H15 V21 H9 V11 H4.5 Z" fill="currentColor"/></svg>`,
  compra: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round">
    <rect x="7" y="3" width="12" height="16" rx="2"/><path d="M5 6.5 V19 a2 2 0 0 0 2 2 H15"/></svg>`,
  maldicao: `<svg viewBox="0 0 24 24"><path d="M12 2.5 C6.5 2.5 3.5 6.5 3.5 11 C3.5 14 5 16 7 17 V20.5 H17 V17 C19 16 20.5 14 20.5 11 C20.5 6.5 17.5 2.5 12 2.5 Z" fill="currentColor"/>
    <circle cx="8.6" cy="11" r="2.3" fill="#0d0b14"/><circle cx="15.4" cy="11" r="2.3" fill="#0d0b14"/>
    <path d="M10 17.5 V20 M14 17.5 V20" stroke="#0d0b14" stroke-width="1.4"/></svg>`
};

const COR_MALDICAO = '#8a6fa3';

/* barra de vida: o rastro claro fica para trás e mostra o pedaço perdido */
function renderBarra(sel, vida, max, escudo) {
  const barra = $(sel);
  barra.querySelector('.barra-fill').style.width = pct(vida, max);
  barra.querySelector('.barra-rastro').style.width = pct(vida, max);
  barra.querySelector('.barra-texto').textContent = `${vida} / ${max}`;
  barra.classList.toggle('com-escudo', escudo > 0);
  const esc = barra.querySelector('.escudo');
  esc.hidden = escudo <= 0;
  esc.innerHTML = `${ICONES.defesa}<b>${escudo}</b>`;
}

function renderInimigo() {
  const ini = Luta.inimigo;
  const int = intencaoAtual();
  $('#progresso-pips').innerHTML = INIMIGOS.map((_, k) =>
    `<i class="pip ${k < Run.luta ? 'pip--feito' : k === Run.luta ? 'pip--atual' : ''}"></i>`).join('');
  $('#progresso-turno').textContent = `Luta ${Run.luta + 1} de ${INIMIGOS.length} · Turno ${Luta.turno}`;
  $('#inimigo-nome').textContent = ini.nome;
  renderBarra('#barra-inimigo', ini.vida, ini.vidaMax, ini.escudo);

  const intencao = $('#intencao');
  intencao.dataset.tipo = int.tipo;
  $('#intencao-icone').innerHTML = ICONES[int.tipo];
  if (int.tipo === 'ataque') {
    const dano = danoDaIntencao(int);
    const vezes = int.vezes || 1;
    $('#intencao-valor').textContent = vezes > 1 ? `${dano}×${vezes}` : dano;
    $('#intencao-rotulo').innerHTML = vezes > 1
      ? `Vai atacar <b>${vezes} vezes</b>: <b>${dano}</b> de dano cada (${dano * vezes} no total)`
      : `Vai atacar: <b>${dano}</b> de dano`;
  } else if (int.tipo === 'defesa') {
    $('#intencao-valor').textContent = int.valor;
    $('#intencao-rotulo').innerHTML = `Vai se proteger: <b>+${int.valor}</b> de Escudo`;
  } else if (int.tipo === 'maldicao') {
    $('#intencao-valor').textContent = `+${int.valor}`;
    $('#intencao-rotulo').innerHTML = `Vai amaldiçoar: <b>${int.valor} Escórias</b> no seu baralho`;
  } else {
    $('#intencao-valor').textContent = `+${int.valor}`;
    $('#intencao-rotulo').innerHTML = `Vai se fortalecer: ataques <b>+${int.valor}</b>`;
  }
}

function renderJogador() {
  renderBarra('#barra-jogador', Run.vida, VIDA_MAX, Luta.escudo);
  $('#barra-jogador').classList.toggle('critica', Run.vida <= VIDA_MAX * 0.3);
  $('#energia-valor').textContent = Luta.energia;
  $('#energia-max').textContent = `/${ENERGIA_POR_TURNO}`;
  $('#energia-liquido').style.height = pct(Luta.energia, ENERGIA_POR_TURNO);
  $('#globo-energia').classList.toggle('vazio', Luta.energia === 0);
  $('#pilha-compra').textContent = Luta.compra.length;
  $('#pilha-descarte').textContent = Luta.descarte.length;
}

/* Círculo de Transmutação: 5 casas em pentagrama. As cartas entram em ordem;
   cada elo entre duas cartas vizinhas pode virar uma Reação. O centro mostra
   o total que a transmutação vai causar. */
function renderCirculo() {
  const n = Luta.circulo.length;
  const pentagrama = Array.from({ length: CIRCULO_MAX }, (_, i) => {
    const [x1, y1] = slotXY(i), [x2, y2] = slotXY((i + 2) % CIRCULO_MAX);
    return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`;
  }).join('');

  let elos = '', rotulos = '';
  for (let i = 1; i < n; i++) {
    const [x1, y1] = slotXY(i - 1), [x2, y2] = slotXY(i);
    const r = Luta.elos[i];
    elos += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" data-i="${i}" class="elo-c${r ? ' elo-c--reacao' : ''}"${r ? ` style="--cor:${r.cor}"` : ''}/>`;
    if (r) {
      // rótulo no meio do elo, empurrado para fora do círculo
      const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
      const d = Math.hypot(mx - 120, my - 120) || 1;
      const lx = mx + ((mx - 120) / d) * 22, ly = my + ((my - 120) / d) * 22;
      rotulos += `<text x="${lx}" y="${ly + 4}" class="elo-rotulo" style="fill:${r.cor}">${r.nome}</text>`;
    }
  }

  const casas = Array.from({ length: CIRCULO_MAX }, (_, i) => {
    const [x, y] = slotXY(i);
    const id = Luta.circulo[i];
    if (!id) {
      const proxima = i === n && !Luta.ocupado;
      return `<g class="slot slot--vazio${proxima ? ' slot--proxima' : ''}" data-i="${i}">
        <circle cx="${x}" cy="${y}" r="${SLOT_TAM - 3}" class="slot-borda"/>
        <text x="${x}" y="${y + 4}" class="slot-num">${i + 1}</text></g>`;
    }
    const c = CARTAS[id];
    const cor = ELEMENTOS[c.elemento]?.cor || COR_MALDICAO;
    const arte = arteCarta(id).replace('<svg ', `<svg x="${x - 34}" y="${y - SLOT_TAM}" width="68" height="${SLOT_TAM * 2}" preserveAspectRatio="xMidYMid slice" `);
    return `<g class="slot" data-i="${i}" style="--cor:${cor}">
      <clipPath id="casa-${i}"><circle cx="${x}" cy="${y}" r="${SLOT_TAM - 2}"/></clipPath>
      <circle cx="${x}" cy="${y}" r="${SLOT_TAM}" class="slot-fundo"/>
      <g clip-path="url(#casa-${i})">${arte}</g>
      <circle cx="${x}" cy="${y}" r="${SLOT_TAM}" class="slot-anel"/></g>`;
  }).join('');

  const { dano, escudo, mult } = totaisCirculo();
  const icone = (svg, x, y, cor) => svg.replace("<svg ", `<svg x="${x}" y="${y}" width="16" height="16" style="color:${cor}" `);
  const centro = !n ? `<text x="120" y="124" class="centro-vazio">vazio</text>`
    : [mult > 1 && `<text x="120" y="96" class="centro-mult">×${mult}</text>`,
       dano && `${icone(ICONES.ataque, 96, 99, "#ff8a73")}<text x="116" y="113" class="centro-num centro-num--dano">${dano}</text>`,
       escudo && `${icone(ICONES.defesa, 96, (dano ? 121 : 110), "#a9d0f2")}<text x="116" y="${dano ? 135 : 124}" class="centro-num centro-num--escudo">${escudo}</text>`,
       !dano && !escudo && `<text x="120" y="124" class="centro-vazio">nada</text>`]
      .filter(Boolean).join('');

  // marcadores do preço em volta do altar: dourado = pago, vazado = falta, roxo = excesso
  const preco = precoTroca(), valor = valorOferenda(), troca = estadoTroca();
  const totalPips = Math.max(preco, valor);
  const pips = !n ? '' : Array.from({ length: totalPips }, (_, k) => {
    const a = -Math.PI / 2 + ((k - (totalPips - 1) / 2) * 0.32);
    const x = 120 + 47 * Math.cos(a), y = 120 + 47 * Math.sin(a);
    const classe = k >= preco ? 'excesso' : k < valor ? 'pago' : (valor ? 'falta' : 'livre');
    return `<path d="M${x} ${y - 4.5} L${x + 4} ${y} L${x} ${y + 4.5} L${x - 4} ${y} Z" class="pip-preco pip-preco--${classe}"/>`;
  }).join('');

  $('#circulo').innerHTML = `<svg viewBox="0 0 240 240">
    <circle cx="120" cy="120" r="116" class="circ-anel circ-anel--externo"/>
    <circle cx="120" cy="120" r="108" class="circ-anel"/>
    <circle cx="120" cy="120" r="108" class="circ-desenho" pathLength="100"/>
    <circle cx="120" cy="120" r="99" class="circ-runas"/>
    <g class="pentagrama">${pentagrama}</g>
    <circle cx="120" cy="120" r="38" class="circ-miolo miolo-alvo${troca ? ` circ-miolo--${troca}` : ''}${Luta.modoOferenda ? ' circ-miolo--aberto' : ''}"/>
    ${elos}${casas}${rotulos}${pips}
    <g class="centro-totais">${centro}</g>
  </svg>`;

  const sobra = valor - preco;
  $('#cat-dica').innerHTML =
    !n ? 'Clique nas cartas para colocá-las no círculo.'
    : troca === 'equivalente'
      ? `<b class="t-ouro">⚖ Equivalência:</b> o resultado dobra.${sobra > 0 ? ` <span class="t-apagado">(${sobra} de excesso será perdido)</span>` : ''}`
    : troca === 'imperfeita'
      ? `<b class="t-perigo">Imperfeita:</b> faltam ${-sobra}. Dobra, mas a realidade vai cobrar o resto.`
    : Luta.modoOferenda
      ? `Preço: <b>${preco}</b>. Clique numa carta para sacrificá-la (some do baralho) ou ofereça vida.`
    : Luta.catalisador
      ? `Próxima carta de outro elemento reage com <b style="color:${ELEMENTOS[Luta.catalisador].cor}">${ELEMENTOS[Luta.catalisador].nome}</b>.`
      : 'Aperte <b>Transmutar</b> quando estiver pronto.';
  renderOferenda();
}

/* botões do altar, logo abaixo do círculo */
function renderOferenda() {
  const painel = $('#oferenda-painel');
  const pode = Luta.circulo.length > 0 && !Luta.ocupado;
  painel.hidden = !pode && !Luta.oferenda.length;
  painel.classList.toggle('aberto', Luta.modoOferenda);
  $('#btn-oferenda').innerHTML = Luta.modoOferenda ? '✓ Concluir oferenda' : '⚖ Oferenda';
  $('#btn-oferenda').disabled = !pode;
  $('#btn-vida').hidden = !Luta.modoOferenda;
  $('#btn-vida').textContent = `+ ${VIDA_POR_VALOR} de vida${Luta.vidaOferecida ? ` (${Luta.vidaOferecida * VIDA_POR_VALOR} oferecida)` : ''}`;
  $('#btn-desfazer').hidden = !(Luta.oferenda.length || Luta.vidaOferecida) || Luta.ocupado;
}

const INICIAIS = new Set(DECK_INICIAL);

function criarCarta(id, i = 0, n = 1) {
  const c = CARTAS[id];
  const el = document.createElement('button');
  el.type = 'button';
  const el2 = ELEMENTOS[c.elemento]; // Escória não tem elemento
  el.className = `carta carta--${c.elemento || 'maldicao'}${INICIAIS.has(id) || !el2 ? '' : ' carta--rara'}`;
  el.style.setProperty('--cor', el2 ? el2.cor : COR_MALDICAO);
  el.style.setProperty('--rot', `${(i - (n - 1) / 2) * 2}deg`);
  // efeitos como linhas de ícone + número: lê-se num relance
  const linhas = [
    c.dano && `<span class="ef ef--dano">${ICONES.ataque}<b>${c.dano}</b> dano</span>`,
    c.escudo && `<span class="ef ef--escudo">${ICONES.defesa}<b>${c.escudo}</b> Escudo</span>`,
    c.compra && `<span class="ef ef--compra">${ICONES.compra}compra <b>${c.compra}</b></span>`,
    c.some && `<span class="ef ef--some">não faz nada,<br>some ao jogar</span>`
  ].filter(Boolean).join('');
  el.innerHTML = `
    <span class="carta-custo">${c.custo}</span>
    <span class="carta-nome">${c.nome}</span>
    <span class="carta-arte">${arteCarta(id)}${el2 ? `<span class="carta-selo">${glifo(c.elemento)}</span>` : ''}</span>
    <span class="carta-efeito">${linhas}</span>
    <span class="carta-tipo">${el2 ? el2.nome : 'Maldição'}</span>`;
  return el;
}

function renderMao() {
  const mao = $('#mao');
  mao.innerHTML = '';
  const n = Luta.mao.length;
  mao.style.setProperty('--n', n);
  Luta.mao.forEach((id, i) => {
    const el = criarCarta(id, i, n);
    const c = CARTAS[id];
    const oferta = Luta.modoOferenda;
    const reacao = oferta ? null : reacaoEntre(Luta.catalisador, c.elemento);
    if (reacao) {
      el.classList.add('reage');
      el.insertAdjacentHTML('beforeend', `<span class="carta-reacao">⚗ ${reacao.nome}</span>`);
    }
    if (oferta) {
      // no modo Oferenda a carta mostra quanto vale para o altar, não o custo
      el.classList.add('sacrificavel');
      el.insertAdjacentHTML('beforeend', `<span class="carta-reacao carta-sacrificio">⚖ vale ${valorCarta(id)}</span>`);
    } else if (c.custo > Luta.energia) {
      el.classList.add('cara');
    }
    if (Luta.selecionada === i) el.classList.add('selecionada');
    el.setAttribute('aria-label', oferta
      ? `Sacrificar ${c.nome}: vale ${valorCarta(id)} na oferenda e sai do baralho.`
      : `${c.nome}, ${ELEMENTOS[c.elemento]?.nome ?? 'Maldição'}, custo ${c.custo}: ${textoCarta(c)}${reacao ? ` Causa ${reacao.nome}: ${reacao.texto}.` : ''}`);
    el.addEventListener('click', e => {
      // no toque, cartas sobrepostas ficam ilegíveis: o 1º toque só levanta a carta
      if (!temMouse && e.detail > 0 && Luta.selecionada !== i) {
        e.stopPropagation(); // senão o clique-fora do document desfaz a seleção
        Luta.selecionada = i;
        Som.selecionar();
        renderMao();
        return;
      }
      if (Luta.modoOferenda) sacrificar(i);
      else jogarCarta(i);
    });
    ligarTilt(el);
    mao.appendChild(el);
  });
}

function renderTudo() {
  renderInimigo();
  renderJogador();
  renderCirculo();
  renderMao();
  const btn = $('#btn-turno');
  const carregado = Luta.circulo.length > 0;
  btn.disabled = Luta.ocupado || Luta.voando;
  btn.innerHTML = carregado ? '<span>Trans&shy;mutar</span>' : '<span>Fim do<br>turno</span>';
  btn.classList.toggle('carregado', carregado);
  // nada mais para jogar: o selo pulsa para sugerir transmutar / encerrar o turno
  const temJogada = Luta.circulo.length < CIRCULO_MAX && Luta.mao.some(id => CARTAS[id].custo <= Luta.energia);
  btn.classList.toggle('sugerido', !Luta.ocupado && !temJogada);
}

/* ── Feedback na tela ────────────────────────────────────────── */

function flutuar(sel, texto, tipo) {
  const r = $(sel).getBoundingClientRect();
  const s = document.createElement('span');
  s.className = `flutua flutua--${tipo}`;
  s.textContent = texto;
  s.style.left = `${r.left + r.width / 2}px`;
  s.style.top = `${r.top + r.height / 2}px`;
  document.body.appendChild(s);
  setTimeout(() => s.remove(), 1100);
}

function piscarDano() {
  const el = $('#flash-dano');
  el.classList.remove('ativo');
  void el.offsetWidth;
  el.classList.add('ativo');
}

function bannerTurno(texto, tipo = 'jogador') {
  const el = $('#banner-turno');
  el.textContent = texto;
  el.className = `banner--${tipo}`;
  void el.offsetWidth;
  el.classList.add('mostra');
}

/* põe uma classe de animação por um instante (reinicia se já estiver lá) */
function marcar(sel, classe, ms = 220) {
  const el = $(sel);
  el.classList.remove(classe);
  void el.offsetWidth;
  el.classList.add(classe);
  setTimeout(() => el.classList.remove(classe), ms);
}

function tremer(sel) {
  const el = $(sel);
  el.classList.remove('treme');
  void el.offsetWidth;
  el.classList.add('treme');
}

function anunciar(texto, tipo) {
  const el = $('#anuncio');
  el.textContent = texto;
  el.className = `anuncio--${tipo}`;
  void el.offsetWidth;
  el.classList.add('mostra');
}

function piscarGlobo() {
  const globo = $('#globo-energia');
  globo.classList.remove('sem-energia');
  void globo.offsetWidth;
  globo.classList.add('sem-energia');
}

/* ── Tilt 3D estilo Balatro (só com mouse) ───────────────────── */

const temMouse = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

function ligarTilt(el) {
  if (reduzMovimento || !temMouse) return;
  el.addEventListener('mouseenter', () => el.classList.add('em-foco'));
  el.addEventListener('mousemove', e => {
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    el.style.transform =
      `translateY(-28px) scale(1.12) rotateY(${(px * 24).toFixed(1)}deg) rotateX(${(-py * 24).toFixed(1)}deg)`;
  });
  el.addEventListener('mouseleave', () => {
    el.classList.remove('em-foco');
    el.style.transform = '';
  });
}

/* ── Guia ────────────────────────────────────────────────────── */

function montarGuia() {
  const linhas = Object.entries(REACOES).map(([chave, r]) => {
    const [a, b] = chave.split('+');
    return `<div class="guia-reacao">
      <span class="guia-par">${glifo(a)}<span>+</span>${glifo(b)}</span>
      <span><b>${r.nome}</b> ${r.texto}</span></div>`;
  });
  $('#guia-reacoes').innerHTML = linhas.join('');
}

function abrirGuia() { $('#guia').hidden = false; $('#btn-fechar-guia').focus(); }
function fecharGuia() {
  $('#guia').hidden = true;
  try { localStorage.setItem('covenant-guia-visto', '1'); } catch {}
}

/* ── Canvas: estrelas, fagulhas e partículas de Reação ───────── */

const Fundo = {
  canvas: null, ctx: null, w: 0, h: 0,
  estrelas: [], fagulhas: [], particulas: [],

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
    this.fagulhas = Array.from({ length: 26 }, () => this.novaFagulha(Math.random()));
    if (reduzMovimento) this.desenhar();
    else this.loop();
  },

  novaFagulha(y = 1.05) {
    return { x: Math.random(), y, v: 0.0006 + Math.random() * 0.0012, r: Math.random() * 1.4 + 0.6, fase: Math.random() * 6 };
  },

  /* explosão de Reação, saindo do centro do Círculo dos Elementos */
  explodir(cores) {
    if (reduzMovimento) return;
    const c = $('#circulo').getBoundingClientRect();
    const base = this.canvas.getBoundingClientRect();
    const cx = c.left + c.width / 2 - base.left, cy = c.top + c.height / 2 - base.top;
    for (let k = 0; k < 60; k++) {
      const a = Math.random() * Math.PI * 2, v = 1.5 + Math.random() * 5;
      this.particulas.push({ x: cx, y: cy, vx: Math.cos(a) * v, vy: Math.sin(a) * v,
        vida: 1, r: 1.5 + Math.random() * 2.5, cor: cores[k % cores.length] });
    }
  },

  redimensionar() {
    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.parentElement.getBoundingClientRect();
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.w = rect.width;
    this.h = rect.height;
    if (reduzMovimento) this.desenhar();
  },

  loop() {
    this.desenhar();
    requestAnimationFrame(() => this.loop());
  },

  desenhar() {
    const { ctx, w, h } = this;
    ctx.clearRect(0, 0, w, h);

    for (const e of this.estrelas) {
      ctx.fillStyle = `rgba(210,215,235,${e.a})`;
      ctx.beginPath();
      ctx.arc(e.x * w, e.y * h, e.r, 0, Math.PI * 2);
      ctx.fill();
    }

    // fagulhas douradas subindo devagar
    for (let k = 0; k < this.fagulhas.length; k++) {
      const f = this.fagulhas[k];
      if (!reduzMovimento) f.y -= f.v;
      if (f.y < -0.05) this.fagulhas[k] = this.novaFagulha();
      const x = (f.x + Math.sin(f.y * 8 + f.fase) * 0.01) * w;
      ctx.fillStyle = `rgba(240,200,110,${0.25 + 0.35 * Math.abs(Math.sin(f.y * 3.1))})`;
      ctx.beginPath();
      ctx.arc(x, f.y * h, f.r, 0, Math.PI * 2);
      ctx.fill();
    }

    // partículas de Reação
    this.particulas = this.particulas.filter(p => p.vida > 0);
    for (const p of this.particulas) {
      p.x += p.vx; p.y += p.vy;
      p.vx *= 0.94; p.vy *= 0.94;
      p.vida -= 0.018;
      ctx.globalAlpha = Math.max(0, p.vida);
      ctx.fillStyle = p.cor;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * (0.5 + p.vida), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
};

/* ── Bootstrap ───────────────────────────────────────────────── */

document.addEventListener('DOMContentLoaded', () => {
  // toda dupla de elementos diferentes precisa ter uma Reação
  const ids = Object.keys(ELEMENTOS);
  for (const a of ids) for (const b of ids) {
    console.assert(a === b || reacaoEntre(a, b), `Falta Reação para ${a}+${b}`);
  }

  Fundo.init();
  montarGuia();
  $('#btn-turno').addEventListener('click', fimDoTurno);
  $('#btn-denovo').addEventListener('click', iniciarRun);
  $('#btn-pular').addEventListener('click', () => escolherRecompensa(null));
  $('#btn-guia').addEventListener('click', abrirGuia);
  $('#btn-fechar-guia').addEventListener('click', fecharGuia);
  document.addEventListener('click', e => {
    if (Luta.selecionada !== null && !e.target.closest('#mao')) {
      Luta.selecionada = null;
      renderMao();
    }
  });
  $('#btn-oferenda').addEventListener('click', alternarOferenda);
  $('#btn-vida').addEventListener('click', oferecerVida);
  $('#btn-desfazer').addEventListener('click', desfazerOferenda);
  // clicar no centro do círculo também abre/fecha o altar
  $('#circulo').addEventListener('click', e => { if (e.target.closest('.miolo-alvo')) alternarOferenda(); });
  $('#retrato-jogador').innerHTML = RETRATO_ALQUIMISTA;
  $('#titulo-selo').innerHTML = SELO_TITULO;
  $('#btn-lutar').addEventListener('click', iniciarLuta);
  $('#btn-titulo-guia').addEventListener('click', abrirGuia);
  $('#btn-som').addEventListener('click', () => { Som.iniciar(); Som.alternarMudo(); iconeSom(); });
  iconeSom();

  // o clique em "Começar" também é o gesto que libera o áudio no navegador
  $('#btn-comecar').addEventListener('click', () => {
    Som.iniciar();
    iconeSom();
    $('#titulo').hidden = true;
    iniciarRun();
    let visto = false;
    try { visto = localStorage.getItem('covenant-guia-visto') === '1'; } catch {}
    if (!visto) abrirGuia();
  });
  $('#btn-comecar').focus();

  /* gancho de depuração/testes */
  window.Covenant = { Run, Luta, CARTAS, Teste, jogarCarta, fimDoTurno, escolherRecompensa, iniciarRun, iniciarLuta };
});

function iconeSom() {
  const mudo = Som.mudo;
  $('#btn-som').setAttribute('aria-label', mudo ? 'Som desligado' : 'Som ligado');
  $('#btn-som').innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M4 9 H8 L13 5 V19 L8 15 H4 Z" fill="currentColor"/>
    ${mudo ? '<path d="M17 9 L22 14 M22 9 L17 14"/>' : '<path d="M16.5 8.5 a5 5 0 0 1 0 7 M19 6 a8.5 8.5 0 0 1 0 12"/>'}</svg>`;
}
