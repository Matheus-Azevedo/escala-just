# Escala Just

Aplicação para apoio à **escala semanal do plantão normal** dos oficiais de justiça (Comarca de Santa Rita, PB).

## Stack (MVP)

- **Vite** + **React** + **TypeScript**
- **Tailwind CSS** v4 + **shadcn/ui** (preset Nova / Radix) + **Lucide** (`lucide-react`)
- **Inter** (Google Fonts), conforme [ADR-002](../doc/adr/ADR-002-ui-bibliotecas-mvp.md)

## Scripts

| Comando    | Descrição              |
| ---------- | ---------------------- |
| `npm run dev`    | Servidor de desenvolvimento |
| `npm run build`  | Typecheck + build de produção |
| `npm run preview`| Pré-visualizar a build        |
| `npm run lint`   | ESLint                        |
| `npm run test`   | Vitest (modo watch)           |
| `npm run test:run` | Vitest (uma execução, CI)    |

## Documentação

Requisitos, modelo de dados, telas e decisões de arquitetura: pasta [`doc/`](../doc/) no repositório do projeto (irmã de `escala-just/`, ou caminho equivalente onde a documentação estiver). **Estrutura de pastas, CSS, testes e mocks do Firebase** estão descritos na **secção 11** do [Arquitetura e stack (MVP)](../doc/text/markdown/05.arquitetura-e-stack-mvp.md).

## Licença

A definir.
