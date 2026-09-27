import { format, parseISO } from 'date-fns'

import type { OrigemVersao } from './types'

export function formatarInstanteBr(iso: string): string {
  try {
    return format(parseISO(iso), 'dd/MM/yyyy HH:mm')
  } catch {
    return iso
  }
}

export function rotuloOrigemVersao(origem: OrigemVersao): string {
  return origem === 'recalcular' ? 'Recalcular' : 'Gerar'
}
