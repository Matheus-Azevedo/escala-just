import { addDays, format, startOfWeek } from 'date-fns'

import type { SemanaDraft, SemanaEscala, SemanaErro } from './types'

const DIA = 'yyyy-MM-dd'

export function parseDia(iso: string): Date | null {
  const partes = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso)
  if (!partes) return null
  const ano = Number(partes[1])
  const mes = Number(partes[2])
  const dia = Number(partes[3])
  const data = new Date(ano, mes - 1, dia)
  if (
    data.getFullYear() !== ano ||
    data.getMonth() !== mes - 1 ||
    data.getDate() !== dia
  ) {
    return null
  }
  return data
}

export function formatDia(data: Date): string {
  return format(data, DIA)
}

const DIA_BR = 'dd/MM/yyyy'

export function formatarDiaBr(iso: string): string {
  const data = parseDia(iso)
  return data ? format(data, DIA_BR) : iso
}

export function formatarIntervaloBr(inicio: string, fim: string): string {
  return `${formatarDiaBr(inicio)} a ${formatarDiaBr(fim)}`
}

export function parseDiaBr(texto: string): string | null {
  const limpo = texto.trim()
  if (parseDia(limpo)) return limpo
  const partes = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(limpo)
  if (!partes) return null
  const dia = partes[1].padStart(2, '0')
  const mes = partes[2].padStart(2, '0')
  const iso = `${partes[3]}-${mes}-${dia}`
  return parseDia(iso) ? iso : null
}

export function recortarSemana(iso: string): {
  dataInicio: string
  dataFim: string
} | null {
  const data = parseDia(iso)
  if (!data) return null
  const segunda = startOfWeek(data, { weekStartsOn: 1 })
  return {
    dataInicio: formatDia(segunda),
    dataFim: formatDia(addDays(segunda, 4)),
  }
}

export function intervaloSegundaSextaValido(
  dataInicio: string,
  dataFim: string,
): boolean {
  const recorte = recortarSemana(dataInicio)
  if (!recorte) return false
  return recorte.dataInicio === dataInicio && recorte.dataFim === dataFim
}

export function segundaDuplicada(
  dataInicio: string,
  existentes: SemanaEscala[],
  exceptId?: string,
): boolean {
  return existentes.some(
    (semana) => semana.id !== exceptId && semana.dataInicio === dataInicio,
  )
}

export function feriadoNoIntervalo(
  feriado: string,
  dataInicio: string,
  dataFim: string,
): boolean {
  return feriado >= dataInicio && feriado <= dataFim && parseDia(feriado) !== null
}

export function ancoraValida(valor: number): boolean {
  return Number.isInteger(valor) && valor >= 1
}

export function mensagemSemana(erro: SemanaErro): string {
  if (erro === 'intervalo-invalido') {
    return 'A escala cobre só segunda a sexta.'
  }
  if (erro === 'segunda-duplicada') {
    return 'Já existe uma semana com esta segunda-feira.'
  }
  if (erro === 'feriado-fora') {
    return 'O feriado tem de cair na semana escolhida.'
  }
  return 'As âncoras têm de ser números inteiros a partir de 1.'
}

export function validarCriacaoSemana(
  lista: SemanaEscala[],
  dataEscolhida: string,
):
  | { ok: true; dataInicio: string; dataFim: string }
  | { ok: false; erro: SemanaErro } {
  const recorte = recortarSemana(dataEscolhida)
  if (!recorte || !intervaloSegundaSextaValido(recorte.dataInicio, recorte.dataFim)) {
    return { ok: false, erro: 'intervalo-invalido' }
  }
  if (segundaDuplicada(recorte.dataInicio, lista)) {
    return { ok: false, erro: 'segunda-duplicada' }
  }
  return { ok: true, ...recorte }
}

export function validarEscritaSemana(
  lista: SemanaEscala[],
  draft: SemanaDraft,
  atual?: SemanaEscala,
):
  | {
      ok: true
      dataInicio: string
      dataFim: string
      feriados: string[]
      exibirHorarioPlantao: boolean
      ancoraTitular: number
      ancoraSuplente: number
    }
  | { ok: false; erro: SemanaErro } {
  let dataInicio: string
  let dataFim: string
  if (atual) {
    dataInicio = atual.dataInicio
    dataFim = atual.dataFim
  } else {
    const criacao = validarCriacaoSemana(
      lista,
      draft.dataEscolhida ?? draft.dataInicio ?? '',
    )
    if (!criacao.ok) return criacao
    dataInicio = criacao.dataInicio
    dataFim = criacao.dataFim
  }
  if (!intervaloSegundaSextaValido(dataInicio, dataFim)) {
    return { ok: false, erro: 'intervalo-invalido' }
  }
  const feriados = draft.feriados ?? atual?.feriados ?? []
  if (feriados.some((feriado) => !feriadoNoIntervalo(feriado, dataInicio, dataFim))) {
    return { ok: false, erro: 'feriado-fora' }
  }
  const ancoraTitular = draft.ancoraTitular ?? atual?.ancoraTitular ?? 1
  const ancoraSuplente = draft.ancoraSuplente ?? atual?.ancoraSuplente ?? 1
  if (!ancoraValida(ancoraTitular) || !ancoraValida(ancoraSuplente)) {
    return { ok: false, erro: 'ancora-invalida' }
  }
  return {
    ok: true,
    dataInicio,
    dataFim,
    feriados: [...feriados].sort(),
    exibirHorarioPlantao: draft.exibirHorarioPlantao ?? atual?.exibirHorarioPlantao ?? true,
    ancoraTitular,
    ancoraSuplente,
  }
}
