# Guia de Deploy - SUS

Para colocar o projeto no ar, precisamos fazer o deploy de duas partes: do **Convex** (Backend/Banco de Dados) e do **Next.js** (Frontend) na Vercel.

## 1. Deploy do Convex (Backend)
1. Certifique-se de que você já fez login no Convex CLI (`npx convex login`).
2. Execute o comando de deploy para produção:
   ```bash
   npm run convex:deploy
   ```
   *Ou `npx convex deploy`.*
3. Entre no [Dashboard do Convex](https://dashboard.convex.dev/), vá no seu projeto, selecione **Production** (em vez de *dev*).
4. No menu lateral, acesse **Settings > Environment Variables**.
5. Adicione as mesmas variáveis de ambiente de Autenticação que você tem localmente (`.env.local`), mas agora com os identificadores do Google corretos para produção.
   - `AUTH_GOOGLE_ID`
   - `AUTH_GOOGLE_SECRET`
   - (Se precisar de senhas: `JWKS`, etc., caso aplicável).

## 2. Deploy do Frontend (Vercel)
A maneira mais fácil é através do GitHub e da plataforma Vercel.
1. Faça o commit e push do seu código para um repositório no GitHub.
2. Crie uma conta ou faça login na [Vercel](https://vercel.com/).
3. Clique em **Add New > Project** e selecione o repositório do SUS.
4. Na etapa de configuração (*Environment Variables*), você deve adicionar:
   - `NEXT_PUBLIC_CONVEX_URL`: Pegue a URL do painel do Convex no ambiente **Production** (algo como `https://algum-nome-aleatorio.convex.cloud`).
5. Clique em **Deploy**.

## Concluído!
Após a Vercel finalizar o *build*, o aplicativo já estará online, com Convex rodando no backend. Teste o compartilhamento, a criação de pacotes e a Autenticação no link gerado pela Vercel!
