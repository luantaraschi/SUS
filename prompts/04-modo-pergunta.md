# PROMPT 4 — MODO PERGUNTA

## Objetivo
Implementar o segundo modo de jogo: Modo Pergunta, com digitação de respostas, revelação simultânea, e a variação "Modo Mestre".

## Pré-requisito
O Prompt 3 (Modo Palavra) precisa estar funcionando. Este prompt reutiliza toda a infraestrutura de discussão, votação e resultado.

## Tarefas

### 4.1 — Seed de perguntas `convex/seeds/questions.ts`

Criar action `seedQuestions` que popula `questionPacks`. Cada entrada: `category`, `question` (para jogadores), `impostorQuestion` (para o impostor).

A pergunta do impostor deve ser formulada para produzir respostas PARECIDAS mas não idênticas. Exemplos:

**Categoria: Hábitos**
- Pergunta: "O que você faz primeiro ao acordar?"
- Impostor: "O que você faz antes de dormir?"

**Categoria: Preferências**
- Pergunta: "Qual comida você poderia comer todo dia?"
- Impostor: "Qual comida você nunca mais comeria?"

**Categoria: Hipotéticas**
- Pergunta: "Se ganhasse na loteria, o que compraria primeiro?"
- Impostor: "Se pudesse ganhar qualquer coisa de presente, o que seria?"

**Categoria: Opiniões**
- Pergunta: "Qual a pior desculpa que alguém já te deu?"
- Impostor: "Qual a melhor desculpa que você já inventou?"

**Categoria: Memórias**
- Pergunta: "Qual a viagem mais inesquecível que você fez?"
- Impostor: "Qual lugar do mundo você mais quer conhecer?"

Mínimo 50 pares de perguntas, 8+ categorias.

### 4.2 — Adaptar `startRound` para modo Pergunta

Se `room.mode === "question"`:
1. Se `questionMode === "system"`: sortear um par de perguntas do `questionPacks`
2. Inserir round com: mode "question", phase "secret", impostorId, question, impostorQuestion
3. Se `questionMode === "master"`: sortear ou selecionar o mestre → setar phase "master-setup" (fase extra antes do secret)

### 4.3 — Query `getMySecret` — adaptar para modo Pergunta

Se mode é "question":
- Jogador normal: `{ role: "player", question: round.question }`
- Impostor: `{ role: "impostor", question: round.impostorQuestion }`

**Observação**: O impostor recebe SUA pergunta como se fosse a pergunta normal. Ele NÃO sabe que tem uma pergunta diferente (a UI mostra "Sua pergunta:" igualmente para todos). A diferença só aparece nas respostas.

### 4.4 — Fase Secret (adaptar `SecretPhase.tsx`)

No modo pergunta, a SecretPhase mostra:
- "Sua pergunta:" (font-body, muted)
- A pergunta em font-display tamanho 24-28px (perguntas são mais longas que palavras)
- "Pense na sua resposta antes de digitar" em font-body
- Botão "ENTENDI → RESPONDER" que avança o jogador para a fase de resposta

Neste modo, quando todos marcam entendi, avança para phase "answer" (não "discussion").

### 4.5 — Componente `AnswerPhase.tsx` (NOVO — só modo Pergunta)

Dentro do GameCircle:
- "DIGITE SUA RESPOSTA" em font-display
- A pergunta do jogador mostrada acima (font-body, menor)
- Textarea/input grande (GameInput variante "text", multiline, maxLength 200)
- Contador de caracteres "87/200"
- Botão "✓ PRONTO" (variant success) — chama mutation `submitAnswer`
- Indicadores de quem já respondeu: "3/5 prontos" + bolinha verde ao lado do avatar de quem já respondeu (SEM mostrar as respostas)

Mutation `submitAnswer`:
- Recebe: `roundId`, `sessionId`, `text`
- Validar: round existe, phase é "answer", player ainda não respondeu, texto não vazio
- Inserir em `answers`
- Se TODOS responderam → avançar para phase "reveal"

### 4.6 — Componente `RevealPhase.tsx` (NOVO — só modo Pergunta)

Momento de tensão: contagem regressiva antes de mostrar todas as respostas.

1. Contagem regressiva de 3 segundos: "3... 2... 1..." (font-display 96px, cada número com fade + scale animation)
2. Ao final: todas as respostas aparecem simultaneamente

Layout das respostas:
- Grid de cards (2 colunas no desktop, 1 no mobile)
- Cada card: nome do jogador (font-hand com colchetes) + resposta (font-body, itálico, entre aspas)
- Cards aparecem com staggered animation (delay de 100ms entre cada)
- Nenhuma indicação de quem é impostor — todos parecem iguais

Após 5 segundos de revelação, mostrar botão "IR PARA DISCUSSÃO" (ou avançar automaticamente)

### 4.7 — Modo Mestre (`questionMode === "master"`)

Quando o modo é "master":

**Fase extra: "master-setup"**
1. O mestre é selecionado (aleatório, por votação, ou escolha do host — MVP: aleatório)
2. Tela do mestre: dois inputs
   - "Pergunta para os jogadores:" (textarea)
   - "Pergunta para o impostor:" (textarea)
   - Botão "CONFIRMAR PERGUNTAS"
3. Tela dos outros jogadores: "O MESTRE está preparando as perguntas..." com loading spinner
4. Mutation `submitMasterQuestions`: mestre envia as duas perguntas → round atualizado → avança para "secret"

**O mestre NÃO joga nesta rodada**: não recebe pergunta, não responde, não vota. Ele observa.
- Na votação, o mestre vê tudo mas não pode votar
- Nos resultados, o mestre aparece com badge "MESTRE 🎭"
- Na próxima rodada, outro jogador será o mestre

### 4.8 — Adaptar fluxo de fases para modo Pergunta

Modo Palavra: `secret → discussion → voting → result`
Modo Pergunta (sistema): `secret → answer → reveal → discussion → voting → result`
Modo Pergunta (mestre): `master-setup → secret → answer → reveal → discussion → voting → result`

Adaptar `advancePhase`, `PhaseIndicator`, e o switch na tela de jogo.

### 4.9 — Adaptar `ResultPhase.tsx`

No modo Pergunta, além de revelar quem era o impostor, mostrar:
- A pergunta dos jogadores normais
- A pergunta do impostor (revelação: "O IMPOSTOR respondeu a pergunta: '...'")
- Highlight na resposta do impostor (borda warning/impostor)

## Resultado Esperado
Modo Pergunta completo: todos recebem perguntas → digitam respostas → revelação simultânea → discussão → votação → resultado. Modo Mestre também funcional: um jogador cria as perguntas e observa.
