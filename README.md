# Escala Just

Aplicação web para a **escala semanal do plantão normal** dos oficiais de justiça (Comarca de Santa Rita, PB).

Em construção: fundação (rotas, autenticação e persistência) ainda em andamento.

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

Copie `.env.example` para `.env.local` e preencha as chaves **públicas** do projeto Firebase de desenvolvimento. Sem essas variáveis a app não chama um projeto indefinido e avisa que a configuração está em falta.

Papéis em `usuarios/{uid}.papel`: `editor` ou `leitor`. Sem esse documento, o login não abre área protegida.

## Licença

A definir.
