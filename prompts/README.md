# SUS — Prompts para Desenvolvimento Autônomo com IA

## Como usar

### Passo 1: Contexto
Cole o conteúdo do `00-contexto-projeto.md` como **system prompt** ou **primeiro prompt** da conversa com o agente de IA. Ele contém toda a especificação do projeto, design system e stack técnica.

### Passo 2: Prompts sequenciais
Envie os prompts na ordem. Cada um depende do anterior:

| # | Arquivo | O que faz | Resultado |
|---|---------|-----------|-----------|
| 0 | `00-contexto-projeto.md` | Contexto completo | IA entende o projeto |
| 1 | `01-setup-design-system.md` | Setup Next.js + Convex + Tailwind + componentes base | Projeto rodando com design system |
| 2 | `02-convex-schema-salas.md` | Schema do banco + criar/entrar sala + lobby realtime | Salas funcionando em tempo real |
| 3 | `03-modo-palavra.md` | Modo Palavra completo (segredo → discussão → voto → resultado) | Primeiro jogo jogável |
| 4 | `04-modo-pergunta.md` | Modo Pergunta + Modo Mestre | Dois modos de jogo |
| 5 | `05-modo-local-polish.md` | Modo local + animações + edge cases | Jogo polido |
| 6 | `06-social-deploy.md` | Contas, histórico, PWA, deploy | Produto completo |

### Dicas de uso
- **Claude Code**: Cole o prompt 0 como CLAUDE.md no root do projeto, depois envie cada prompt como task
- **Cursor**: Cole o prompt 0 em .cursorrules, depois use os prompts como instruções no Composer
- **Outro agente**: Cole 0 como system prompt, depois envie 1-6 sequencialmente
- Se o agente perder contexto entre prompts, re-envie o prompt 0 antes do próximo
- Cada prompt foi projetado para ser executável de forma autônoma — o agente pode implementar tudo sem perguntar nada

### Ordem de prioridade
Se quiser um MVP rápido, faça **0 → 1 → 2 → 3** e já terá um jogo jogável.
Os prompts 4-6 são incrementais e podem ser feitos depois.
