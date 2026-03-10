# PROMPT 1 — SETUP DO PROJETO + DESIGN SYSTEM

## Objetivo
Criar o projeto do zero com Next.js + Convex + Tailwind + shadcn/ui, integrar todas as fontes e tokens do design system, e ter a estrutura de pastas pronta.

## Tarefas

### 1.1 — Criar o projeto
```bash
npx create-next-app@latest sus --typescript --tailwind --app --src-dir --import-alias "@/*"
cd sus
npm install convex
npx convex init
npx shadcn-ui@latest init
```

### 1.2 — Instalar dependências extras
```bash
npm install lucide-react framer-motion
```

### 1.3 — Configurar Google Fonts no `app/layout.tsx`
Importar do `next/font/google`:
- Londrina_Solid (weight: 400, 900)
- Balsamiq_Sans (weight: 400, 700)
- Kalam (weight: 400, 700)
- Oswald (weight: 400, 700)
- JetBrains_Mono (weight: 400, 700)

Definir CSS variables `--font-display`, `--font-body`, `--font-hand`, `--font-condensed`, `--font-mono` e aplicar no `<html>`.

### 1.4 — Configurar `tailwind.config.ts`
Extender o theme com:

**Colors:**
```js
colors: {
  surface: {
    primary: '#200268',
    secondary: '#36128F',
    white: '#FFFFFF',
  },
  game: {
    impostor: '#FF577B',
    safe: '#4DDBA8',
    info: '#00B8EB',
    warning: '#FF8940',
    special: '#D64DC2',
    green: '#7ED957',
  },
  bg: {
    center: '#FAFA39',
    mid1: '#FF8940',
    mid2: '#D64DC2',
    outer: '#902EED',
  },
}
```

**Font families:**
```js
fontFamily: {
  display: ['var(--font-display)', 'cursive'],
  body: ['var(--font-body)', 'cursive'],
  hand: ['var(--font-hand)', 'cursive'],
  condensed: ['var(--font-condensed)', 'sans-serif'],
  mono: ['var(--font-mono)', 'monospace'],
}
```

**Border radius:**
```js
borderRadius: {
  pill: '999px',
}
```

### 1.5 — Criar `globals.css` com estilos base
- Reset com `user-select: none` (é um jogo, não queremos seleção de texto)
- Background do body: gradiente radial default
- Keyframes para `@keyframes rotateBg` (rotação dos sunburst rays, 20s linear infinite)
- Keyframes para `@keyframes bounce-result` (scale oscilando 0.85-1.05, 900ms)
- Keyframes para `@keyframes shake` (translateX ±10px, 500ms)
- Keyframes para `@keyframes fade-in` (opacity 0→1, scale 0.23→1, 300ms cubic-bezier)

### 1.6 — Criar componente `Background.tsx`
Em `/components/game/Background.tsx`:
- Div fixed cobrindo a tela com 5 camadas:
  - z-1: Gradiente radial (aceitar prop `variant`: "default" | "valid" | "invalid") com transition 300ms
  - z-2: Div com background-image de um pattern SVG ou video placeholder (mix-blend-mode: color-burn, opacity 0.4)
  - z-3: Div com textura noise (background-image, mix-blend-mode: overlay)
  - z-4: SVG com 24 sunburst rays (mix-blend-mode: screen, animação de rotação)
  - z-5: Divs nos 4 cantos com halftone dots pattern (radial-gradient de dots que diminuem com a distância)
- Export com props: `variant`, `showRays` (boolean)

### 1.7 — Criar componente `GameCircle.tsx`
Em `/components/game/GameCircle.tsx`:
- Div circular de ~636px (responsivo com max-w e aspect-ratio)
- Fundo branco, borda 5px #200268
- Aceita `children` para renderizar conteúdo interno
- Animação de entrada (scale + fade)
- Box-shadow sutil

### 1.8 — Criar componente `GameButton.tsx`
Em `/components/game/GameButton.tsx`:
- Props: `variant` ("filled" | "outline" | "danger" | "success"), `size` ("lg" | "md" | "sm"), `icon`, `children`, `onClick`, `disabled`
- Estilo: pill, borda 3px, font-display uppercase, letterSpacing
- Hover: scale(1.06) + shadow mais forte (usar framer-motion whileHover)
- Disabled: opacity 0.5, pointer-events none

### 1.9 — Criar componente `GameInput.tsx`
Em `/components/game/GameInput.tsx`:
- Props: `label`, `value`, `onChange`, `placeholder`, `state` ("default" | "focus" | "error"), `variant` ("text" | "code"), `maxLength`
- Variante "code": font-mono, letterSpacing 6px, textAlign center
- States: default (borda primary/40), focus (borda info + glow), error (borda impostor + glow)
- Label em font-condensed uppercase

### 1.10 — Criar componente `PlayerAvatar.tsx`
Em `/components/game/PlayerAvatar.tsx`:
- Props: `name`, `emoji`, `isHost`, `status` ("online" | "ready" | "waiting" | "disconnected")
- Círculo 64px com bg primary, borda branca (ou amarela se host)
- Emoji no centro
- Nome em font-hand com colchetes: `[Nome]`
- Badge de host (coroa 👑) posicionada acima
- Indicador de status (bolinha verde, texto "Pronto", opacidade reduzida se waiting)

### 1.11 — Criar estrutura de pastas
```
/app/(game)/layout.tsx          → Layout com Background
/app/(game)/page.tsx            → Home (entrar/criar sala)
/app/(game)/room/[code]/page.tsx → Lobby da sala
/app/(game)/room/[code]/play/page.tsx → Rodada ativa
/components/game/Background.tsx
/components/game/GameCircle.tsx
/components/game/GameButton.tsx
/components/game/GameInput.tsx
/components/game/PlayerAvatar.tsx
/components/game/Badge.tsx
/components/game/Timer.tsx
/components/game/PhaseIndicator.tsx
/lib/constants.ts               → Constantes do jogo
/lib/types.ts                   → Types compartilhados
```

### 1.12 — Criar `lib/constants.ts`
```ts
export const ROOM_CODE_LENGTH = 4;
export const MIN_PLAYERS = 3;
export const MAX_PLAYERS = 12;
export const DEFAULT_DISCUSSION_TIME = 120; // seconds
export const DEFAULT_VOTING_TIME = 60;
export const DEFAULT_ROUNDS = 3;
export const PHASES = ['secret', 'answer', 'reveal', 'discussion', 'voting', 'result'] as const;
```

## Resultado Esperado
Ao final, devo conseguir rodar `npm run dev` e ver a home page com o background animado (gradiente + rays + halftone), o círculo central branco, e os componentes base renderizados como demonstração. Nenhuma funcionalidade de jogo ainda — apenas a fundação visual e estrutural perfeita.
