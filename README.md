# Escala Just

Aplicação web para a **escala semanal do plantão normal** dos oficiais de justiça (Comarca de Santa Rita, PB).

Para correr localmente: copie `.env.example` para `.env.local` com as chaves do projeto Firebase de desenvolvimento. Sem essas variáveis a app avisa que a configuração está em falta. Não commitar `.env.local`.

## Stack

Vite, React, TypeScript, Tailwind CSS v4, shadcn/ui, Lucide.

## Scripts

Na pasta do repositório:

| Comando | Descrição |
| --- | --- |
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Typecheck + build de produção |
| `npm run preview` | Pré-visualizar a build |
| `npm run lint` | ESLint |
| `npm run test` | Vitest (watch) |
| `npm run test:run` | Vitest (uma execução) |

```bash
npm install
cp .env.example .env.local
npm run dev
```

## Firebase (dev)

Este repositório aponta só para o projeto Firebase de **desenvolvimento**; produção será outro projeto, quando existir.

Papéis em `usuarios/{uid}.papel`: `editor` ou `leitor`. Sem esse documento, o login não abre área protegida.

URL de Hosting, logins de teste e região do Firestore ficam no caderno privado (`escala-just-produto`), não neste README.

## CI (GitHub Actions)

Push e pull request contra `main` correm o workflow `.github/workflows/ci-dev.yml`: `npm ci`, `npm run lint`, `npm run test:run`, `npm run build` (Node 22).

Se o verify passar num **push** a `main`, o job `deploy-dev` faz um build com as variáveis Vite e publica só o **Hosting** do projeto `escala-just-dev` (`firebase deploy --only hosting`). Pull requests **não** publicam.

`git push` **não** publica regras Firestore. Isso continua manual: `firebase deploy --only firestore:rules`.

Secrets no repositório (Settings → Secrets; **valores** nunca no git):

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `FIREBASE_TOKEN` (`firebase login:ci` com a conta pessoal do projeto **dev**, não uma conta de trabalho alheia)

Não ligar o «Deploy from GitHub» do consola Firebase em paralelo com este workflow.

## Licença

A definir.
