# Alchemist's Covenant — GDD v3 (Combate direto + Reações)

> Deck-builder de navegador. Estrutura de combate do **Slay the Spire**, física de carta do **Balatro**.
> Regra de ouro: toda carta faz algo **na hora**, e a tela mostra o que vai acontecer **antes**.
> (A v2, com Daemons e ciclos, foi trocada porque a relação carta → efeito ficava escondida.
> A v1 "observatório denso" segue em `v1-observatorio/`, fora do repositório.)

---

## 1. Loop

**Run** = 3 lutas seguidas. Vida 50, que **não** volta cheia: +10 entre lutas.
Depois de cada vitória, escolha 1 de 3 cartas para o baralho (ou pule).

**Turno:** 3 de Energia · compra 5 cartas · jogar cartas (clique) · **Fim do turno** →
a mão vai para o descarte, o inimigo executa a intenção anunciada → novo turno.
Escudo zera no começo do seu turno; o escudo do inimigo zera no começo do turno dele.
Baralho vazio → o descarte é embaralhado de volta.

## 2. Elementos e Reações (o núcleo alquímico)

Três elementos, um triângulo: **Fogo** (dano), **Água** (escudo), **Terra** (dano + escudo).
O último elemento jogado vira o **Catalisador**. Jogar um elemento **diferente** em seguida dispara
a Reação do par e consome o Catalisador. O mesmo elemento só substitui o Catalisador.
O Catalisador some no fim do turno. (v3.1: o Ar saiu para reduzir de 6 para 3 Reações.)

| Par | Reação | Efeito |
|---|---|---|
| Fogo + Terra | Magma | +8 de dano |
| Água + Terra | Lama | +8 de Escudo |
| Fogo + Água | Vapor | compre 2 cartas |

## 3. Cartas

Uma carta é só números (`dano`, `escudo`, `compra`); texto e ícones são gerados a partir deles.
Cada carta tem ilustração própria (`ARTES_CARTAS` em `arte.js`) e o glifo do elemento no canto.

Inicial (10): Faísca ×4 (Fogo, 1: 6 dano) · Gota ×3 (Água, 1: 5 escudo) ·
Pedra ×3 (Terra, 1: 4 dano + 3 escudo).

Recompensas (borda dourada): Labareda (Fogo, 2: 14 dano) · Brasa (Fogo, 0: 3 dano) ·
Maré (Água, 2: 12 escudo) · Orvalho (Água, 0: 2 escudo, compra 1) ·
Terremoto (Terra, 2: 9 dano + 7 escudo) · Seixo (Terra, 0: 2 dano + 2 escudo).

## 4. Inimigos (intenções em ciclo fixo)

| Luta | Inimigo | Vida | Padrão |
|---|---|---|---|
| 1 | Homúnculo Falho | 30 | ataque 6 → ataque 8 → defesa 6 |
| 2 | Quimera de Mercúrio | 42 | ataque 9 → defesa 8 → ataque 12 |
| 3 | O Paradoxo | 60 | ataque 10 → fortalecer +3 → ataque 8 → defesa 10 |

## 5. HUD

```
topo ....... ◆◇◇ Luta X de 3 · Turno N
             arena: criatura em SVG sobre plataforma de transmutação + balão de intenção (ícone + valor)
             placa: nome · barra de vida com moldura, rastro de dano e brasão de Escudo · rótulo da intenção
centro ..... Triângulo dos Elementos: 3 nós, 3 elos (cada elo = uma Reação). O Catalisador acende
             e os elos dele mostram o nome da Reação. Faixas "Seu turno" / "Turno do inimigo".
rodapé ..... [frasco de Energia com líquido] [placa da Alquimista: vida, Escudo, pilhas] [selo de cera]
             mão: cada carta mostra o selo "⚗ Reação" que causaria agora
```

- Inimigos: Homúnculo Falho (argila com brasa nas rachaduras), Quimera de Mercúrio (leão, cabra
  e serpente de cromo líquido), O Paradoxo (triângulo com olho, anéis de runas). Respiram,
  investem ao atacar e se dissolvem ao morrer.
- Feedback: número que sobe do alvo, tremida, flash vermelho nas bordas ao levar dano,
  explosão de partículas nas cores da Reação, selo de fim de turno pulsa quando não há jogada.
- O Círculo usa a altura que sobra (container query), então cabe em telas baixas.
- **Mouse:** clique joga; hover faz o tilt 3D. **Toque:** 1º toque levanta a carta (legível), 2º joga.
- Teclado: cartas são `<button>`; Enter joga direto.
- Guia "Como jogar" na primeira visita e no botão `?`.
- `prefers-reduced-motion`: sem tilt, flutuação e animações.

## 6. Arquitetura

`index.html` (zonas + sobreposições) · `style.css` (Grid/Flex, tokens em `:root`) ·
`arte.js` (SVG dos inimigos) · `main.js` (dados → estado `Run`/`Luta` → render por zona).
Gancho de teste: `window.Covenant`.

## 7. v3.2 — Som, desafio e identidade

- **Identidade:** tela de título (selo animado, "Toda troca tem um preço."), tela de história com
  a criatura e um parágrafo antes de cada luta (Capítulos I–III), retrato da Alquimista
  (capuz, máscara, lentes verdes acesas) na placa; o anel fica vermelho com vida crítica.
- **Desafio:** intenções novas: ataque com vários golpes (`vezes`, mostrado como 7×3) e
  **maldição**, que põe **Escória** no descarte (custa 1, não faz nada, some ao ser jogada).
  Inimigos: Homúnculo 50 · Quimera 80 · Paradoxo 120. Reações Magma/Lama = +6. Cura entre lutas 8.
  Balanceado com 24 partidas automáticas (`Teste.rapido`): bot guloso vence ~70%, termina com
  ~11 de vida e quase sempre perde no Paradoxo.
- **Impacto:** a carta voa da mão até o alvo antes do efeito; o inimigo pisca ao ser atingido.
- **Som (`audio.js`, Web Audio, sem arquivos):** drone em Ré menor com sinos e eco; efeitos para
  carta, dano, escudo, bloqueio, cada Reação (acorde próprio), ataque/defesa/maldição do inimigo,
  turnos, vitória e derrota. Botão de mudo salvo no navegador. O áudio nasce no clique de "Começar".

## 8. v3.3 — Círculo de Transmutação

O combate gira em torno de um **Círculo de Transmutação** com 5 casas em pentagrama:

1. **Colocar:** clicar numa carta paga a Energia e ela voa para a próxima casa do círculo.
   Compra de cartas (Orvalho, Vapor) acontece na hora; dano e Escudo ficam guardados.
2. **Reagir:** cada elo entre duas cartas vizinhas de elementos diferentes vira uma Reação
   (Magma +6 dano, Lama +6 Escudo, Vapor compra 2). A Escória ocupa uma casa e quebra a corrente.
3. **Prever:** o centro do círculo mostra o total de ⚔ dano e 🛡 Escudo que a transmutação vai causar.
4. **Transmutar** (o selo vira dourado quando há cartas): o círculo deita em 3D, gira, se desenha,
   acende casa por casa, levanta brilhando e dispara uma coluna de luz no inimigo com todo o dano
   somado. Depois o inimigo executa a intenção. Círculo vazio = "Fim do turno".

Inimigos redesenhados (v3.3): Homúnculo com núcleo em brasa exposto e textura de argila;
Quimera com cromo refletindo céu roxo e chão dourado, cabra de chifres espirais e naja na cauda;
Paradoxo com céu estrelado dentro do triângulo, três olhos no anel e veias no olho central.

## 9. v3.4 — Troca Equivalente

"Toda troca tem um preço." O centro do Círculo é um **altar** (botão ⚖ Oferenda ou clique no centro).

- **Preço** = metade das casas ocupadas, arredondado para cima (1–2 cartas → 1 · 3–4 → 2 · 5 → 3).
- **Pagamento:** cartas da mão (iniciais valem 1, raras de recompensa valem 2, Escória vale 1) e
  vida (6 de vida = 1). **Lei da Perda:** carta sacrificada sai do baralho pelo resto da run.
  Sacrificar Escória é o jeito de limpar a maldição. O baralho nunca cai abaixo de 5 cartas.
  "Desfazer" devolve tudo antes de transmutar; a vida só é paga na transmutação.
- **Equivalência** (oferenda ≥ preço): dano e Escudo ×2, círculo dourado. Excesso é perdido.
- **Transmutação Imperfeita** (oferenda < preço): ×2 também, círculo vermelho tremendo, e a
  realidade sorteia o que cobrar pela falta: **Rebote** (5 de dano por ponto, ignora Escudo,
  pode matar), **Cicatriz** (cartas do baralho viram Escória permanente) ou **Exaustão**
  (−1 de Energia por ponto no próximo turno).
- Prévia: marcadores ◆ em volta do altar (dourado = pago, vazado = falta, roxo = excesso) e o
  centro mostra o total já multiplicado.
- Balanceamento: o bot das simulações não usa a Troca; ela é poder opcional com custo real.
