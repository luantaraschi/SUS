# PROMPT 5 — MODO LOCAL + POLISH

## Objetivo
Implementar o modo local (jogar presencialmente com um único dispositivo), múltiplas rodadas consecutivas, e polimentos visuais.

## Tarefas

### 5.1 — Modo Local: Fluxo de Criação

Na tela Home, ao clicar "CRIAR SALA", exibir toggle "Modo Local" na tela de configuração.

Quando modo local está ativo:
- Não gera código de sala (ou gera mas não exibe — a sala não recebe jogadores de fora)
- Em vez de esperar jogadores entrarem por link, o host informa os nomes dos participantes
- Interface: inputs empilhados "Jogador 1: [nome]", "Jogador 2: [nome]"... com botão "+" para adicionar
- Botão "–" para remover (mínimo 3)
- Todos os players são criados pelo mesmo sessionId (o dispositivo do host), mas com nomes diferentes
- Mutation `createLocalRoom`: cria sala + todos os players de uma vez

### 5.2 — Tela de Passagem ("Passe o Celular")

No modo local, antes de mostrar o segredo de cada jogador:

Componente `PassDeviceScreen.tsx`:
1. Tela cheia (sobre o GameCircle) com fundo overlay (#200268 com 95% opacity)
2. Texto "PASSE PARA:" em font-display
3. Nome do próximo jogador em font-display 48px com emoji
4. Botão "ESTOU PRONTO" (grande, filled)
5. Ao clicar: mostra o segredo (palavra ou pergunta) por X segundos
6. Botão "ENTENDI, PRÓXIMO" → mostra PassDeviceScreen para o próximo jogador
7. Quando todos viram → avança a fase

**Segurança do modo local**: os segredos são mostrados um por vez. Após o jogador confirmar, a tela volta ao estado "PASSE PARA..." antes de mostrar qualquer dado.

### 5.3 — Adaptações do Modo Pergunta no Local

No modo local, a fase "answer":
- Cada jogador digita sua resposta um por vez
- Antes de cada input: tela "PASSE PARA [nome]"
- Após digitar: confirma, tela volta ao "PASSE PARA..."
- Quando todos responderam → revelação simultânea (todos olham juntos)

### 5.4 — Votação no Modo Local

Na votação local:
- Cada jogador pega o dispositivo, vota, confirma, e passa
- Tela "PASSE PARA [nome]" entre cada voto
- Os votos ficam ocultos até todos votarem
- Revelação dos votos: todos olham o resultado juntos

### 5.5 — Múltiplas Rodadas Consecutivas

Após a tela de resultado:
- Botão "PRÓXIMA RODADA" (só host no online, qualquer um no local)
- Ao clicar: mutation `startRound` com o mesmo roomId, incrementando currentRound
- Placar acumulado visível em algum lugar (mini tabela ou badges no avatar)
- O impostor da próxima rodada é sorteado novamente (idealmente evitar repetir até todos terem sido impostor pelo menos 1x)

### 5.6 — Placar Final

Componente `FinalScoreboard.tsx`:
- Aparece quando `currentRound > settings.rounds`
- Dentro do GameCircle:
  - "PLACAR FINAL" em font-display
  - Lista rankeada de jogadores por score
  - 1º lugar: coroa 👑, destaque com borda amarela e bg sutil
  - 2º lugar: badge prata
  - 3º lugar: badge bronze
  - Stats por jogador: vezes impostor, vezes detectado, vezes enganou
  - Botão "JOGAR NOVAMENTE" (reseta scores, volta ao lobby)
  - Botão "SAIR" (volta à home)

### 5.7 — Animações e Feedback Visual

Usando framer-motion, implementar:

**Transições de tela:**
- Entrada: `initial={{ opacity: 0, scale: 0.23 }} animate={{ opacity: 1, scale: 1 }}` com transition 300ms e cubic-bezier custom
- Saída: inverso

**Resultado da votação:**
- Jogadores vencem: animação bounce no GameCircle (scale oscila 0.85↔1.05 por 900ms)
- Impostor vence: shake horizontal (translateX ±10px por 500ms)

**Timer expirando:**
- Quando <10s: pulse animation no timer (scale 1↔1.1 a cada 1s)
- Quando 0: flash de tela (overlay branco 100ms)

**Jogador entrando no lobby:**
- Pop-in animation com overshoot (scale 0→1.2→1)

**Voto confirmado:**
- Bolinha verde aparece com scale spring animation

### 5.8 — Sons (opcional, estrutura)

Criar hook `useSounds.ts` com:
- `playJoin()` — som de "pop" quando alguém entra
- `playCountdown()` — tick a cada segundo nos últimos 5s
- `playReveal()` — som de "whoosh" na revelação
- `playVote()` — som de "stamp" ao votar
- `playWin()` — fanfarra quando jogadores vencem
- `playLose()` — som sombrio quando impostor vence

Usar Web Audio API ou `<audio>` com mp3s. Por enquanto, só criar a estrutura e placeholders — os sons podem ser adicionados depois.

### 5.9 — Responsividade

O jogo é desktop-first, mas precisa funcionar em tablet:
- GameCircle: `max-w-[636px]` no desktop, `max-w-[90vw]` em telas menores
- Jogadores ao redor: ajustar distância do centro baseado no viewport
- Em telas < 768px: jogadores vão para uma lista horizontal abaixo do círculo em vez de ao redor
- Textos: usar clamp() para font-sizes responsivos
- Inputs: full-width em mobile

### 5.10 — Tratamento de Erros e Edge Cases

- **Jogador sai no meio da rodada**: mutation `handleDisconnect` — marca player como "disconnected". Na votação, jogadores desconectados não votam e não podem ser votados. Na contagem de "todos prontos", desconectados são ignorados.
- **Host sai**: transferir host para o próximo jogador (mais antigo na sala)
- **Sala vazia**: se todos saírem, deletar sala após 5 minutos (scheduled function)
- **Reconexão**: se um player com o mesmo sessionId tenta entrar numa sala onde já está, reconectar em vez de criar duplicata
- **Nome duplicado**: não permitir dois jogadores com o mesmo nome na sala
- **Código expirado**: salas em status "lobby" sem atividade por 30 min → deletar (scheduled function)

## Resultado Esperado
Jogo completo com modo local funcionando (passar o celular), múltiplas rodadas com placar acumulado, animações polidas, e edge cases tratados. O jogo é jogável de verdade com amigos.
