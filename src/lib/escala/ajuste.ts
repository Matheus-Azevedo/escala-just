import { oficialAusenteNoDia } from './ausencia'
import { conflitoTitularSuplenteNoDia } from './gerar'
import { ordenarPorNome } from './oficiais'
import type { Ausencia, CelulaGrade, Oficial } from './types'

export type AjusteErro = 'celula-inexistente' | 'rn-006' | 'ausente' | 'fora-rotacao'

export function mensagemAjuste(erro: AjusteErro): string {
  if (erro === 'celula-inexistente') return 'Célula não encontrada.'
  if (erro === 'rn-006') {
    return 'O mesmo oficial não pode ser titular e suplente no mesmo dia.'
  }
  if (erro === 'ausente') return 'Este oficial está ausente neste dia.'
  return 'Este oficial está fora da rotação.'
}

export function validarAjusteCelula(entrada: {
  celulas: CelulaGrade[]
  celulaId: string
  oficialId: string
  oficiais: Oficial[]
  ausencias: Ausencia[]
}): { ok: true } | { ok: false; erro: AjusteErro } {
  const alvo = entrada.celulas.find((item) => item.id === entrada.celulaId)
  if (!alvo) return { ok: false, erro: 'celula-inexistente' }

  const oficialId = entrada.oficialId
  if (oficialId) {
    const oficial = entrada.oficiais.find((item) => item.id === oficialId)
    if (!oficial || oficial.foraDaRotacao) return { ok: false, erro: 'fora-rotacao' }
    if (oficialAusenteNoDia(entrada.ausencias, oficialId, alvo.data)) {
      return { ok: false, erro: 'ausente' }
    }
  }

  const projectadas = entrada.celulas.map((item) =>
    item.id === alvo.id ? { ...item, oficialId } : item,
  )
  if (conflitoTitularSuplenteNoDia(projectadas, alvo.data)) {
    return { ok: false, erro: 'rn-006' }
  }
  return { ok: true }
}

export function oficiaisElegiveisParaCelula(entrada: {
  celulas: CelulaGrade[]
  celula: CelulaGrade
  oficiais: Oficial[]
  ausencias: Ausencia[]
}): Oficial[] {
  const ids = new Set<string>()
  if (entrada.celula.oficialId) {
    const actual = entrada.oficiais.find((item) => item.id === entrada.celula.oficialId)
    if (actual) ids.add(actual.id)
  }
  for (const oficial of entrada.oficiais) {
    const resultado = validarAjusteCelula({
      celulas: entrada.celulas,
      celulaId: entrada.celula.id,
      oficialId: oficial.id,
      oficiais: entrada.oficiais,
      ausencias: entrada.ausencias,
    })
    if (resultado.ok) ids.add(oficial.id)
  }
  return ordenarPorNome(entrada.oficiais.filter((item) => ids.has(item.id)))
}
