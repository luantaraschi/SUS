# PROMPT 2 — CONVEX SCHEMA + SISTEMA DE SALAS

## Objetivo
Definir o schema completo do Convex, criar mutations/queries para salas, e implementar o fluxo completo de criar sala → compartilhar código → entrar na sala → lobby realtime.

## Tarefas

### 2.1 — Criar `convex/schema.ts`
```ts
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  rooms: defineTable({
    code: v.string(),                    // Código de 4 caracteres (ex: "ABCD")
    hostId: v.string(),                  // ID do jogador host (sessionId)
    mode: v.union(v.literal("word"), v.literal("question")), // Modo de jogo
    questionMode: v.optional(v.union(v.literal("system"), v.literal("master"))),
    status: v.union(v.literal("lobby"), v.literal("playing"), v.literal("finished")),
    settings: v.object({
      maxPlayers: v.number(),            // 3-12
      rounds: v.number(),               // 1-10
      discussionTime: v.number(),        // Segundos
      votingTime: v.number(),            // Segundos
      impostorHint: v.boolean(),         // Dica pro impostor (modo Palavra)
      isLocalMode: v.boolean(),          // Modo local (um dispositivo)
    }),
    currentRound: v.number(),            // Rodada atual (0 = ainda não começou)
  })
    .index("by_code", ["code"])
    .index("by_status", ["status"]),

  players: defineTable({
    roomId: v.id("rooms"),
    sessionId: v.string(),               // Identificador único da sessão (não precisa de auth)
    name: v.string(),
    emoji: v.string(),                   // Emoji do avatar
    isHost: v.boolean(),
    status: v.union(
      v.literal("connected"),
      v.literal("ready"),
      v.literal("disconnected")
    ),
    score: v.number(),                   // Placar acumulado
    joinedAt: v.number(),                // Timestamp
  })
    .index("by_room", ["roomId"])
    .index("by_session", ["sessionId"])
    .index("by_room_session", ["roomId", "sessionId"]),

  rounds: defineTable({
    roomId: v.id("rooms"),
    number: v.number(),                  // 1, 2, 3...
    mode: v.union(v.literal("word"), v.literal("question")),
    phase: v.union(
      v.literal("secret"),
      v.literal("answer"),
      v.literal("reveal"),
      v.literal("discussion"),
      v.literal("voting"),
      v.literal("result")
    ),
    impostorId: v.id("players"),         // Quem é o impostor
    masterId: v.optional(v.id("players")), // Quem é o mestre (modo pergunta/mestre)

    // Modo Palavra
    word: v.optional(v.string()),        // Palavra secreta
    hint: v.optional(v.string()),        // Dica pro impostor
    category: v.optional(v.string()),    // Categoria da palavra

    // Modo Pergunta
    question: v.optional(v.string()),           // Pergunta para jogadores comuns
    impostorQuestion: v.optional(v.string()),    // Pergunta diferente pro impostor

    phaseEndsAt: v.optional(v.number()),  // Timestamp de quando a fase atual expira
    votedOutId: v.optional(v.id("players")), // Quem foi eliminado na votação
    impostorWon: v.optional(v.boolean()), // Resultado da rodada
  })
    .index("by_room", ["roomId"])
    .index("by_room_number", ["roomId", "number"]),

  answers: defineTable({
    roundId: v.id("rounds"),
    playerId: v.id("players"),
    text: v.string(),
    submittedAt: v.number(),
  })
    .index("by_round", ["roundId"])
    .index("by_round_player", ["roundId", "playerId"]),

  votes: defineTable({
    roundId: v.id("rounds"),
    voterId: v.id("players"),
    targetId: v.id("players"),
  })
    .index("by_round", ["roundId"])
    .index("by_round_voter", ["roundId", "voterId"]),

  wordPacks: defineTable({
    category: v.string(),
    word: v.string(),
    hint: v.string(),                    // Dica relacionada (para o impostor)
  })
    .index("by_category", ["category"]),

  questionPacks: defineTable({
    category: v.string(),
    question: v.string(),                // Pergunta dos jogadores comuns
    impostorQuestion: v.string(),        // Pergunta do impostor
  })
    .index("by_category", ["category"]),
});
```

### 2.2 — Criar `convex/rooms.ts` (mutations + queries)

**Mutations:**

- `createRoom`: Recebe `hostName`, `hostEmoji`, `mode`, `settings`. Gera código de 4 chars único (letras maiúsculas, sem ambiguidade — excluir O/0/I/1/L). Insere room + player (host). Retorna `{ roomId, code, playerId }`.

- `joinRoom`: Recebe `code`, `playerName`, `playerEmoji`. Valida: sala existe? Status é "lobby"? Não está cheia? Nome não duplicado? Insere player. Retorna `{ roomId, playerId }`. Se code inválido, throw com mensagem amigável.

- `leaveRoom`: Recebe `playerId`. Remove o player. Se era o host, transfere host para o próximo jogador. Se não sobrar ninguém, deleta a sala.

- `updateSettings`: Recebe `roomId`, `sessionId` (verifica se é host), `settings` parcial. Atualiza settings da sala.

- `kickPlayer`: Recebe `roomId`, `sessionId` (host), `targetPlayerId`. Remove o jogador alvo.

**Queries (reativas):**

- `getRoomByCode`: Recebe `code`. Retorna room completa ou null.

- `getPlayers`: Recebe `roomId`. Retorna lista de players ordenada por `joinedAt`. **NUNCA retornar dados de outras rodadas aqui.**

- `getMyPlayer`: Recebe `roomId`, `sessionId`. Retorna o player do usuário atual.

- `getRoomState`: Recebe `roomId`. Retorna room + players + rodada atual (se existir) — composta query para o lobby/jogo ter tudo que precisa numa única subscription.

### 2.3 — Criar helper `convex/lib/generateCode.ts`
Função que gera código de 4 caracteres aleatórios (A-Z excluindo O, I, L) e verifica no DB se já existe. Se existir, gera outro. Máximo 5 tentativas.

### 2.4 — Criar `convex/lib/sessionId.ts`
No frontend, geramos um `sessionId` único no primeiro acesso e salvamos em um cookie/contexto. Criar:
- `lib/useSessionId.ts` — hook React que gera UUID v4 no primeiro render e persiste (usar `crypto.randomUUID()`)
- Passar `sessionId` em todas as mutations/queries que precisam identificar o jogador

### 2.5 — Implementar tela Home `/app/(game)/page.tsx`

Layout dentro do `GameCircle`:
1. Logo "SUS" no topo (usar font-display, tamanho grande)
2. Input de nome (com placeholder "Anônimo" + número aleatório, variante "text")
3. Input de código (variante "code", 4 caracteres, uppercase automático)
4. Botão "ENTRAR" (outline, desabilitado se código vazio) — chama `joinRoom`
5. Botão "CRIAR SALA" (filled) — navega para modal/tela de config antes de criar
6. Botão "COMO JOGAR" (outline, abre modal com regras)

Jogadores ao redor do círculo: não mostrar nada nesta tela (só aparecem no lobby).

O gradiente do background deve:
- Mudar para "valid" quando o código digitado for de uma sala existente
- Mudar para "invalid" (e shake no círculo) se o usuário tentar entrar e falhar
- Default no estado normal

### 2.6 — Implementar tela Lobby `/app/(game)/room/[code]/page.tsx`

Dentro do `GameCircle`:
1. "ROOM CODE:" + blocos individuais do código (quadradinhos coloridos info)
2. Botões de visualizar/ocultar código e compartilhar (copiar link)
3. Configurações: PLAYERS (counter com ▼▲) e ROUNDS (counter com ▼▲) — só host pode editar
4. Seletor de modo: "PALAVRA" ou "PERGUNTA" — só host pode trocar
5. Toggle "Dica do Impostor" (só aparece no modo Palavra)
6. Botão "START" (filled, só habilitado com 3+ jogadores, só host pode clicar)
7. Botão "BACK" (outline, sai da sala)

Jogadores distribuídos ao redor do círculo:
- Usar `PlayerAvatar` em posições cardeais calculadas (top, top-right, right, bottom-right, etc.)
- Máximo 12 posições
- O jogador atual fica sempre embaixo (bottom center)
- Host tem coroa 👑 e borda amarela

Tudo reativo: quando alguém entra, o avatar aparece instantaneamente. Quando o host muda settings, todos veem.

### 2.7 — Configurar ConvexProvider
Em `app/providers.tsx`:
```tsx
"use client";
import { ConvexProvider, ConvexReactClient } from "convex/react";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export function Providers({ children }: { children: React.ReactNode }) {
  return <ConvexProvider client={convex}>{children}</ConvexProvider>;
}
```
Usar no layout raiz.

## Resultado Esperado
Ao final: consigo abrir a home, digitar um nome, criar uma sala, ver o código gerado, copiar o link, abrir em outra aba, entrar com o código, e ver os dois jogadores aparecendo ao redor do círculo em tempo real. O host pode configurar players/rounds e ver as mudanças refletidas para todos.

## Segurança Crítica
- **NUNCA** enviar `impostorId` ao frontend em queries do lobby
- Validar em TODA mutation se o `sessionId` corresponde a um player da sala
- Validar se o `sessionId` é do host antes de permitir editar settings/kick/start
