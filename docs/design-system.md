# SUS — Design System (Referência Rápida)

> Inspirado na estética Funocracy/Onrizon. Use este arquivo como referência ao construir componentes.

---

## Cores

### Background (gradiente radial animado)
| Token | Valor | Uso |
|-------|-------|-----|
| `bg-center` | `#FAFA39` | Centro do gradiente (amarelo) |
| `bg-mid1` | `#FF8940` | Faixa laranja |
| `bg-mid2` | `#D64DC2` | Faixa magenta |
| `bg-outer` | `#902EED` | Borda do gradiente (roxo) |

**Gradiente default:** `radial-gradient(circle, #FAFA39 0%, #FF8940 35%, #D64DC2 70%, #902EED 100%)`
**Gradiente valid:** `radial-gradient(circle, #4DDBA8 10%, #00B8EB 40%, #602BFF 70%, #852EFF 100%)`
**Gradiente invalid:** `radial-gradient(circle, #FF577B 36%, #D12977 59%, #8100B0 100%)`

### Superfícies (Tailwind)
| Classe | Valor | Uso |
|--------|-------|-----|
| `bg-surface-primary` | `#200268` | Botões filled, bordas, texto em fundo branco |
| `bg-surface-secondary` | `#36128F` | Hover, superfícies elevadas |
| `bg-white` | `#FFFFFF` | Interior do círculo central, cards |
| `bg-surface-overlay` | `rgba(32,2,104,0.80)` | Popups, modais |

### Semânticas do Jogo (Tailwind)
| Classe | Valor | Uso |
|--------|-------|-----|
| `text-game-impostor` / `bg-game-impostor` | `#FF577B` | Eliminar, perigo, erro |
| `text-game-safe` / `bg-game-safe` | `#4DDBA8` | Seguro, correto, pronto |
| `text-game-info` / `bg-game-info` | `#00B8EB` | Timer, links, destaques |
| `text-game-warning` / `bg-game-warning` | `#FF8940` | Suspeito, atenção |
| `text-game-special` / `bg-game-special` | `#D64DC2` | Mestre, badges especiais |
| `text-game-green` / `bg-game-green` | `#7ED957` | Logo, destaques positivos |

---

## Tipografia

| Classe Tailwind | Fonte | Peso | Uso |
|-----------------|-------|------|-----|
| `font-display` | Londrina Solid | 400, 900 | Logo, títulos, botões, números grandes, "ROOM CODE:" |
| `font-body` | Balsamiq Sans | 400, 700 | Regras, descrições, respostas, erros, tooltips |
| `font-hand` | Kalam | 400, 700 | Nomes de jogadores `[entre colchetes]`, notas informais |
| `font-condensed` | Oswald | 400, 700 | Badges, labels compactas, "PLAYERS:", "ROUNDS:" |
| `font-mono` | JetBrains Mono | 400, 700 | Código de sala (ABCD), timer (02:45), contadores |

### Escala tipográfica
| Nome | Tamanho | Fonte | Exemplo |
|------|---------|-------|---------|
| display-xl | 64px | Londrina Solid | Logo "SUS" |
| display-lg | 48px | Londrina Solid | Palavra secreta, timer |
| display-md | 32px | Londrina Solid | "VOCÊ É O IMPOSTOR!" |
| heading-lg | 28px | Londrina Solid | Títulos de tela |
| heading-md | 22px | Londrina Solid | Subtítulos |
| button | 18px | Londrina Solid | Labels de botão |
| body-lg | 20px | Balsamiq Sans | Texto principal |
| body-md | 16px | Balsamiq Sans | Texto secundário |
| body-sm | 13px | Balsamiq Sans | Captions, dicas |
| name | 16-28px | Kalam | Nomes de jogadores |
| code | 32px | JetBrains Mono | Código de sala |
| timer | 48px | JetBrains Mono | Timer |

---

## Componentes

### GameCircle (círculo central)
```
rounded-full bg-white border-[5px] border-surface-primary
max-w-[636px] aspect-square
shadow-[0_0_60px_rgba(32,2,104,0.2)]
```

### GameButton
```
// Filled (primary)
rounded-pill border-[3px] border-surface-primary bg-surface-primary text-white
font-display uppercase tracking-wider
hover:scale-[1.06] transition-transform duration-150

// Outline
rounded-pill border-[3px] border-surface-primary bg-transparent text-surface-primary

// Danger
rounded-pill border-[3px] border-game-impostor bg-game-impostor text-white

// Success
rounded-pill border-[3px] border-game-safe bg-game-safe text-surface-primary
```

**Tamanhos:**
- lg: `px-14 py-4 text-[26px]`
- md: `px-10 py-3 text-[20px]`
- sm: `px-7 py-2.5 text-[16px]`

### GameInput
```
// Default (dentro do círculo branco)
rounded-pill border-[2.5px] border-surface-primary/40 font-body
px-4 py-2.5

// Focus
border-game-info ring-[3px] ring-game-info/20

// Error
border-game-impostor ring-[3px] ring-game-impostor/20

// Variante "code"
font-mono text-center tracking-[6px] text-lg
```

### PlayerAvatar
```
// Container
w-16 h-16 rounded-full bg-surface-primary border-[3px] border-white
flex items-center justify-center text-2xl
shadow-[0_2px_8px_rgba(0,0,0,0.3)]

// Se host
border-bg-center shadow-[0_0_16px_rgba(250,250,57,0.3)]
+ emoji 👑 posicionado absolute top-[-6px] right-[-6px]

// Nome
font-hand text-white text-shadow-[1px_1px_3px_rgba(0,0,0,0.5)]
Formato: [Nome]
```

### Badge
```
rounded-pill font-condensed text-[11px] font-bold uppercase tracking-wider
px-3 py-1

// Variantes por cor de fundo:
HOST → bg-bg-center text-surface-primary
IMPOSTOR → bg-game-impostor text-white
SEGURO → bg-game-safe text-surface-primary
MESTRE → bg-game-special text-white
PRONTO → bg-game-info text-white
ELIMINADO → bg-gray-700 text-gray-400
```

### Timer
```
font-mono text-center

// Normal (>30s)
text-game-info

// Aviso (10-30s)
text-game-warning

// Urgente (<10s)
text-game-impostor animate-pulse
```

### PhaseIndicator
```
// Fase atual
border-[2px] border-game-info bg-game-info/10 text-game-info font-bold

// Fase passada
border border-game-safe/40 bg-game-safe/10 text-game-safe
Prefixo: "✓ "

// Fase futura
border border-white/5 bg-white/3 text-white/40

// Conector entre fases
w-2 h-0.5 (verde se passada, white/10 se futura)
```

---

## Background (ShaderGradient 3D)

Substituímos as 5 camadas CSS por um único componente WebGL via `@shadergradient/react`.

| Prop | Valor | Nota |
|------|-------|------|
| `type` | `"sphere"` | Forma 3D esférica |
| `uSpeed` | `0.3` | Velocidade de animação (lenta, ambiente) |
| `uStrength` | `1.2` | Intensidade da deformação |
| `uDensity` | `0.9` | Densidade da malha |
| `uFrequency` | `5.5` | Frequência de ondulação |
| `grain` | `"on"` | Ruído sutil sobre o gradiente |
| `lightType` | `"3d"` | Iluminação 3D |
| `brightness` | `1.4` | Brilho geral |
| `envPreset` | `"city"` | Preset de environment map |

### Variantes de cor

| Variante | color1 | color2 | color3 | Quando |
|----------|--------|--------|--------|--------|
| **default** | `#FF8940` | `#902EED` | `#FAFA39` | Home, lobby, estados normais |
| **valid** | `#4DDBA8` | `#602BFF` | `#00B8EB` | Código válido, ação de sucesso |
| **invalid** | `#FF577B` | `#8100B0` | `#D64DC2` | Flash de erro (400 ms → volta a default) |

### Fallback CSS

Antes do canvas WebGL montar, o body exibe:
```css
background: radial-gradient(circle, #FAFA39 0%, #FF8940 35%, #D64DC2 70%, #902EED 100%);
```

### Lazy loading

O `<ShaderGradientCanvas>` é montado apenas após o primeiro paint (`useEffect` + `useState(false → true)`) para não bloquear a renderização inicial.

---

## Animações

| Nome | CSS | Quando usar |
|------|-----|-------------|
| `fade-in` | opacity 0→1, scale 0.23→1, 300ms, cubic-bezier(1,0,1,0.61) | Entrada de tela/conteúdo |
| `fade-out` | Inverso do fade-in, cubic-bezier(0,1,0.61,1) | Saída de tela |
| `bounce-result` | scale oscila 0.85↔1.05, 900ms | Jogadores vencem |
| `shake` | translateX ±10px, 500ms | Impostor vence / erro |
| `pop-in` | scale 0→1.2→1, 300ms, spring | Jogador entra no lobby |
| `pulse-urgent` | scale 1↔1.1, 1s loop | Timer <10s |

---

## Layout do Lobby

```
┌──────────────────────────────────────────┐
│ [LOGO]                    [🔊] [🌐 PT]  │
│                                          │
│              [Jogador Top]               │
│                                          │
│  [Jogador     ┌──────────┐    Jogador]   │
│   Left]       │  CIRCLE  │    [Right]    │
│               │  branco  │               │
│               │ (conteúdo│               │
│               │  do jogo)│               │
│  [Jogador     └──────────┘    Jogador]   │
│   Left2]                      [Right2]   │
│                                          │
│             [Jogador Bottom]             │
│                                          │
│  Onrizon   PRIVACY TERMS CONTACT   🐦📸 │
└──────────────────────────────────────────┘
```

Jogadores distribuídos em posições cardeais ao redor do círculo.
O jogador atual fica sempre na posição bottom-center.
