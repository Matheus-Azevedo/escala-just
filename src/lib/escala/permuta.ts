import { intervaloAusenciaValido } from './ausencia'
import { parseDia } from './semana'
import type { PapelPermuta, Permuta, PermutaDraft, PermutaErro } from './types'

export type PapelCelula = 'titular' | 'suplente'

export function isPapelPermuta(valor: unknown): valor is PapelPermuta {
  return valor === 'titular' || valor === 'suplente' || valor === 'ambos'
}

export function observacaoPermuta(texto?: string): string | undefined {
  const limpo = texto?.trim()
  return limpo || undefined
}

export function substitutoAssumeNoDia(
  permutas: Permuta[],
  afetadoId: string,
  dia: string,
  papel: PapelCelula,
): boolean {
  if (!parseDia(dia) || !afetadoId) return false
  return permutas.some((item) => {
    if (item.afetadoId !== afetadoId) return false
    if (item.dataInicio > dia || dia > item.dataFim) return false
    return item.papel === 'ambos' || item.papel === papel
  })
}

export function mensagemPermuta(erro: PermutaErro): string {
  if (erro === 'afetado-vazio') return 'Escolha o oficial afetado.'
  if (erro === 'substituto-vazio') return 'Escolha o oficial que assume.'
  if (erro === 'mesmo-oficial') return 'O substituto tem de ser outro oficial.'
  if (erro === 'papel-invalido') return 'Escolha o papel da permuta.'
  return 'A data final não pode ser anterior à inicial.'
}

export function validarEscritaPermuta(
  draft: PermutaDraft,
): { ok: true } | { ok: false; erro: PermutaErro } {
  if (!draft.afetadoId.trim()) return { ok: false, erro: 'afetado-vazio' }
  if (!draft.substitutoId.trim()) return { ok: false, erro: 'substituto-vazio' }
  if (draft.afetadoId === draft.substitutoId) return { ok: false, erro: 'mesmo-oficial' }
  if (!isPapelPermuta(draft.papel)) return { ok: false, erro: 'papel-invalido' }
  if (!intervaloAusenciaValido(draft.dataInicio, draft.dataFim)) {
    return { ok: false, erro: 'intervalo-invalido' }
  }
  return { ok: true }
}
