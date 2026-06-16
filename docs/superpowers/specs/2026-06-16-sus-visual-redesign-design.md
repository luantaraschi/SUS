# SUS — Redesign Visual Completo (UI/UX/Motion/Som)

**Data:** 2026-06-16
**Status:** Spec aprovado na direção visual; aguardando revisão do spec antes do plano de implementação.
**Direção escolhida:** B — "Festa Refinada" (a identidade atual elevada com rigor).
**App:** `sus/` (Next.js 16 App Router + Convex + Tailwind v4 + framer-motion + three.js).

---

## 1. Objetivo e critérios de sucesso

Elevar **toda** a camada visual, de interação, animação e som do SUS ao nível de um produto profissional de primeira linha — sem trair a alma de party game divertido que já existe. O projeto foi feito no início do aprendizado do autor; o objetivo é que pareça "feito pelos melhores engenheiros do mundo": coeso, polido, intencional, limpo.

**Sucesso =**
- Sistema de design único e consistente (tokens) — fim dos `rgba()`/hex/`rounded-[Npx]` soltos.
- Cada tela com hierarquia clara, motion lúdico-elástico coerente e som contextual.
- Bugs visuais conhecidos eliminados (a começar pelo glow quadrado do orador).
- Acessibilidade real (foco visível, alvos ≥40px, contraste, `prefers-reduced-motion`, aria/i18n).
- Sem regressões de gameplay: fluxo, regras e backend Convex preservados.

**Não-objetivos (fora de escopo):**
- Mudar regras do jogo, fluxo de fases ou modelo de dados do Convex (salvo ajustes mínimos que sirvam a UI, ex.: i18n de aria-labels).
- Adicionar novos modos de jogo ou features de produto.
- Trocar a stack (continua Next/Convex/Tailwind/framer-motion/three.js).
- Refactor estrutural gratuito (só quebramos arquivos gigantes onde isso serve diretamente o redesign).

---

## 2. Direção de design (decisões travadas)

| Eixo | Decisão |
|---|---|
| **Estética** | B — Festa Refinada: roxo vibrante, glassmorphism, fontes amigáveis; a identidade atual, porém consistente e premium. |
| **Tema herói** | Dark vibrante (roxo profundo). Mantém-se claro/escuro, mas o dark é o protagonista e ambos ficam polidos. |
| **Motion** | Lúdico e elástico: springs com overshoot nas macro-interações (botões, avatares, cards, transições de fase). Sempre interrompível e com `prefers-reduced-motion`. |
| **Som** | Misto por contexto, coeso por **uma única escala harmônica**: lúdico em cliques/entrar, tenso no reveal/votação, satisfatório na vitória. |
| **Escopo de código** | Visual + refactors que servem o redesign (tokens, sistema de motion, primitivos Button/Modal unificados, quebra de arquivos gigantes). |
| **Idioma** | PT-BR mantido; copy revisada (voz ativa, sentence case, mensagens de erro úteis). |
| **Fundo** | Mantém o shader gradient 3D, com stops alinhados aos tokens e respeitando `reduced-motion`/perf. |

### Assinatura visual (o elemento memorável)
O **"momento impostor"**: a revelação de papel (DistributingPhase) e o pulso do orador são os instantes mais característicos do jogo. É onde concentramos a ousadia — reveal com peso (motion + som tenso coeso), enquanto o resto da interface fica disciplinado e quieto. (Princípio frontend-design: gastar a ousadia em um lugar só.)

---

## 3. Fundação: Design System (tokens)

Tudo abaixo vira **tokens em `sus/src/app/globals.css`** (no bloco `@theme` do Tailwind v4) e é a única fonte de verdade. Componentes deixam de usar valores literais.

### 3.1 Cor (semântica)
```
/* Superfície / fundo */
--bg-1:#2A0A6E;  --bg-2:#3A138F;  --bg-3:#5A2FD6;     /* gradiente radial topo→base */
/* Texto */
--text:#FDFCFF;  --text-muted:#CDBCFF;  --text-dim:rgba(255,255,255,.55);
/* Glass */
--glass-1:rgba(255,255,255,.08);  --glass-2:rgba(255,255,255,.12);
--glass-border:rgba(255,255,255,.16);
/* Paleta de jogo (estado) */
--imp:#FF577B;  --safe:#4DDBA8;  --info:#00B8EB;  --warn:#FF8940;
--special:#D64DC2;  --gold:#FFD76A;  --green:#7ED957;
/* Ação primária */
--primary-1:#6A5BF0;  --primary-2:#4733C8;  --primary-press:#2C1F8F;
```
Cada cor de estado ganha variantes derivadas (`-soft` p/ fundo de chip, `-ring` p/ foco) geradas via `color-mix()`. **Regra:** toda cor hardcoded encontrada na auditoria (≈30 hex / ≈70 rgba) migra para esses tokens (inclui PostItBoard, avatar bg, SignInModal, ConvexStatusBanner).

### 3.2 Raio (concêntrico)
`--r-xs:8px · --r-sm:12px · --r-md:18px · --r-lg:26px · --r-xl:32px · --r-2xl:40px · --r-pill:999px`
Regra **make-interfaces**: raio externo = raio interno + padding. Elimina `rounded-[22/28/34/36px]` avulsos.

### 3.3 Sombra (camadas, sombra > borda)
```
--shadow-sm  : 0 2px 8px rgba(0,0,0,.18);
--shadow-md  : 0 18px 50px rgba(0,0,0,.28), inset 0 1px 0 rgba(255,255,255,.14);
--shadow-lg  : 0 30px 80px rgba(0,0,0,.45), inset 0 1px 0 rgba(255,255,255,.12);
--shadow-press : 0 4px 0 var(--primary-press);          /* botão 3D lúdico */
--glow-info / --glow-imp / --glow-safe : 0 0 24px <cor>/.45;  /* via drop-shadow */
```

### 3.4 Alpha de overlay (fim do caos `white/10..74`)
`--w-04 .04 · --w-08 .08 · --w-12 .12 · --w-16 .16 · --w-20 .20 · --w-28 .28 · --w-40 .40 · --w-60 .60 · --w-72 .72` (e equivalentes `--b-*` para preto). Componentes passam a referenciar a escala.

### 3.5 Blur
`--blur-sm:8px · --blur-md:16px · --blur-lg:24px` (centraliza backdrop-filter).

### 3.6 Tipografia
Mantém os papéis atuais (elevar, não trocar):
- **Display:** Londrina Solid → título "SUS", grandes headers de fase.
- **Corpo/UI:** Balsamiq Sans → texto, botões, labels.
- **Manuscrita:** Kalam → post-its / acentos.
- **Condensada:** Oswald → uso restrito (timer, labels uppercase).
- **Mono:** JetBrains Mono → código de sala.

Escala de tipo definida (tamanho/peso/line-height/letter-spacing) em tokens. Regras transversais:
- `-webkit-font-smoothing:antialiased` na raiz.
- `font-variant-numeric:tabular-nums` em **timer, contadores, placar, código** (sem layout shift).
- `text-wrap:balance` em headings; `text-wrap:pretty` em parágrafos.

### 3.7 Espaçamento
Escala 4px (`--s-1..--s-12`) e padronização de paddings de controles (botões, fields) — fim de `px-4/6/8` ad-hoc.

### 3.8 Glass unificado
`.glass` (shell), `.glass-soft`, `.glass-field` derivam de `--glass-*` + `--glass-border` + `--blur-md`. Tons de acento (neutral/safe/imp/special/info) via `--glass-accent` com `color-mix()`. Borda única (`--glass-border`), fim de `white/10..18` por componente.

---

## 4. Sistema de Motion (lúdico e elástico)

Arquivo novo: `sus/src/lib/motion.ts` — variants e transitions reutilizáveis (framer-motion). Fonte única; componentes param de inventar timings.

### 4.1 Tokens de tempo/easing
```
--t-micro:120ms · --t-quick:200ms · --t-base:300ms · --t-slow:450ms
--ease-out: cubic-bezier(.16,1,.3,1)
--ease-in:  cubic-bezier(.55,0,1,.45)
--ease-in-out: cubic-bezier(.65,0,.35,1)
--spring-playful: cubic-bezier(.34,1.56,.64,1)   /* overshoot */
```
Springs framer: `press {stiffness:400,damping:17}`, `pop {stiffness:500,damping:22}`, `gentle {stiffness:260,damping:24}`.

### 4.2 Variants reutilizáveis
`fadeInUp`, `scaleIn`, `staggerContainer` (stagger 0.08s), `staggerItem`, `phaseTransition` (enter: opacity+scale .96+y8 com spring; exit: **sutil** — opacity + y-8, mais rápido que o enter), `cardReveal`.

### 4.3 Regras (de make-interfaces + interaction-design)
- **Press tátil:** `scale(0.96)` em todo botão/alvo clicável (nunca <0.95). Macro-interações usam spring com overshoot leve (lúdico); morph de ícone usa cross-fade limpo (`bounce:0`, scale 0.25→1, opacity 0→1, blur 4→0).
- **Enter dividido e escalonado** (~80–100ms entre chunks); **exit sutil** (pequeno translateY, não full-height).
- `AnimatePresence` com `initial={false}` em elementos de estado-padrão; sempre `key` correta; corrigir o uso em ResultsPhase.
- **Nunca `transition: all`** — sempre propriedades específicas. `will-change` só em transform/opacity/filter e só onde houver stutter.
- `@media (prefers-reduced-motion: reduce)` global desliga/encurta animações.

### 4.4 Transição entre fases (hoje inexistente)
Envolver o dispatcher de fases (`room/[code]/play/page.tsx`) com `AnimatePresence mode="wait"` + `phaseTransition`. Todas as 8 fases passam a entrar/sair com motion coerente (hoje só 4 animam). Cobre os "mounts secos" de Speaking/Discussion/Evidence.

### 4.5 Cobertura nova de animação (onde falta)
Avatares (entrada escalonada na lista), chips/badges (pop ao mudar de estado), toggles/seletores, contadores (number roll com tabular-nums), skeletons de loading por fase, feedback de envio de voto/resposta, burst ao mandar reação/emoji, hover-lift em cards.

---

## 5. Sistema de Som (remodelado do zero)

Reescrever `sus/src/lib/synthSounds.ts` + `useSound.ts` seguindo **generating-sounds-with-ai**. Hoje só 3 de ~10 sons tocam; vários estão definidos e mortos.

### 5.1 Arquitetura do engine
- **Um único `AudioContext`** (lazy, reusado) → **master `GainNode`** → `destination`.
- `resume()` quando `state === "suspended"` (após gesto do usuário).
- `onended`: `disconnect()` de todos os nós (sem vazamento).
- Tratamento de erro real (sem swallow silencioso); detecção de suporte.
- **Volume** (slider 0–100, persistido) + **mute** (persistido), além de **mute inline** visível na tela de jogo e **teste de som** nas configurações.

### 5.2 Envelope (ADSR) e anti-click
Fábrica de envelope padronizada: `setValueAtTime` inicial → ataque linear de 1–2ms (mata o "clique") → decay/sustain → **release exponencial até 0.001** (nunca 0; nunca linear). Gain sempre ≤ 1.0.

### 5.3 Coesão harmônica
Todos os sons derivam de **uma escala única** (pentatônica maior numa tônica fixa) → o jogo "soa" como um conjunto, não sons aleatórios. Vitória = arpejo maior; derrota = queda menor; reveal/tensão = intervalos mais sombrios da mesma escala.

### 5.4 Design por tipo
- **Cliques/percussivos** (UI click, tick): burst de **ruído ~8ms + bandpass ~4kHz, Q≈3** (não oscilador) → "tique" nítido, não "beep".
- **Tonais** (confirmar, entrar, pop "sua vez"): oscilador com **pitch sweep** (ex.: 400→600Hz), triangle/sine.

### 5.5 Mapa de eventos (contextual)
| Evento | Caráter | Gatilho (arquivo) |
|---|---|---|
| `ui.click` / `ui.toggle` | lúdico curto | botões/seletores globais |
| `lobby.join` / `lobby.leave` | alegre / suave | room lobby (já existe, manter) |
| `chat.message` | blip leve | FloatingChat (hoje **mudo**) |
| `role.reveal` | **tenso** (assinatura) | DistributingPhase |
| `phase.enter` | whoosh sutil por fase | play dispatcher |
| `turn.you` | pop de atenção | SpeakingPhase |
| `vote.cast` | satisfatório | VotingPhase (hoje **mudo**) |
| `vote.consensus` | rising | SpeakingPhase (pedido de votação) |
| `timer.tick` | escalonado (pitch sobe <10s) | Timer (hoje **mudo**) |
| `result.win` / `result.lose` | arpejo maior / queda menor | ResultsPhase (manter, refinar) |
| `round.next` | transição | ResultsPhase → próxima rodada (hoje **mudo**) |
| `error` | grave gentil | banners/erros |

Opcional (nice-to-have, não bloqueante): presets "mínimo/completo/ambiente" e ducking de -3dB em sons críticos.

---

## 6. Primitivos de componente (unificação)

| Primitivo | Mudança |
|---|---|
| **Button** | Unificar em **um** componente CVA. Aposenta o `GameButton` (string-interpolation) e consolida com `ui/button.tsx`. Variants: primary, glass, safe, danger, ghost, link; sizes consistentes; press `scale(.96)`; sombra `--shadow-press`; foco visível; estado disabled sem foco. |
| **Modal** | Wrapper compartilhado (`ModalRoot/Backdrop/Panel/Header/Close`): escala de **z-index** única, backdrop padrão, **focus-trap + restauração** (`useModalFocus`), `Esc` p/ fechar, enter (backdrop fade → painel spring-scale) e **exit** (hoje vários sem saída). Migra Legal/Support/HowToPlay/ThemePicker/SignIn/GameSettings. |
| **Card / GlassPanel** | Tons e raio concêntrico padronizados a partir dos tokens. |
| **Input / FormField** | `FormField` (label + input + erro + ajuda + `aria-describedby`). Corrige foco sem layout-shift (ver §7) e shake de erro reutilizando `@keyframes shake`. |
| **Avatar** | Quebrar `PlayerAvatar` (276 linhas) em `AvatarImage` / `AvatarBadges` / `AvatarStatus` / `AvatarLabel`. Cores de fundo viram tokens. |
| **Chip/Badge** | Variants de estado a partir da paleta de jogo. |
| **Timer** | tabular-nums, limiares configuráveis, `aria-live`, dispara `timer.tick`. |
| **Foco global** | Token `--ring` único e classe `focus-visible` consistente (resolve rings inconsistentes white/25/10 e contraste). |
| **Hit area** | Mínimo 40×40px (FloatingChat 36→40, badges 32→40, links do Footer). Pseudo-elemento onde o visível for menor. |

---

## 7. Correção de bugs visuais (causa-raiz)

| Bug | Causa | Correção |
|---|---|---|
| **Glow quadrado no pulso do orador** | `SpeakingOrbit.tsx:50-102` anima `boxShadow` (0 0 36px) num elemento com container `rounded-[28px]`; box-shadow **não respeita o border-radius** do elemento animado e é cortado → quadrado recortado no pico. | Trocar `boxShadow` por **`filter: drop-shadow()`** (respeita o raio, glow redondo) + `will-change:transform` + remover o shadow estático conflitante. |
| **Layout-shift no foco do input** | `GameInput.tsx:20-22` adiciona `shadow 0 0 0 3px` só no foco; estado default não reserva espaço → empurra ~3px. | Usar `outline`/`box-shadow` pré-alocado (anima 0→3px) ou ring via token, sem mudar o box. |
| **Ring do select cortado** | `GlassSelect.tsx:52` ring fora dos limites + containers com overflow:hidden. | `ring-offset-0` / wrapper com `overflow:visible` e padding suficiente. |
| **Reações clipadas** | `ReactionAnchor` sem `overflow:visible` garantido; pais com overflow cortam emojis no meio da animação. | Garantir boundary `overflow:visible` na âncora de reações. |
| **Flash no reveal (blur-md)** | `DistributingPhase` alterna `blur-md`/`select-none` causando reflow/repaint. | Revelar via opacity+scale (sem filtro de blur na transição) ou keyframe sem thrash de paint. |

Durante a implementação, rodaremos uma **varredura de bugs visuais** (overflow/z-index/focus rings/scroll jumps) tela a tela para pegar resíduos além desses.

---

## 8. Redesign tela a tela

Para cada tela: refinar layout/hierarquia com os tokens, aplicar motion (entrada escalonada + transição de fase), ligar som contextual, corrigir bugs e melhorar UX/microcopy.

1. **Home** (`(game)/page.tsx`) — conforme mockup aprovado: título display, tagline, avatar com bob elástico, card glass, botões unificados, estados de erro de código úteis.
2. **Lobby** (`room/[code]/page.tsx`, 794 linhas) — extrair `LobbyPanel`, `CodeBlock`, `Counter`, hook de settings; estados vazios ("adicione jogadores/bots"), feedback ao remover bot, clareza do toggle de visibilidade do código, lista de jogadores com entrada escalonada.
3. **Distributing** (508 linhas) — dividir em `WaitingForRoles`, `MasterQuestionSetup`, `ReadyConfirmation`; **hold-to-reveal descobrível** (dica visual/ripple), guia por papel (impostor/jogador/mestre), validação dos campos do mestre, timeout de "offline" no lugar de "Lendo" infinito. Som de reveal (assinatura).
4. **Speaking** — transição de turno com spring (sai/entra orador), **bug do glow corrigido**, pop "sua vez", explicação do consenso de votação ("faltam X votos").
5. **Answering** — foco/teclado no mobile (textarea não empurra o botão), contador de caracteres, affordance do mestre clara, som de envio.
6. **Revealing** — cascata de cards com stagger + pulso ao revelar; tick escalonado no countdown.
7. **Discussion / Evidence** — ganham entrada animada e microcopy ("compare as respostas; o impostor pode ter escorregado"), timer com tabular-nums + tick.
8. **Voting** — cards de jogador com foco visível, feedback ao votar (som + estado), **aviso claro de que mestre/espectador não vota** (antes da ação), grid centralizado para ímpares já tratado.
9. **Results** (499 linhas) — dividir em `ResultsDisplay`/`Leaderboard`/`Share`; reveal de impostor com peso, placar com tabular-nums, AnimatePresence corrigido, som win/lose refinado + `round.next`.
10. **Profile** — estados vazios de histórico, consistência de avatar/edição.
11. **Modais** (Legal/Support/HowToPlay/ThemePicker/SignIn/Settings) — migram pro Modal compartilhado; SignInModal entra no design system (hoje fora).
12. **ConvexStatusBanner / Footer** — cores via tokens (banner usa `--imp` em vez de red-500 cru), hit areas, i18n de aria-labels.

---

## 9. Acessibilidade e responsividade (piso de qualidade)

- Foco visível e consistente em tudo (token `--ring`); disabled não recebe foco.
- Contraste WCAG AA verificado para a paleta de jogo sobre fundos claro/escuro.
- Alvos de toque ≥40×40px.
- `prefers-reduced-motion` respeitado globalmente (motion + som ambiente).
- `aria-live` em timer/contagem de votos; `aria-describedby` em campos; aria-labels via i18n PT/EN.
- Mobile-first: layouts validados em telas pequenas (ex.: iPhone SE) — especialmente Answering e Lobby.
- `.visually-hidden` utilitário para leitores de tela.

---

## 10. Arquitetura / refactors que servem o redesign

Somente o que destrava o visual/consistência:
- `globals.css` → bloco `@theme` completo de tokens (cor/raio/sombra/alpha/blur/tipo/espaço).
- `src/lib/motion.ts` (variants/transitions) e `src/lib/sound/*` (engine + mapa de eventos).
- Primitivos: Button unificado, Modal compartilhado, FormField, Avatar dividido.
- Quebra de arquivos gigantes **onde a UI exige**: Lobby (794), DistributingPhase (508), ResultsPhase (499), PlayerAvatar (276).
- `play/page.tsx`: dispatcher de fase como mapa `status → (componente, props)` + `AnimatePresence`.
- Helpers `getActivePlayers/getVotingPlayers` p/ consolidar filtros de spectator/bot.

Explicitamente **fora**: reescrever lógica de fases no Convex, mudar scheduler, trocar modelo de dados.

---

## 11. Faseamento da implementação (foundation-first)

A ordem garante consistência (cada camada apoia a próxima). Detalhamento vira o plano de implementação (writing-plans).

1. **Fundação** — tokens em `globals.css`; `motion.ts`; engine de som. (sem mudança visível ainda)
2. **Primitivos** — Button, Modal, FormField, Avatar, Chip, Timer, foco/hit-area.
3. **Re-skin por tela** — Home → Lobby → fases (Distributing→…→Results) → Profile → Modais, aplicando tokens, motion, som e correções de bug por tela.
4. **Som & motion contextual** — ligar todos os eventos do mapa; transições de fase; coberturas novas.
5. **Varredura de bugs visuais** — overflow/z-index/focus/scroll, tela a tela.
6. **Revisão & verificação** — rodar skills de auditoria: `generating-sounds-with-ai` (no engine final), `mastering-animate-presence` (uso de AnimatePresence/exits), `web-design-guidelines` (acessibilidade/UX); `/code-review`; e **verificação visual real** via `verify`/`run` + agent-browser (screenshots por tela, incluindo o pulso do orador).

---

## 12. Verificação (evidência antes de "pronto")

- Rodar o app local (já no ar) e capturar screenshots por tela em dark e light.
- Confirmar visualmente o fim do glow quadrado ao passar a vez.
- Checar `prefers-reduced-motion`, navegação por teclado e mobile.
- Sem erros novos no console/build; lint limpo.
- Auditorias das skills sem findings de alta severidade pendentes.

---

## 13. Riscos e mitigação

| Risco | Mitigação |
|---|---|
| Re-skin amplo introduzir regressão de gameplay | Não tocar em lógica Convex; mudanças por tela + verificação visual incremental. |
| Motion elástico exagerar e cansar | Overshoot só nas macro-interações; `reduced-motion`; restrição (frontend-design). |
| Inconsistência durante a transição | Foundation-first: tokens/primitivos antes do re-skin. |
| Som irritante/repetitivo | Volume + mute + coesão harmônica + ducking opcional; teste de som nas configs. |
| Arquivos gigantes dificultarem edição | Quebra dirigida onde a UI exige, não refactor amplo. |
