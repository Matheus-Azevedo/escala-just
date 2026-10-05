import { normalizarNome } from './oficiais'
import type { CelulaGrade, Oficial } from './types'

export function oficiaisPorNome(oficiais: Oficial[], termo: string): Oficial[] {
  const chave = normalizarNome(termo).toLocaleLowerCase('pt-BR')
  if (!chave) return []
  return oficiais.filter((oficial) =>
    normalizarNome(oficial.nome).toLocaleLowerCase('pt-BR').includes(chave),
  )
}

function ordemPosto(celula: CelulaGrade): number {
  const base = celula.papel === 'titular' ? 0 : 10
  return base + celula.posicao
}

export function meusDias(celulas: CelulaGrade[], oficialId: string): CelulaGrade[] {
  const id = oficialId.trim()
  if (!id) return []
  return celulas
    .filter((celula) => celula.oficialId === id)
    .sort((a, b) => a.data.localeCompare(b.data) || ordemPosto(a) - ordemPosto(b))
}
