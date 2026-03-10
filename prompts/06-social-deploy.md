# PROMPT 6 — FEATURES SOCIAIS + DEPLOY

## Objetivo
Adicionar funcionalidades de retenção (contas opcionais, histórico, palavras custom, compartilhamento), configurar PWA e fazer deploy.

## Tarefas

### 6.1 — Contas Opcionais com Convex Auth

Implementar autenticação opcional usando Convex Auth:
- Jogadores podem jogar SEM conta (sessão anônima via sessionId, como já funciona)
- Opção de "Criar Conta" na home ou no lobby (botão discreto no canto)
- Métodos: Google OAuth + email/senha
- Quando um jogador anônimo cria conta, vincular o sessionId atual à conta
- Benefícios de ter conta: salvar histórico, nome/emoji persistente, stats

Setup:
```bash
npm install @convex-dev/auth @auth/core
```
Configurar `convex/auth.ts` com Google OAuth provider e Password provider.

### 6.2 — Histórico de Partidas

Nova tabela `gameHistory`:
```ts
gameHistory: defineTable({
  odId: v.optional(v.id("users")), // Auth user id, se tiver conta
  sessionId: v.string(),
  roomCode: v.string(),
  mode: v.string(),
  totalRounds: v.number(),
  wasImpostor: v.number(),         // Quantas vezes foi impostor
  timesDetected: v.number(),       // Vezes que foi pego como impostor
  timesSurvived: v.number(),       // Vezes que enganou como impostor
  correctVotes: v.number(),        // Vezes que votou no impostor certo
  finalScore: v.number(),
  finalRank: v.number(),           // 1º, 2º, 3º...
  totalPlayers: v.number(),
  playedAt: v.number(),
})
```

No `ResultPhase` final (após última rodada), salvar automaticamente para todos os jogadores.

Tela de perfil (se logado): `/app/profile/page.tsx`
- Stats gerais: partidas jogadas, win rate, vezes impostor, melhor streak
- Últimas 20 partidas com detalhes

### 6.3 — Palavras e Perguntas Customizadas

Na tela de configuração do lobby (só host):
- Toggle "Usar minhas palavras" (aparece se host tem conta)
- Se ativado: área de texto onde o host pode colar uma lista de palavras (uma por linha)
- Formato: `palavra | dica` (dica é opcional)
- Mutation `saveCustomWordPack`: salva vinculado à conta do host
- Dropdown para selecionar pack salvo em futuras partidas

Para modo Pergunta:
- Toggle "Usar minhas perguntas"
- Formato: `pergunta jogadores | pergunta impostor`
- Mesmo fluxo de salvar/selecionar

### 6.4 — Compartilhar Resultado

Componente `ShareResult.tsx`:
- Botão "COMPARTILHAR" na tela de resultado final
- Gera imagem/card com:
  - Logo SUS
  - "Jogamos SUS! 🕵️"
  - Resultado resumido: "5 jogadores, 3 rodadas"
  - "O impostor [enganou todo mundo / foi pego X vezes]"
  - Link para o jogo
- Usar Web Share API (navigator.share) se disponível, senão copiar link

### 6.5 — Configurações Avançadas

Expandir o painel de settings do host no lobby:
- Número de impostores (1 ou 2 — para 7+ jogadores)
- Tempo de discussão: 30s, 60s, 90s, 120s, 180s, ∞
- Tempo de votação: 15s, 30s, 45s, 60s, ∞
- Número de rodadas: 1-10
- Categorias ativas (selecionar quais categorias de palavras/perguntas usar)
- Dica do impostor: on/off (modo Palavra)
- Modo de seleção do mestre: aleatório / por votação / host escolhe (modo Pergunta/Mestre)

### 6.6 — PWA (Progressive Web App)

Criar `public/manifest.json`:
```json
{
  "name": "SUS - Jogo de Dedução Social",
  "short_name": "SUS",
  "description": "Jogo multiplayer de blefe e dedução entre amigos",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#200268",
  "theme_color": "#200268",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

Adicionar `<link rel="manifest">` no layout. Criar ícones baseados na logo (burst + SuS verde).

### 6.7 — SEO e Meta Tags

No `app/layout.tsx`:
- Title: "SUS — Jogo de Dedução Social Online"
- Description: "Jogue com amigos! Descubra quem é o impostor através de blefe, perguntas e votação."
- Open Graph image: card com logo + gradiente do jogo
- Twitter card: summary_large_image

### 6.8 — Deploy

**Convex Cloud:**
```bash
npx convex deploy
```

**Vercel:**
- Conectar repo ao Vercel
- Adicionar env var: `NEXT_PUBLIC_CONVEX_URL` (pegar do Convex dashboard)
- Deploy automático via push

**Domínio:**
- Configurar domínio custom no Vercel (se tiver)
- Atualizar CORS no Convex se necessário

### 6.9 — Testes Manuais Finais

Checklist antes de lançar:
- [ ] Criar sala online, 3+ jogadores em abas diferentes
- [ ] Modo Palavra completo: segredo → discussão → votação → resultado
- [ ] Modo Pergunta completo: segredo → resposta → revelação → discussão → votação → resultado
- [ ] Modo Mestre funcional
- [ ] Modo Local: criar com 4 nomes, jogar rodada inteira passando dispositivo
- [ ] Múltiplas rodadas com placar cumulativo
- [ ] Host sai: outro jogador assume
- [ ] Jogador desconecta no meio: jogo continua
- [ ] Reconexão com mesmo sessionId
- [ ] Timer funciona e avança fases automaticamente
- [ ] Gradiente muda: default → valid → invalid nos momentos certos
- [ ] Animações: bounce, shake, fade, pop-in
- [ ] Mobile: testado em viewport 375px
- [ ] PWA: instala no desktop/mobile

## Resultado Esperado
Produto completo, deployado, com conta opcional, histórico, compartilhamento e PWA. Pronto para compartilhar com amigos e coletar feedback.
