# Alchemist's Covenant — GDD v2 (Clean UI)

> Deck-builder de navegador. Referência absoluta de interface: **Slay the Spire** e **Balatro**.
> Regra de ouro: se um elemento não ajuda a decidir a próxima jogada, ele não fica na tela.
> (A versão anterior, "observatório denso", está preservada em `v1-observatorio/`.)

---

## 1. Filosofia de Design

1. **Três zonas, três perguntas.** A tela responde, de cima para baixo:
   *"O que o inimigo vai fazer?"* → *"Como estão meus Daemons?"* → *"O que eu posso jogar?"*
2. **Um número por elemento.** Cada Daemon mostra UM ícone de status e UM número (ciclo de
   ativação). O inimigo mostra UMA intenção. O jogador tem UM globo de Energia.
3. **Sem crônica lateral, sem painéis.** Feedback acontece no próprio elemento (flash, escala,
   número que pulsa) e no console (dev). Nada de texto correndo na lateral.
4. **Flat + ouro.** Ícones vetoriais chapados (glifos alquímicos), brilho dourado só em foco/hover.
   Fundo: vazio espacial sutil em Canvas — poucas estrelas, um anel de transmutação tênue.

---

## 2. Etapa 1 — Layout técnico em blocos

```
body
└─ #jogo ......................... display:grid · grid-template-rows: auto 1fr minmax(260px, 33vh)
   │                               100vh, overflow hidden — nada rola, tudo cabe
   │
   ├─ header#zona-inimigo ........ O PARADOXO (centralizado)
   │   └─ .inimigo ............... flex-column, centrado
   │       ├─ .inimigo-nome ...... nome curto
   │       ├─ .inimigo-intencao .. ÍCONE GRANDE + número (o que ele fará no próximo turno)
   │       └─ .inimigo-vida ...... barra de Estabilidade + valor numérico
   │
   ├─ main#zona-tabuleiro ........ position:relative (o Círculo)
   │   ├─ canvas#vazio ........... position:absolute inset:0 — céu sutil + anel de transmutação
   │   └─ #circulo-nos ........... flex centrado com gap largo — SOMENTE os slots
   │       └─ .slot-daemon (×2) .. glifo grande + ⚔dano + NÚMERO do ciclo de ativação
   │
   └─ footer#zona-mao ............ display:grid · grid-template-columns: 128px 1fr 128px
       ├─ #globo-energia ......... globo único e limpo com o número da Energia
       ├─ #mao ................... cartas grandes, leve leque, perspective p/ tilt 3D
       └─ #btn-turno ............. botão circular "Selar" (encerra o turno)
```

**Por que Grid nas linhas e Flex dentro:** o Grid garante que inimigo/tabuleiro/mão nunca
invadam o espaço um do outro (a mão SEMPRE ocupa o terço inferior); Flex resolve o
centramento interno de cada zona sem cálculo manual.

---

## 3. Etapa 2 — Design de cartas (efeito em < 10 palavras)

Anatomia da carta: **custo** no canto superior esquerdo (círculo dourado) · **nome** ·
**glifo flat central** · **uma linha de efeito** · rodapé com o tipo (Matéria = ouro, Lei = azul).

| Carta | Tipo | Custo | Efeito (contagem de palavras) |
|---|---|---|---|
| **Mercúrio Fugaz** ☿ | Matéria | 1 | *"O Daemon ativa 1 ciclo mais cedo."* (7) |
| **Essência Solar** ☉ | Matéria | 2 | *"+3 de dano à ativação do Daemon."* (7) |
| **Lei da Troca Equivalente** ⚖ | Lei | 0 | *"Sacrifique 3 Energia: a próxima ativação dobra."* (7) |

A **Lei da Troca Equivalente** é o modelo da mecânica de sacrifício: custo zero no canto
(leitura honesta), mas o corpo exige o sacrifício — poder de graça não existe.

**Combo de leitura imediata:** Essência Solar (dano ↑) → Lei da Troca (dobra) → Mercúrio (antecipa).

---

## 4. Interações (a "física" Balatro)

- **Hover:** a carta sobe (`translateY(-28px)`), escala `1.12` e **inclina em 3D seguindo o
  cursor** (`rotateX/rotateY` até ±12°, perspective 900px no contêiner). Saída com transição
  suave de 350ms — a carta "assenta" de volta.
- **Repouso:** cada carta tem rotação própria de ±2° (leque) e flutuação idle sutil.
- **Drag:** a carta vira alvo do arrasto; os slots de Daemon acendem borda dourada no dragover.
- **Ativação de Daemon:** flash dourado no slot + número do ciclo pulsa. Sem partículas.
- `prefers-reduced-motion`: tilt e flutuação desligados; feedback vira apenas cor/contorno.

## 5. Loop estrutural (main.js)

Turno: jogar cartas (arrastar ao Daemon, pagar Energia) → **Selar** → ciclos dos Daemons
decrementam; ao chegar a 0, ativam (dano na Estabilidade) e recomeçam → o Paradoxo executa a
intenção anunciada e anuncia a próxima → Energia recarrega. Toda transmutação é logada no
console (comportamento antes → depois).

## 6. Arquitetura

`index.html` (blocos acima) · `style.css` (Grid/Flex, tokens em `:root`, flat + ouro) ·
`main.js` (estado central, render por zona, DnD nativo, tilt 3D, canvas mínimo).
