# Escala Just

Aplicação web para a **escala semanal do plantão normal** dos oficiais de justiça (Comarca de Santa Rita, PB).

Fundação no ar. Login de teste: `editor@escala-just.dev` e `leitor@escala-just.dev` (senhas só no Auth, não no git).

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

Projeto **`escala-just-dev`** no plano Spark. Este repositório aponta só para **dev**; produção será outro projeto Firebase, quando existir.

Hosting: https://escala-just-dev.web.app  
(espelho: https://escala-just-dev.firebaseapp.com)

Copie `.env.example` para `.env.local` e preencha as chaves **públicas** do projeto. Sem essas variáveis a app avisa que a configuração está em falta. Não commitar `.env.local`.

Papéis em `usuarios/{uid}.papel`: `editor` ou `leitor`. Sem esse documento, o login não abre área protegida.

Firestore `(default)`, edição Standard, região `southamerica-east1` (São Paulo).

## Licença

A definir.
