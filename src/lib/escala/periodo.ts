import { eachWeekOfInterval, endOfMonth, endOfYear, format, startOfMonth, startOfYear } from 'date-fns'
import { ptBR } from 'date-fns/locale'

import { formatDia, parseDia, recortarSemana } from './semana'
import type { SemanaEscala } from './types'

export type RecortePeriodo =
  | { tipo: 'mes'; ano: number; mes: number }
  | { tipo: 'ano'; ano: number }

export function semanasDoPeriodo(recorte: RecortePeriodo): { dataInicio: string; dataFim: string }[] {
  const inicio =
    recorte.tipo === 'mes'
      ? startOfMonth(new Date(recorte.ano, recorte.mes - 1, 1))
      : startOfYear(new Date(recorte.ano, 0, 1))
  const fim =
    recorte.tipo === 'mes'
      ? endOfMonth(new Date(recorte.ano, recorte.mes - 1, 1))
      : endOfYear(new Date(recorte.ano, 0, 1))
  const inicioIso = formatDia(inicio)
  const fimIso = formatDia(fim)
  const vistas = new Set<string>()
  const semanas: { dataInicio: string; dataFim: string }[] = []
  for (const semana of eachWeekOfInterval({ start: inicio, end: fim }, { weekStartsOn: 1 })) {
    const recorteSemana = recortarSemana(formatDia(semana))
    if (!recorteSemana) continue
    if (recorteSemana.dataInicio < inicioIso || recorteSemana.dataInicio > fimIso) continue
    if (vistas.has(recorteSemana.dataInicio)) continue
    vistas.add(recorteSemana.dataInicio)
    semanas.push(recorteSemana)
  }
  return semanas
}

export function rotuloMesAno(dataInicio: string): string {
  const data = parseDia(dataInicio)
  if (!data) return dataInicio
  const texto = format(data, 'MMMM yyyy', { locale: ptBR })
  return texto.charAt(0).toUpperCase() + texto.slice(1)
}

export function agruparSemanasPorMes(semanas: SemanaEscala[]): {
  rotulo: string
  semanas: SemanaEscala[]
}[] {
  const ordenadas = [...semanas].sort((a, b) => b.dataInicio.localeCompare(a.dataInicio))
  const grupos: { rotulo: string; semanas: SemanaEscala[] }[] = []
  for (const semana of ordenadas) {
    const rotulo = rotuloMesAno(semana.dataInicio)
    const ultimo = grupos[grupos.length - 1]
    if (ultimo && ultimo.rotulo === rotulo) {
      ultimo.semanas.push(semana)
    } else {
      grupos.push({ rotulo, semanas: [semana] })
    }
  }
  return grupos
}
