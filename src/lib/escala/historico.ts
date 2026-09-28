import { format, parseISO } from 'date-fns'

import { rotuloMesAno } from './periodo'
import type { OrigemVersao, SemanaEscala, VersaoEscala } from './types'

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

function dataAgrupamentoVersao(versao: VersaoEscala, semanas: SemanaEscala[]): string {
  const semana = semanas.find((item) => item.id === versao.semanaId)
  if (semana) return semana.dataInicio
  return versao.criadoEm.slice(0, 10)
}

export function agruparVersoesPorMes(
  versoes: VersaoEscala[],
  semanas: SemanaEscala[],
): { rotulo: string; versoes: VersaoEscala[] }[] {
  const ordenadas = [...versoes].sort((a, b) => {
    const porSemana = dataAgrupamentoVersao(b, semanas).localeCompare(
      dataAgrupamentoVersao(a, semanas),
    )
    if (porSemana !== 0) return porSemana
    return b.criadoEm.localeCompare(a.criadoEm)
  })
  const grupos: { rotulo: string; versoes: VersaoEscala[] }[] = []
  for (const versao of ordenadas) {
    const rotulo = rotuloMesAno(dataAgrupamentoVersao(versao, semanas))
    const ultimo = grupos[grupos.length - 1]
    if (ultimo && ultimo.rotulo === rotulo) {
      ultimo.versoes.push(versao)
    } else {
      grupos.push({ rotulo, versoes: [versao] })
    }
  }
  return grupos
}
