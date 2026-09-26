import type { Ausencia, AusenciaDraft, AusenciaErro, TipoAusencia } from './types'
import { parseDia } from './semana'

export function isTipoAusencia(valor: unknown): valor is TipoAusencia {
  return valor === 'ferias' || valor === 'doenca' || valor === 'outro'
}

export function intervaloAusenciaValido(inicio: string, fim: string): boolean {
  const a = parseDia(inicio)
  const b = parseDia(fim)
  if (!a || !b) return false
  return inicio <= fim
}

export function oficialAusenteNoDia(
  ausencias: Ausencia[],
  oficialId: string,
  dia: string,
): boolean {
  if (!parseDia(dia) || !oficialId) return false
  return ausencias.some(
    (item) =>
      item.oficialId === oficialId && item.dataInicio <= dia && dia <= item.dataFim,
  )
}

export function motivoAusencia(tipo: TipoAusencia, motivo?: string): string | undefined {
  if (tipo !== 'outro') return undefined
  const texto = motivo?.trim()
  return texto || undefined
}

export function mensagemAusencia(erro: AusenciaErro): string {
  if (erro === 'oficial-vazio') return 'Escolha um oficial.'
  if (erro === 'tipo-invalido') return 'Escolha o tipo da ausência.'
  return 'A data final não pode ser anterior à inicial.'
}

export function validarEscritaAusencia(
  draft: AusenciaDraft,
): { ok: true } | { ok: false; erro: AusenciaErro } {
  if (!draft.oficialId.trim()) return { ok: false, erro: 'oficial-vazio' }
  if (!isTipoAusencia(draft.tipo)) return { ok: false, erro: 'tipo-invalido' }
  if (!intervaloAusenciaValido(draft.dataInicio, draft.dataFim)) {
    return { ok: false, erro: 'intervalo-invalido' }
  }
  return { ok: true }
}
