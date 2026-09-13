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

## Licença

A definir.
