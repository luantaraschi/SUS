# PROMPT 3 — MODO PALAVRA (JOGO COMPLETO)

## Objetivo
Implementar o primeiro modo de jogo completo: Modo Palavra. Do "host clica START" até o resultado da rodada, incluindo distribuição de palavras, tela secreta, discussão com timer, votação e resultado.

## Tarefas

### 3.1 — Seed de palavras `convex/seeds/words.ts`

Criar um action `seedWords` que popula a tabela `wordPacks` com pelo menos 80 palavras em português, organizadas por categoria. Cada entrada tem: `category`, `word`, `hint` (dica pro impostor).

Categorias e exemplos:
- **Comida**: Pizza/Comida, Sushi/Japão, Feijoada/Brasil, Brigadeiro/Doce, Açaí/Fruta...
- **Lugares**: Praia/Natureza, Cinema/Entretenimento, Hospital/Saúde, Shopping/Compras...
- **Animais**: Gato/Pet, Tubarão/Mar, Papagaio/Ave, Elefante/Grande...
- **Objetos**: Celular/Tecnologia, Guarda-chuva/Chuva, Óculos/Visão...
- **Profissões**: Médico/Saúde, Astronauta/Espaço, Padeiro/Comida...
- **Ações**: Dormir/Descanso, Cozinhar/Comida, Nadar/Água, Dançar/Música...
- **Conceitos**: Saudade/Sentimento, Carnaval/Festa, Férias/Viagem...

Mínimo 10 palavras por categoria. A dica deve ser uma palavra genérica relacionada que ajuda o impostor sem entregar a resposta.

### 3.2 — Mutation `startRound` em `convex/rounds.ts`

Quando o host clica START:
1. Validar: host é quem está pedindo? 3+ jogadores? Sala em status "lobby" ou rodada anterior já finalizada?
2. Buscar todos os players conectados da sala
3. Sortear um impostor aleatoriamente (com peso para quem foi menos impostor nas rodadas anteriores — ou aleatório puro no MVP)
4. Sortear uma palavra aleatória do `wordPacks` (evitar repetir na mesma sessão se possível)
5. Inserir nova entrada em `rounds` com: mode "word", phase "secret", impostorId, word, hint, category
6. Atualizar room: status "playing", currentRound incrementado
7. Retornar roundId

### 3.3 — Query `getMySecret` em `convex/rounds.ts`

**SEGURANÇA CRÍTICA**: Esta query é o coração da segurança do jogo.

Recebe: `roundId`, `sessionId`
1. Buscar o player pelo sessionId
2. Buscar a rodada pelo roundId
3. Se o player NÃO é o impostor: retornar `{ role: "player", word: round.word, category: round.category }`
4. Se o player É o impostor E `settings.impostorHint` é true: retornar `{ role: "impostor", hint: round.hint }`
5. Se o player É o impostor E hint desabilitada: retornar `{ role: "impostor" }`
6. **NUNCA retornar**: `impostorId`, a palavra para o impostor, ou qualquer dado que identifique quem é quem

### 3.4 — Tela da Rodada `/app/(game)/room/[code]/play/page.tsx`

Componente principal que gerencia o fluxo baseado na `phase` da rodada:

```tsx
// Renderiza o componente correto baseado na fase
switch (round.phase) {
  case "secret": return <SecretPhase />;
  case "discussion": return <DiscussionPhase />;
  case "voting": return <VotingPhase />;
  case "result": return <ResultPhase />;
}
```

### 3.5 — Componente `SecretPhase.tsx`

Dentro do GameCircle:
- Se o jogador é player normal:
  - Mostrar "Sua palavra secreta:" (font-body, cor muted)
  - Mostrar a PALAVRA em font-display tamanho 48px
  - Emoji relevante abaixo
  - Botão "ENTENDI" que marca o jogador como ready

- Se o jogador é impostor:
  - Background do card muda (fundo #200268, borda #FF577B com glow)
  - Emoji 🕵️
  - "VOCÊ É O IMPOSTOR!" em font-display, cor impostor, com text-shadow glow
  - "Blefe o melhor que puder" em font-body
  - Se hint ativa: mostrar a dica num card menor com borda dashed
  - Botão "ENTENDI" (mesmo fluxo)

- Quando TODOS os jogadores marcarem "ENTENDI", avançar automaticamente para a fase de discussão (mutation `advancePhase`)

### 3.6 — Mutation `advancePhase` em `convex/rounds.ts`

Recebe: `roundId`
Lógica:
- `secret` → `discussion` (setar `phaseEndsAt` com timestamp atual + discussionTime)
- `discussion` → `voting` (setar `phaseEndsAt` com timestamp atual + votingTime)
- `voting` → `result` (calcular resultado — ver 3.8)

Usar `ctx.scheduler.runAfter` do Convex para agendar a transição automática quando o timer expira:
```ts
await ctx.scheduler.runAfter(
  settings.discussionTime * 1000,
  internal.rounds.autoAdvancePhase,
  { roundId, expectedPhase: "discussion" }
);
```

### 3.7 — Componente `DiscussionPhase.tsx`

Dentro do GameCircle:
- "FASE DE DISCUSSÃO" em font-display
- Timer grande no centro (font-display 48px, cor info quando >30s, cor impostor quando <10s)
- Barra de progresso abaixo do timer
- Texto "Conversem e descubram quem é o impostor!" em font-body
- PhaseIndicator no topo mostrando todas as fases com a atual destacada
- Jogadores ao redor com seus avatares
- Quando timer zera → avança automaticamente para votação

Componente `Timer.tsx`:
- Props: `endsAt` (timestamp), `onComplete` callback
- Calcula tempo restante via `useEffect` + `setInterval`
- Muda de cor: >30s: info (#00B8EB), 10-30s: warning (#FF8940), <10s: impostor (#FF577B) com pulse animation
- Barra de progresso diminuindo

### 3.8 — Componente `VotingPhase.tsx`

Dentro do GameCircle:
- "VOTAÇÃO" em font-display
- Timer (menor que o de discussão)
- Lista de TODOS os jogadores (exceto você) como cards clicáveis
- Cada card: avatar + nome. Ao clicar, seleciona (borda impostor). Clicar de novo deseleciona.
- Botão "VOTAR" (variant danger) — habilitado só quando alguém está selecionado
- Indicadores de quem já votou (sem mostrar em quem): "3/5 votaram" com bolinha ao lado do avatar de quem já votou
- Mutation `submitVote`: insere em `votes`, valida que não votou duas vezes

Quando todos votarem OU timer acabar → `advancePhase` para "result"

### 3.9 — Lógica de Resultado em `advancePhase` (phase voting → result)

1. Buscar todos os votos da rodada
2. Contar votos por target
3. Determinar quem teve mais votos (em caso de empate: ninguém é eliminado → impostor vence)
4. Se o mais votado É o impostor → jogadores vencem, cada jogador ganha +1 ponto
5. Se o mais votado NÃO é o impostor → impostor vence, impostor ganha +3 pontos
6. Se ninguém votou → impostor vence
7. Atualizar round: `votedOutId`, `impostorWon`
8. Atualizar scores dos players

### 3.10 — Componente `ResultPhase.tsx`

Dentro do GameCircle:
- Animação de resultado: bounce se jogadores venceram, shake se impostor venceu
- Gradiente do background muda: `valid` se jogadores venceram, `invalid` se impostor venceu
- Mostrar a barra de votos: cada jogador com barra proporcional + contagem
- O mais votado aparece com line-through e badge "ELIMINADO"
- Revelar: "FULANO era o IMPOSTOR!" ou "FULANO era INOCENTE!" com emoji e animação
- Placar: "JOGADORES VENCEM! 🎉" ou "IMPOSTOR VENCE! 🕵️"
- Revelar a palavra secreta para todos
- Botão "PRÓXIMA RODADA" (se ainda tiver rodadas) ou "VER PLACAR FINAL" (se última rodada) — só host
- Botão "VOLTAR AO LOBBY" (outline)

### 3.11 — Componente `PhaseIndicator.tsx`

Barra horizontal com todas as fases:
- `secret` → `answer` (só modo pergunta) → `reveal` (só modo pergunta) → `discussion` → `voting` → `result`
- Fase atual: borda info, fundo info/10, texto info bold
- Fases passadas: "✓" prefixo, fundo safe/10, borda safe/40
- Fases futuras: fundo transparente, borda muted
- Conector entre fases: linha de 8px (verde se passada, muted se futura)

### 3.12 — Placar Final (modal/tela)

Quando todas as rodadas acabarem:
- Mostrar ranking de jogadores por score
- 1º lugar com coroa 👑 e destaque
- Botão "NOVA PARTIDA" (volta ao lobby com mesmos jogadores)
- Botão "SAIR" (volta à home)

## Resultado Esperado
Jogo completo no modo Palavra: criar sala → jogadores entram → host inicia → cada um vê sua palavra/impostor → discutem com timer → votam → veem resultado → próxima rodada → placar final. Tudo em tempo real, tudo reativo.
