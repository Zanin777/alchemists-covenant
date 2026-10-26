/* ═══════════════════════════════════════════════════════════════
   Arte dos inimigos — SVG com gradientes, luz de contorno e brilho.
   Cada arte tem ids prefixados (hm-, qm-, px-) para não colidir.
   ═══════════════════════════════════════════════════════════════ */

'use strict';

/* polígono estrelado: n pontas alternando raio externo/interno */
function estrela(cx, cy, rExt, rInt, n, giro = 0) {
  return Array.from({ length: n * 2 }, (_, k) => {
    const r = k % 2 ? rInt : rExt;
    const a = giro + (k * Math.PI) / n;
    return `${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`;
  }).join(' ');
}

const BRILHO = id => `<filter id="${id}" x="-60%" y="-60%" width="220%" height="220%">
  <feGaussianBlur stdDeviation="2.6" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`;

const ARTES = {
  /* Homúnculo Falho — argila curvada que quebrou o próprio frasco.
     O peito rachou e mostra o núcleo em brasa; a luz dele sobe pelo rosto. */
  homunculo: `
    <defs>
      <radialGradient id="hm-argila" cx="40%" cy="25%" r="85%">
        <stop offset="0" stop-color="#d9a57a"/><stop offset=".45" stop-color="#94623f"/><stop offset="1" stop-color="#3a2216"/>
      </radialGradient>
      <radialGradient id="hm-cabeca" cx="38%" cy="25%" r="80%">
        <stop offset="0" stop-color="#e8bf96"/><stop offset=".5" stop-color="#a26f50"/><stop offset="1" stop-color="#43281a"/>
      </radialGradient>
      <radialGradient id="hm-nucleo">
        <stop offset="0" stop-color="#fffbe6"/><stop offset=".3" stop-color="#ffd25a"/><stop offset=".7" stop-color="#ff7a1a"/><stop offset="1" stop-color="#ff5a00" stop-opacity="0"/>
      </radialGradient>
      <radialGradient id="hm-luz-baixo" cx="50%" cy="100%" r="80%">
        <stop offset="0" stop-color="#ff8a2a" stop-opacity=".55"/><stop offset="1" stop-color="#ff8a2a" stop-opacity="0"/>
      </radialGradient>
      <linearGradient id="hm-vidro" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#e8f6ff" stop-opacity=".75"/><stop offset="1" stop-color="#9fd0f5" stop-opacity=".12"/>
      </linearGradient>
      <filter id="hm-textura" x="0" y="0" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="7" result="n"/>
        <feColorMatrix in="n" type="matrix" values="0 0 0 0 .12  0 0 0 0 .06  0 0 0 0 .03  0 0 0 .9 -.25" result="m"/>
        <feComposite in="m" in2="SourceGraphic" operator="in" result="t"/>
        <feMerge><feMergeNode in="SourceGraphic"/><feMergeNode in="t"/></feMerge>
      </filter>
      ${BRILHO('hm-brilho')}
    </defs>
    <ellipse cx="100" cy="186" rx="64" ry="8" fill="rgba(0,0,0,.55)"/>
    <ellipse cx="100" cy="184" rx="40" ry="5" fill="#ff8a2a" opacity=".12"/>
    <g fill="url(#hm-vidro)" stroke="#cfeaff" stroke-width="1.2" stroke-opacity=".7">
      <path d="M22 186 L30 166 L38 186 Z"/><path d="M150 186 L160 170 L166 186 Z"/><path d="M42 188 L47 177 L53 188 Z"/>
      <path d="M170 160 Q178 156 182 164 L176 172 Z" opacity=".7"/>
    </g>
    <g stroke="#1f120a" stroke-width="3" stroke-linejoin="round" stroke-linecap="round" filter="url(#hm-textura)">
      <path d="M72 150 Q66 170 62 184 L82 184 Q86 168 90 156 Z" fill="url(#hm-argila)"/>
      <path d="M112 156 Q118 170 118 184 L138 184 Q134 166 128 150 Z" fill="url(#hm-argila)"/>
      <path d="M64 104 Q38 122 32 152 Q28 170 34 180 L50 182 Q54 176 50 168 Q50 146 72 126 Z" fill="url(#hm-argila)"/>
      <path d="M60 108 Q50 136 64 158 Q96 178 134 160 Q152 140 144 104 Q130 80 102 80 Q74 82 60 108 Z" fill="url(#hm-argila)"/>
      <path d="M138 108 Q158 116 162 134 Q164 146 156 148 Q150 146 150 138 Q146 126 132 122 Z" fill="url(#hm-argila)"/>
      <path d="M62 72 Q58 42 92 36 Q128 32 136 60 Q142 88 120 98 Q94 108 78 98 Q64 88 62 72 Z" fill="url(#hm-cabeca)"/>
    </g>
    <g stroke="#1f120a" stroke-width="2.2" stroke-linecap="round" fill="none">
      <path d="M34 180 l-5 5 M41 182 l-2 5 M48 182 l1 5"/><path d="M156 148 l2 7 M161 145 l5 5"/>
      <path d="M74 56 Q86 49 98 56"/><path d="M108 54 Q118 50 128 56"/>
      <path d="M80 86 Q99 79 120 86"/>
      <path d="M84 82 L82 91 M91 81 L90 90 M99 80 L99 89 M107 81 L108 90 M114 83 L116 91"/>
      <path d="M74 132 Q100 146 130 130" stroke-width="1.8"/>
      <path d="M80 130 L79 138 M90 135 L90 143 M110 136 L111 143 M121 133 L123 140" stroke-width="1.6"/>
    </g>
    <ellipse cx="100" cy="122" rx="19" ry="16" fill="#140804" stroke="#1f120a" stroke-width="2"/>
    <circle cx="100" cy="122" r="22" fill="url(#hm-nucleo)" opacity=".55" class="brasa"/>
    <circle cx="100" cy="122" r="8" fill="url(#hm-nucleo)" filter="url(#hm-brilho)" class="olho-brilha"/>
    <g fill="none" stroke="#ffb347" stroke-width="1.8" stroke-linecap="round" filter="url(#hm-brilho)" class="brasa">
      <path d="M112 34 L106 48 L114 56 L107 68"/><path d="M118 116 L128 108 L134 112"/><path d="M84 112 L74 104 L70 108"/>
      <path d="M96 138 L92 150 L97 156"/><path d="M128 120 L121 126"/>
    </g>
    <path d="M58 64 Q76 104 140 70" fill="url(#hm-luz-baixo)" opacity=".7"/>
    <g fill="none" stroke="#c9a4ef" stroke-linecap="round" opacity=".45" stroke-width="2.4">
      <path d="M66 62 Q70 44 90 38"/><path d="M62 112 Q58 128 62 144"/><path d="M36 150 Q36 140 44 130"/>
    </g>
    <g fill="#5a3826"><ellipse cx="80" cy="150" rx="7" ry="4"/><circle cx="46" cy="160" r="2.6"/><path d="M150 140 q2 8 -1 12 q-3 -4 1 -12 Z"/></g>
    <ellipse cx="86" cy="64" rx="8" ry="9" fill="#fff1b8" filter="url(#hm-brilho)" class="olho-brilha"/>
    <ellipse cx="87" cy="65" rx="2.4" ry="5" fill="#7a3a06"/>
    <ellipse cx="119" cy="63" rx="7" ry="6" fill="#0c0603"/>
    <circle cx="120" cy="64" r="1.5" fill="#ff8a3a" class="olho-brilha"/>`,

  /* Quimera de Mercúrio — leão de cromo líquido, cabra de chifres espirais nas costas,
     naja na ponta da cauda. O cromo reflete o céu roxo em cima e o chão dourado embaixo. */
  quimera: `
    <defs>
      <linearGradient id="qm-cromo" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#efe6ff"/><stop offset=".22" stop-color="#cfd8e2"/>
        <stop offset=".5" stop-color="#5d6874"/><stop offset=".62" stop-color="#2c333b"/>
        <stop offset=".82" stop-color="#b9a46a"/><stop offset="1" stop-color="#f3e7c2"/>
      </linearGradient>
      <linearGradient id="qm-escuro" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#9aa6b2"/><stop offset=".55" stop-color="#2f363e"/><stop offset="1" stop-color="#8a7a4e"/>
      </linearGradient>
      <radialGradient id="qm-juba" cx="50%" cy="50%" r="50%">
        <stop offset=".4" stop-color="#2c333b"/><stop offset=".75" stop-color="#7d8a97"/><stop offset="1" stop-color="#d6deea"/>
      </radialGradient>
      <radialGradient id="qm-olho"><stop offset="0" stop-color="#fff6c8"/><stop offset=".5" stop-color="#ffcf4a"/><stop offset="1" stop-color="#c9781a"/></radialGradient>
      ${BRILHO('qm-brilho')}
    </defs>
    <ellipse cx="108" cy="187" rx="82" ry="8" fill="rgba(0,0,0,.55)"/>
    <path d="M40 186 Q108 176 178 186" fill="none" stroke="#cfd8e2" stroke-width="3" opacity=".25"/>
    <g stroke="#14181d" stroke-width="3" stroke-linejoin="round" stroke-linecap="round">
      <path d="M162 118 Q198 118 194 90 Q192 74 182 76" fill="none" stroke-width="14"/>
      <path d="M162 118 Q198 118 194 90 Q192 74 182 76" fill="none" stroke="url(#qm-cromo)" stroke-width="8"/>
      <path d="M170 64 Q186 54 198 70 Q200 90 184 96 Q168 90 170 64 Z" fill="url(#qm-cromo)"/>
      <path d="M176 76 Q186 72 194 80 Q190 92 182 92 Q174 88 176 76 Z" fill="url(#qm-escuro)"/>
      <path d="M80 136 Q78 160 76 180 L90 182 Q94 162 98 140 Z" fill="url(#qm-escuro)"/>
      <path d="M134 136 Q144 160 140 182 L153 182 Q160 158 152 134 Z" fill="url(#qm-escuro)"/>
      <path d="M118 92 Q118 66 132 56 L146 60 Q140 76 140 94 Z" fill="url(#qm-escuro)"/>
      <path d="M128 46 Q142 36 156 46 Q161 58 149 66 Q136 69 129 58 Z" fill="url(#qm-cromo)"/>
      <path d="M149 66 L146 78 L141 66" fill="url(#qm-escuro)"/>
      <path d="M46 118 Q40 92 66 84 Q90 80 112 88 Q132 84 150 90 Q172 98 170 120 Q168 138 152 142 Q146 154 138 144 Q124 152 112 144 Q100 155 90 144 Q74 152 64 140 Q48 136 46 118 Z" fill="url(#qm-cromo)"/>
      <path d="M150 126 Q170 150 164 176 Q164 184 172 184 L182 184 Q186 180 180 174 Q184 150 166 122 Z" fill="url(#qm-cromo)"/>
      <path d="M58 128 Q50 156 46 178 Q46 184 54 184 L66 184 Q70 182 66 176 Q70 158 80 140 Z" fill="url(#qm-cromo)"/>
      <polygon points="${estrela(70, 72, 46, 30, 13, -0.2)}" fill="url(#qm-juba)"/>
      <path d="M60 100 Q40 82 46 60 Q52 42 76 44 Q96 48 98 68 Q100 90 82 100 Z" fill="url(#qm-cromo)"/>
      <path d="M50 56 Q28 54 14 66 Q12 72 18 74 L52 74 Z" fill="url(#qm-cromo)"/>
      <path d="M18 82 Q32 100 58 90 L54 78 Z" fill="url(#qm-escuro)"/>
    </g>
    <g fill="none" stroke="#14181d" stroke-width="6" stroke-linecap="round">
      <path d="M138 46 C124 36 128 16 146 16 C162 16 166 34 154 40 C148 43 144 36 149 33"/>
      <path d="M146 44 C146 30 160 26 166 34"/>
    </g>
    <g fill="none" stroke="#efe6ff" stroke-width="2.2" stroke-linecap="round">
      <path d="M138 46 C124 36 128 16 146 16 C162 16 166 34 154 40 C148 43 144 36 149 33"/>
    </g>
    <g fill="#fff">
      <path d="M22 68 L26 76 L30 69 L34 77 L38 70 L42 77 L46 70 L50 75 L51 73 Z"/>
      <path d="M24 84 L28 78 L32 86 L36 79 L40 87 L44 80 L48 87 L52 80 L54 84 Z"/>
      <path d="M178 92 L180 99 L182 93 Z M186 92 L188 99 L190 93 Z"/>
    </g>
    <path d="M184 95 L183 104 L180 108 M183 104 L186 108" fill="none" stroke="#d0303a" stroke-width="1.5" stroke-linecap="round"/>
    <circle cx="16" cy="68" r="2.4" fill="#14181d"/>
    <g fill="none" stroke-width="2.2" stroke-linecap="round">
      <circle cx="110" cy="112" r="8" stroke="#2c333b"/><path d="M102 100 Q110 106 118 100 M110 120 L110 130 M104 125 L116 125" stroke="#2c333b"/>
      <circle cx="110.8" cy="113" r="8" stroke="#f3e7c2" opacity=".35"/>
    </g>
    <g fill="none" stroke="#fff" stroke-linecap="round" opacity=".8">
      <path d="M78 90 Q112 84 150 92" stroke-width="3"/><path d="M54 64 Q58 52 70 50" stroke-width="2.5"/>
      <path d="M134 50 Q140 44 148 46" stroke-width="2"/><path d="M60 140 Q54 160 50 176" stroke-width="1.6"/>
      <path d="M174 70 Q182 64 190 70" stroke-width="1.6"/>
    </g>
    <path d="M60 138 Q100 132 150 136" fill="none" stroke="#f3e7c2" stroke-width="2" opacity=".5"/>
    <circle cx="98" cy="148" r="4" fill="#cfd8e2" class="pinga"/>
    <circle cx="128" cy="147" r="3" fill="#cfd8e2" class="pinga pinga--2"/>
    <circle cx="72" cy="143" r="2.6" fill="#cfd8e2" class="pinga pinga--3"/>
    <path d="M44 76 Q46 66 52 62" fill="none" stroke="#14181d" stroke-width="4" stroke-linecap="round"/>
    <g filter="url(#qm-brilho)" class="olho-brilha">
      <ellipse cx="62" cy="64" rx="6" ry="4.5" fill="url(#qm-olho)"/>
      <circle cx="146" cy="54" r="2.8" fill="url(#qm-olho)"/><circle cx="184" cy="78" r="2.6" fill="url(#qm-olho)"/>
    </g>
    <ellipse cx="62" cy="64" rx="1.3" ry="3.8" fill="#2a1a04"/>`,

  /* O Paradoxo — o triângulo que olha de volta. Dentro dele, um céu inteiro.
     Três olhos menores vigiam do anel; o olho central tem veias. */
  paradoxo: `
    <defs>
      <linearGradient id="px-corpo" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#3b2763"/><stop offset=".6" stop-color="#1a1030"/><stop offset="1" stop-color="#08050f"/>
      </linearGradient>
      <radialGradient id="px-nebulosa" cx="45%" cy="40%" r="60%">
        <stop offset="0" stop-color="#c46fd8" stop-opacity=".55"/><stop offset=".5" stop-color="#4a3fa8" stop-opacity=".35"/><stop offset="1" stop-color="#000" stop-opacity="0"/>
      </radialGradient>
      <radialGradient id="px-iris" cx="50%" cy="50%" r="50%">
        <stop offset="0" stop-color="#fff3c4"/><stop offset=".3" stop-color="#e2b3ff"/><stop offset=".75" stop-color="#6a45a8"/><stop offset="1" stop-color="#22143c"/>
      </radialGradient>
      <radialGradient id="px-aura" cx="50%" cy="50%" r="50%">
        <stop offset="0" stop-color="#a988cf" stop-opacity=".5"/><stop offset="1" stop-color="#a988cf" stop-opacity="0"/>
      </radialGradient>
      <radialGradient id="px-esclera" cx="50%" cy="40%" r="60%">
        <stop offset="0" stop-color="#fffaf0"/><stop offset=".8" stop-color="#d9cce6"/><stop offset="1" stop-color="#a48fb8"/>
      </radialGradient>
      <linearGradient id="px-tentaculo" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#e2b3ff"/><stop offset="1" stop-color="#e2b3ff" stop-opacity="0"/>
      </linearGradient>
      <clipPath id="px-dentro"><path d="M40 56 L160 56 L100 168 Z"/></clipPath>
      ${BRILHO('px-brilho')}
    </defs>
    <circle cx="100" cy="96" r="98" fill="url(#px-aura)"/>
    <g class="gira" fill="none">
      <circle cx="100" cy="96" r="88" stroke="#d4af37" stroke-width="2" stroke-dasharray="70 10 4 10" opacity=".8"/>
      <circle cx="100" cy="96" r="81" stroke="#d4af37" stroke-width="6" stroke-dasharray="1.5 6 4 6" opacity=".45"/>
      <g class="pisca pisca--1"><path d="M180 90 Q188 84 196 90 Q188 96 180 90 Z" fill="url(#px-esclera)" stroke="#22143c" stroke-width="1.2"/><circle cx="188" cy="90" r="2.2" fill="#22143c"/></g>
      <g class="pisca pisca--2"><path d="M14 90 Q22 84 30 90 Q22 96 14 90 Z" fill="url(#px-esclera)" stroke="#22143c" stroke-width="1.2"/><circle cx="22" cy="90" r="2.2" fill="#22143c"/></g>
      <g class="pisca"><path d="M92 180 Q100 174 108 180 Q100 186 92 180 Z" fill="url(#px-esclera)" stroke="#22143c" stroke-width="1.2"/><circle cx="100" cy="180" r="2.2" fill="#22143c"/></g>
    </g>
    <g class="gira gira--reverso" fill="none" stroke="#a988cf" stroke-width="2" opacity=".7">
      <circle cx="100" cy="96" r="68" stroke-dasharray="16 8"/>
      <circle cx="100" cy="28" r="3.5" fill="#e2b3ff" stroke="none" filter="url(#px-brilho)"/>
      <circle cx="41" cy="130" r="2.6" fill="#ffe9a3" stroke="none" filter="url(#px-brilho)"/>
    </g>
    <g fill="none" stroke="url(#px-tentaculo)" stroke-width="4" stroke-linecap="round" class="ondula">
      <path d="M94 158 Q82 172 90 186 Q96 196 88 200"/><path d="M106 158 Q120 174 110 188"/>
      <path d="M100 164 Q96 180 104 198"/><path d="M88 148 Q66 158 60 178"/><path d="M112 148 Q134 158 140 176"/>
    </g>
    <path d="M40 56 L160 56 L100 168 Z" fill="url(#px-corpo)"/>
    <g clip-path="url(#px-dentro)">
      <ellipse cx="96" cy="96" rx="60" ry="44" fill="url(#px-nebulosa)"/>
      <g fill="#fff">
        <circle cx="62" cy="64" r=".9"/><circle cx="140" cy="66" r="1.1"/><circle cx="120" cy="120" r=".8"/><circle cx="80" cy="118" r="1"/>
        <circle cx="100" cy="146" r=".9"/><circle cx="132" cy="80" r=".7"/><circle cx="70" cy="80" r=".7"/><circle cx="110" cy="134" r="1.2"/>
        <circle cx="54" cy="70" r=".6"/><circle cx="148" cy="62" r=".6"/><circle cx="90" cy="128" r=".6"/>
      </g>
    </g>
    <g stroke-linejoin="round" fill="none">
      <path d="M40 56 L160 56 L100 168 Z" stroke="#d4af37" stroke-width="3.2"/>
      <path d="M40 56 L160 56 L100 168 Z" stroke="#e2b3ff" stroke-width="1" opacity=".8"/>
      <path d="M52 63 L148 63 L100 153 Z" stroke="#d4af37" stroke-width="1" opacity=".5"/>
      <path d="M100 26 L152 124 L48 124 Z" stroke="#d4af37" stroke-width="1.3" opacity=".4"/>
    </g>
    <g filter="url(#px-brilho)" fill="#ffe9a3"><circle cx="40" cy="56" r="3.5"/><circle cx="160" cy="56" r="3.5"/><circle cx="100" cy="168" r="3.5"/></g>
    <g class="pisca">
      <path d="M60 96 Q100 62 140 96 Q100 130 60 96 Z" fill="url(#px-esclera)" stroke="#0a0612" stroke-width="2.5"/>
      <g fill="none" stroke="#b0303a" stroke-width=".9" opacity=".7" stroke-linecap="round">
        <path d="M66 96 Q74 92 80 95 L84 92"/><path d="M134 96 Q126 100 120 98 L116 101"/><path d="M70 100 Q76 104 82 102"/><path d="M128 91 Q122 88 118 90"/>
      </g>
      <circle cx="100" cy="96" r="18" fill="url(#px-iris)"/>
      <circle cx="100" cy="96" r="18" fill="none" stroke="#d4af37" stroke-width="1.5"/>
      <circle cx="100" cy="96" r="12" fill="none" stroke="#fff3c4" stroke-width=".6" stroke-dasharray="1 2" opacity=".7"/>
      <ellipse cx="100" cy="96" rx="3.8" ry="14" fill="#05030a"/>
      <circle cx="107" cy="88" r="3.6" fill="#fff" opacity=".9"/><circle cx="93" cy="104" r="1.6" fill="#fff" opacity=".6"/>
    </g>
    <path d="M44 58 L98 58" stroke="#f2e9d8" stroke-width="2" opacity=".4" stroke-linecap="round"/>
    <g stroke="#22143c" stroke-width="1.5" class="estilhacos">
      <path d="M22 40 L42 34 L33 56 Z" fill="#c9a4ef"/><path d="M164 28 L182 46 L160 52 Z" fill="#a988cf"/>
      <path d="M26 150 L46 156 L30 170 Z" fill="#a988cf"/><path d="M168 142 L180 164 L160 158 Z" fill="#c9a4ef"/>
      <path d="M92 6 L100 -4 L108 6 L100 12 Z" fill="#d4af37"/>
    </g>`
};

const arteInimigo = id => `<svg viewBox="0 0 200 200" aria-hidden="true">${ARTES[id]}</svg>`;

/* ═══ A Alquimista: capuz, máscara de tecido, olhos de lente acesos ═══ */

const RETRATO_ALQUIMISTA = `<svg viewBox="0 0 100 100" aria-hidden="true">
  <defs>
    <radialGradient id="aq-fundo" cx="50%" cy="40%"><stop offset="0" stop-color="#2c4a44"/><stop offset="1" stop-color="#0d1514"/></radialGradient>
    <linearGradient id="aq-capuz" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#4f6e5e"/><stop offset=".6" stop-color="#2a3d34"/><stop offset="1" stop-color="#141e19"/></linearGradient>
    ${BRILHO('aq-brilho')}
  </defs>
  <circle cx="50" cy="50" r="50" fill="url(#aq-fundo)"/>
  <path d="M50 12 C26 12 16 34 18 58 C20 76 14 88 8 104 L92 104 C86 88 80 76 82 58 C84 34 74 12 50 12 Z" fill="url(#aq-capuz)" stroke="#0b100e" stroke-width="2"/>
  <path d="M50 26 C35 26 29 41 30 55 C31 68 40 77 50 77 C60 77 69 68 70 55 C71 41 65 26 50 26 Z" fill="#07090a"/>
  <path d="M31 60 Q50 70 69 60 L69 75 Q50 84 31 75 Z" fill="#7a5634" stroke="#2a1c10" stroke-width="1.5"/>
  <path d="M34 66 Q50 74 66 66" fill="none" stroke="#2a1c10" stroke-width="1" opacity=".6"/>
  <g fill="none" stroke="#8a6a14" stroke-width="2"><circle cx="41" cy="50" r="6"/><circle cx="59" cy="50" r="6"/><path d="M47 50 L53 50"/></g>
  <g filter="url(#aq-brilho)"><circle cx="41" cy="50" r="3.4" fill="#9ff0b0"/><circle cx="59" cy="50" r="3.4" fill="#9ff0b0"/></g>
  <path d="M50 84 L56 95 L44 95 Z" fill="none" stroke="#f0d67c" stroke-width="2" stroke-linejoin="round" filter="url(#aq-brilho)"/>
  <path d="M30 22 Q50 10 70 22" fill="none" stroke="#9ab8a6" stroke-width="2" opacity=".35" stroke-linecap="round"/>
</svg>`;

/* Selo da tela de título: anéis girando em volta do triângulo dos elementos */
const SELO_TITULO = `<svg viewBox="0 0 300 300" aria-hidden="true">
  <defs>${BRILHO('ti-brilho')}</defs>
  <g class="titulo-gira" fill="none" stroke="#d4af37">
    <circle cx="150" cy="150" r="140" stroke-width="1.5" stroke-dasharray="90 12 4 12" opacity=".7"/>
    <circle cx="150" cy="150" r="128" stroke-width="6" stroke-dasharray="1.5 9" opacity=".4"/>
  </g>
  <g class="titulo-gira titulo-gira--reverso" fill="none" stroke="#a988cf" opacity=".6">
    <circle cx="150" cy="150" r="112" stroke-width="1.5" stroke-dasharray="20 10"/>
  </g>
  <path d="M150 46 L240 202 L60 202 Z" fill="none" stroke="#d4af37" stroke-width="2" opacity=".8"/>
  <circle cx="150" cy="150" r="52" fill="none" stroke="#d4af37" stroke-width="1" opacity=".5"/>
  <g stroke-width="5" fill="none" stroke-linejoin="round" filter="url(#ti-brilho)">
    <path d="M150 28 L166 56 L134 56 Z" stroke="#e0703a"/>
    <path d="M226 196 L258 196 L242 224 Z" stroke="#4f9bd9"/>
    <path d="M42 196 L74 196 L58 224 Z M44 205 L72 205" stroke="#8db35a"/>
  </g>
</svg>`;

/* ═══ Ilustrações das cartas (viewBox 100×70) ═══════════════════ */

const ARTES_CARTAS = {
  /* Fogo */
  faisca: `
    <defs><radialGradient id="ca-faisca"><stop offset="0" stop-color="#fff"/><stop offset=".35" stop-color="#ffe08a"/><stop offset="1" stop-color="#e0703a"/></radialGradient></defs>
    <circle cx="50" cy="35" r="22" fill="#e0703a" opacity=".18"/>
    <path d="M50 8 L55.5 29.5 L77 35 L55.5 40.5 L50 62 L44.5 40.5 L23 35 L44.5 29.5 Z" fill="url(#ca-faisca)"/>
    <path d="M50 22 L52 33 L63 35 L52 37 L50 48 L48 37 L37 35 L48 33 Z" fill="#fff"/>
    <g fill="#ffd27a"><circle cx="26" cy="16" r="2"/><circle cx="76" cy="54" r="2.4"/><circle cx="72" cy="14" r="1.5"/><circle cx="24" cy="54" r="1.5"/></g>`,
  labareda: `
    <defs><linearGradient id="ca-labareda" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#ffe08a"/><stop offset=".45" stop-color="#f08a3a"/><stop offset="1" stop-color="#b8321e"/></linearGradient></defs>
    <ellipse cx="50" cy="64" rx="28" ry="4" fill="#e0703a" opacity=".35"/>
    <path d="M50 66 C26 66 20 46 32 30 C34 40 40 43 40 43 C36 28 46 14 58 4 C56 20 70 26 70 40 C73 33 70 25 70 25 C84 38 80 66 50 66 Z" fill="url(#ca-labareda)"/>
    <path d="M50 66 C38 66 35 55 42 46 C43 52 47 54 47 54 C46 46 51 38 57 33 C56 42 64 46 63 55 C62 62 57 66 50 66 Z" fill="#ffe9a8"/>`,
  brasa: `
    <defs><radialGradient id="ca-brasa" cx="45%" cy="40%"><stop offset="0" stop-color="#5a2a18"/><stop offset="1" stop-color="#1e0d08"/></radialGradient></defs>
    <ellipse cx="50" cy="60" rx="30" ry="5" fill="#ff7a3a" opacity=".3"/>
    <path d="M22 54 Q18 40 32 34 Q44 26 62 31 Q80 35 78 48 Q76 60 56 61 Q32 63 22 54 Z" fill="url(#ca-brasa)" stroke="#120806" stroke-width="2"/>
    <path d="M34 40 L42 46 L38 54 M52 34 L54 44 L64 48 L60 56 M70 40 L66 46" fill="none" stroke="#ffae4a" stroke-width="2.2" stroke-linecap="round" class="brasa"/>
    <path d="M44 28 C40 22 46 16 48 10 C50 16 56 20 52 28 Z M60 30 C58 26 62 22 63 18 C65 22 67 26 64 30 Z" fill="#f08a3a" opacity=".85"/>`,
  /* Água */
  gota: `
    <defs><linearGradient id="ca-gota" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#bfe3ff"/><stop offset=".5" stop-color="#4f9bd9"/><stop offset="1" stop-color="#1d4f86"/></linearGradient></defs>
    <ellipse cx="50" cy="62" rx="26" ry="4.5" fill="none" stroke="#4f9bd9" stroke-width="1.5" opacity=".6"/>
    <ellipse cx="50" cy="62" rx="14" ry="2.5" fill="none" stroke="#bfe3ff" stroke-width="1.2" opacity=".6"/>
    <path d="M50 6 C50 6 30 32 30 44 A20 20 0 0 0 70 44 C70 32 50 6 50 6 Z" fill="url(#ca-gota)" stroke="#16365c" stroke-width="1.5"/>
    <ellipse cx="42" cy="40" rx="4" ry="8" fill="#fff" opacity=".7" transform="rotate(20 42 40)"/>`,
  mare: `
    <defs><linearGradient id="ca-mare" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7fc0f0"/><stop offset="1" stop-color="#173e6e"/></linearGradient></defs>
    <path d="M2 66 L2 50 C14 50 18 30 36 24 C56 18 72 30 68 44 C66 52 56 52 56 45 C56 38 64 38 66 42 C70 52 84 54 98 44 L98 66 Z" fill="url(#ca-mare)" stroke="#0f2c50" stroke-width="1.5"/>
    <path d="M10 48 C20 44 24 30 38 27 C54 23 66 32 64 42" fill="none" stroke="#e8f6ff" stroke-width="2.2" stroke-linecap="round"/>
    <g fill="#e8f6ff"><circle cx="70" cy="40" r="2.5"/><circle cx="76" cy="34" r="1.8"/><circle cx="82" cy="40" r="1.4"/><circle cx="62" cy="34" r="1.4"/></g>
    <path d="M6 60 Q20 56 34 60 T62 60 T94 58" fill="none" stroke="#bfe3ff" stroke-width="1.4" opacity=".6"/>`,
  orvalho: `
    <defs><linearGradient id="ca-folha" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#1f3d22"/><stop offset="1" stop-color="#4f8a46"/></linearGradient></defs>
    <path d="M10 58 Q36 6 90 16 Q70 66 10 58 Z" fill="url(#ca-folha)" stroke="#132615" stroke-width="1.5"/>
    <path d="M14 56 Q48 40 86 18" fill="none" stroke="#7fb86e" stroke-width="1.4"/>
    <g fill="#7fc0f0" stroke="#1d4f86" stroke-width="1"><circle cx="40" cy="38" r="5"/><circle cx="60" cy="30" r="3.6"/><circle cx="56" cy="46" r="4.2"/></g>
    <g fill="#fff"><circle cx="38.5" cy="36.5" r="1.5"/><circle cx="59" cy="29" r="1.1"/><circle cx="55" cy="44.5" r="1.3"/></g>`,
  /* Terra */
  pedra: `
    <defs><linearGradient id="ca-pedra" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#b9c48e"/><stop offset=".55" stop-color="#6d7a4a"/><stop offset="1" stop-color="#2f3820"/></linearGradient></defs>
    <ellipse cx="50" cy="62" rx="34" ry="5" fill="#000" opacity=".35"/>
    <path d="M18 60 L24 34 L42 20 L66 22 L82 38 L84 60 Z" fill="url(#ca-pedra)" stroke="#1d2414" stroke-width="2" stroke-linejoin="round"/>
    <path d="M42 20 L48 40 L24 34 M48 40 L66 22 M48 40 L56 60 M48 40 L82 38" fill="none" stroke="#1d2414" stroke-width="1.2" opacity=".55"/>
    <path d="M28 36 L42 24" stroke="#e8efc8" stroke-width="2" opacity=".6" stroke-linecap="round"/>`,
  terremoto: `
    <defs><linearGradient id="ca-solo" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8db35a"/><stop offset=".25" stop-color="#5a4630"/><stop offset="1" stop-color="#2a1f14"/></linearGradient></defs>
    <path d="M2 44 L44 38 L38 68 L2 68 Z" fill="url(#ca-solo)" stroke="#1a130c" stroke-width="1.5" stroke-linejoin="round"/>
    <path d="M56 34 L98 42 L98 68 L62 68 Z" fill="url(#ca-solo)" stroke="#1a130c" stroke-width="1.5" stroke-linejoin="round"/>
    <path d="M50 36 L46 46 L53 52 L47 60 L51 68" fill="none" stroke="#c9f07a" stroke-width="2.4" stroke-linecap="round" class="brasa"/>
    <g fill="#6d5a3a" stroke="#1a130c" stroke-width="1"><path d="M30 20 L38 16 L40 24 L32 26 Z"/><path d="M62 12 L70 14 L66 22 Z"/><path d="M48 22 L54 20 L54 27 Z"/></g>`,
  seixo: `
    <defs><radialGradient id="ca-seixo" cx="40%" cy="30%"><stop offset="0" stop-color="#d4dcb4"/><stop offset="1" stop-color="#5a6640"/></radialGradient></defs>
    <ellipse cx="50" cy="64" rx="26" ry="4" fill="#000" opacity=".35"/>
    <g fill="url(#ca-seixo)" stroke="#1d2414" stroke-width="1.6">
      <ellipse cx="50" cy="56" rx="22" ry="8"/><ellipse cx="49" cy="42" rx="16" ry="7"/><ellipse cx="51" cy="30" rx="11" ry="5.5"/><ellipse cx="50" cy="20" rx="6.5" ry="4"/>
    </g>`
};

/* Escória: a maldição do inimigo — um torrão de resíduo que só ocupa espaço */
ARTES_CARTAS.escoria = `
  <defs><radialGradient id="ca-escoria" cx="40%" cy="35%"><stop offset="0" stop-color="#6a5a74"/><stop offset="1" stop-color="#1c1622"/></radialGradient></defs>
  <ellipse cx="50" cy="62" rx="28" ry="4" fill="#000" opacity=".4"/>
  <path d="M26 56 Q20 44 30 36 Q34 24 48 26 Q60 18 70 30 Q82 36 76 50 Q78 62 60 60 Q44 66 26 56 Z" fill="url(#ca-escoria)" stroke="#0c0a10" stroke-width="2"/>
  <g fill="#0c0a10"><circle cx="40" cy="40" r="3"/><circle cx="58" cy="36" r="2.4"/><circle cx="62" cy="50" r="3.2"/><circle cx="46" cy="52" r="2"/></g>
  <path d="M30 30 Q34 20 40 24 M66 22 Q70 14 74 20" fill="none" stroke="#a988cf" stroke-width="1.6" opacity=".7" stroke-linecap="round"/>`;

const arteCarta = id => `<svg class="carta-ilustracao" viewBox="0 0 100 70" aria-hidden="true">${ARTES_CARTAS[id]}</svg>`;
