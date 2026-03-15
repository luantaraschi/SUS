# PROMPT 0 — CONTEXTO DO PROJETO (cole isso como system prompt ou primeiro prompt da conversa)

Você vai me ajudar a construir o **SUS** — um jogo web de dedução social multiplayer em tempo real. O projeto usa **Next.js 14+ (App Router) + Convex (backend/realtime/db) + Tailwind CSS + shadcn/ui**.

## Visão Geral do Jogo

SUS é um jogo onde jogadores entram numa sala por código/link, recebem informações secretas e tentam descobrir quem é o impostor através de blefe, discussão e votação.

### Modos de Acesso
- **Modo Online**: Cada jogador no seu dispositivo, entra por link/código
- **Modo Local**: Um único dispositivo, jogadores passam o celular entre si

### Modos de Jogo
- **Modo Palavra**: Todos recebem a mesma palavra secreta. O impostor recebe apenas "Você é o impostor!" (opcionalmente com uma dica relacionada)
- **Modo Pergunta**: Todos recebem uma pergunta, mas o impostor recebe uma pergunta diferente (formulada para produzir resposta parecida). Sub-variações:
  - **Perguntas do Sistema**: Plataforma escolhe aleatoriamente
  - **Modo Mestre**: Um jogador cria as perguntas (não joga na rodada)

### Fluxo de uma Rodada
1. Sala configurada → jogo distribui informações secretas
2. No modo Pergunta: jogadores digitam respostas e marcam "pronto"
3. Contagem regressiva → revelação simultânea das respostas
4. Fase de discussão (timer configurável)
5. Fase de votação (cada um vota em quem acha ser impostor)
6. Resultado: revela quem era o impostor + placar

## Stack Técnica
- **Frontend**: Next.js 14+ (App Router), TypeScript
- **Estilização**: Tailwind CSS + shadcn/ui
- **Backend/DB/Realtime**: Convex (queries reativas, mutations transacionais, actions)
- **Auth**: Convex Auth (sessões anônimas para jogadores, conta opcional para hosts)
- **Deploy**: Vercel (front) + Convex Cloud (back)

## Design System — Estilo Visual (inspirado em Funocracy/Onrizon)

### Paleta de Cores
```
// Background gradiente radial animado (cicla entre tons)
--bg-center: #FAFA39 (amarelo brilhante)
--bg-mid1: #FF8940 (laranja)
--bg-mid2: #D64DC2 (magenta)
--bg-outer: #902EED (roxo profundo)

// Gradiente "Valid" (código correto, sucesso)
--bg-valid-center: #4DDBA8
--bg-valid-mid: #00B8EB
--bg-valid-outer: #852EFF

// Gradiente "Invalid" (erro)
--bg-invalid-center: #FF577B
--bg-invalid-mid: #D12977
--bg-invalid-outer: #8100B0

// Superfícies
--surface-primary: #200268 (roxo ultra-escuro — botões, bordas, texto em fundo claro)
--surface-secondary: #36128F (hover, elevado)
--surface-white: #FFFFFF (interior do círculo central, cards)
--surface-overlay: rgba(32, 2, 104, 0.80)

// Semânticas
--color-impostor: #FF577B
--color-safe: #4DDBA8
--color-info: #00B8EB
--color-warning: #FF8940
--color-special: #D64DC2
--color-logo-green: #7ED957
```

### Tipografia (Google Fonts)
```
Display/Logo/Botões: "Londrina Solid" (cursive) — títulos, logo, labels de botão, números grandes
Body/Descrições: "Balsamiq Sans" (cursive) — regras, respostas, diálogos, erros
Handwritten/Nomes: "Kalam" (cursive) — nomes de jogadores [entre colchetes], notas
Condensed/Labels: "Oswald" (sans-serif) — badges, labels, contadores PLAYERS/ROUNDS
Mono/Códigos: "JetBrains Mono" (monospace) — código de sala, timer
```

### Elementos Visuais Chave
1. **Background**: Gradiente radial animado (centro amarelo → laranja → magenta → roxo) + sunburst rays girando + vídeo com mix-blend-mode: color-burn + textura overlay + halftone dots nos cantos
2. **Círculo Central**: Área principal do conteúdo (636px) — fundo branco, borda 5px #200268
3. **Jogadores ao Redor**: Distribuídos em posições cardeais ao redor do círculo como numa mesa redonda
4. **Botões**: border-radius: 999px (pill), borda 3px #200268, font Londrina Solid uppercase. Filled (#200268) ou outline (transparent + borda). Hover: scale(1.06)
5. **Inputs**: Dentro do círculo branco, border-radius pill, borda 2.5px. Focus: borda #00B8EB com glow. Error: borda #FF577B
6. **Logo SUS**: Estrela/burst 16 pontas (#200268 com borda branca), texto "SuS" em verde #7ED957 com contorno, emojis 😡👍 flutuando
7. **Transições**: Entrada scale(0.23)→1 em 300ms. Resultado certo: bounce. Erro: shake horizontal.

### Estrutura de Pastas Esperada
```
/app                         → Rotas Next.js (App Router)
/app/(game)/room/[code]      → Página dinâmica da sala (lobby)
/app/(game)/room/[code]/play → Tela da rodada ativa
/components/game             → Componentes do jogo (Lobby, Round, Vote, etc.)
/components/ui               → shadcn/ui components
/convex/schema.ts            → Schema do banco (Convex)
/convex/rooms.ts             → Mutations e queries de salas
/convex/rounds.ts            → Lógica de rodadas
/convex/votes.ts             → Lógica de votação
/convex/words.ts             → Gerenciamento de palavras/perguntas
/lib/gameLogic.ts            → Funções puras de regras do jogo
```

Quando eu enviar prompts subsequentes, use SEMPRE este contexto como base. Não repita a explicação do projeto — vá direto ao código.
