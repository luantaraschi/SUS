# Guia de Deploy - SUS

Para colocar o projeto no ar, precisamos fazer o deploy de duas partes: do **Convex** (backend/banco de dados) e do **Next.js** (frontend) na Vercel.

## 1. Arquivos obrigatorios para auth
- O projeto precisa ter `convex/auth.ts`, `convex/http.ts` e `convex/auth.config.ts`.
- O arquivo `convex/auth.config.ts` registra no Convex qual issuer/JWKS devem ser aceitos para os tokens emitidos pelo `@convex-dev/auth`.
- Sem esse arquivo, o OAuth pode completar no `convex.site`, mas o app continua deslogado com erro de auth provider no cliente.

## 2. Variaveis de ambiente
### Convex
No dashboard do Convex, em **Production > Settings > Environment Variables**, configure:

- `CONVEX_SITE_URL`: URL HTTP Actions do deployment de producao, por exemplo `https://algum-nome.convex.site`
- `SITE_URL`: URL publica do app na Vercel, por exemplo `https://sus-wine.vercel.app`
- `JWKS`
- `JWT_PRIVATE_KEY`
- `AUTH_SECRET`
- `AUTH_GOOGLE_ID`
- `AUTH_GOOGLE_SECRET`

### Vercel
Na Vercel, configure:

- `NEXT_PUBLIC_CONVEX_URL`: URL do deployment Convex usada pelo cliente React, por exemplo `https://algum-nome.convex.cloud`

### Fonte de verdade
- `NEXT_PUBLIC_CONVEX_URL` = endpoint `.convex.cloud` usado pelo frontend
- `CONVEX_SITE_URL` = endpoint `.convex.site` usado no OAuth e HTTP Actions
- `SITE_URL` = dominio publico final do app

`NEXT_PUBLIC_CONVEX_SITE_URL` nao e usado pelo app atual.

## 3. Google OAuth
- No Google Cloud Console, o cliente OAuth de producao deve incluir este redirect URI:
  - `https://<deployment>.convex.site/api/auth/callback/google`
- Exemplo:
  - `https://colorless-jellyfish-260.convex.site/api/auth/callback/google`
- O callback do Google volta para o `convex.site`; depois o Convex redireciona o usuario de volta para `SITE_URL`.

## 4. Deploy do Convex
1. Certifique-se de que voce ja fez login no Convex CLI com `npx convex login`.
2. Faca o deploy de producao com:
   ```bash
   npm run convex:deploy
   ```
3. Confirme no dashboard do Convex que as variaveis acima estao no ambiente **Production**.

## 5. Deploy do Frontend
1. Faca commit e push do codigo.
2. Na Vercel, crie ou atualize o projeto conectado ao repositorio.
3. Confirme que `NEXT_PUBLIC_CONVEX_URL` aponta para o deployment `.convex.cloud` de producao.
4. Faca o deploy.

## 6. Verificacao pos-deploy
- Entrar em `https://sus-wine.vercel.app`
- Clicar em `Continuar com Google`
- Concluir o login e voltar autenticado
- Confirmar que o botao de perfil aparece no lugar de `Criar Conta`
- Confirmar no navegador que nao ha erro `No auth provider found matching the given token`
- Confirmar no Local Storage que existem chaves `__convexAuthJWT...` e `__convexAuthRefreshToken...`
