import { addDays } from 'date-fns'

import { oficialAusenteNoDia } from './ausencia'
import { substitutoAssumeNoDia, type PapelCelula } from './permuta'
import { formatDia, parseDia } from './semana'
import type {
  Ausencia,
  CelulaGrade,
  Oficial,
  Permuta,
  SemanaEscala,
} from './types'

export type CelulaGerada = Omit<CelulaGrade, 'id'>

export type ResultadoGeracao = {
  celulas: CelulaGerada[]
  avisos: string[]
}

export function diasUteisDaSemana(semana: SemanaEscala): string[] {
  const inicio = parseDia(semana.dataInicio)
  if (!inicio || !parseDia(semana.dataFim)) return []
  return [0, 1, 2, 3, 4].map((offset) => formatDia(addDays(inicio, offset)))
}

function filaRotacao(
  oficiais: Oficial[],
  chave: 'ordemTitular' | 'ordemSuplente',
): Oficial[] {
  return oficiais
    .filter((oficial) => !oficial.foraDaRotacao)
    .slice()
    .sort((a, b) => {
      const delta = a[chave] - b[chave]
      if (delta !== 0) return delta
      return a.nome.localeCompare(b.nome, 'pt-BR')
    })
}

function proximoElegivel(
  fila: Oficial[],
  cursor: { i: number },
  pode: (oficial: Oficial) => boolean,
): Oficial | null {
  if (fila.length === 0) return null
  for (let tentativa = 0; tentativa < fila.length; tentativa += 1) {
    const oficial = fila[cursor.i % fila.length]
    cursor.i += 1
    if (pode(oficial)) return oficial
  }
  return null
}

function permutaDoAfetado(
  permutas: Permuta[],
  afetadoId: string,
  dia: string,
  papel: PapelCelula,
): Permuta | undefined {
  if (!substitutoAssumeNoDia(permutas, afetadoId, dia, papel)) return undefined
  return permutas.find((item) => {
    if (item.afetadoId !== afetadoId) return false
    if (item.dataInicio > dia || dia > item.dataFim) return false
    return item.papel === 'ambos' || item.papel === papel
  })
}

function aplicarPermutas(
  celulas: CelulaGerada[],
  permutas: Permuta[],
  ausencias: Ausencia[],
  avisos: string[],
): CelulaGerada[] {
  const resultado = celulas.map((celula) => ({ ...celula }))

  for (const celula of resultado) {
    if (!celula.oficialId) continue
    const permuta = permutaDoAfetado(
      permutas,
      celula.oficialId,
      celula.data,
      celula.papel,
    )
    if (!permuta) continue
    const substitutoId = permuta.substitutoId
    if (oficialAusenteNoDia(ausencias, substitutoId, celula.data)) {
      avisos.push(
        `Permuta não aplicada em ${celula.data}: o substituto está ausente.`,
      )
      continue
    }
    const doDia = resultado.filter((item) => item.data === celula.data)
    const titulares = new Set(
      doDia.filter((item) => item.papel === 'titular' && item.oficialId).map((item) => item.oficialId),
    )
    const suplentes = new Set(
      doDia.filter((item) => item.papel === 'suplente' && item.oficialId).map((item) => item.oficialId),
    )
    if (celula.papel === 'titular') {
      if (suplentes.has(substitutoId) || titulares.has(substitutoId)) {
        avisos.push(
          `Permuta não aplicada em ${celula.data}: o substituto já está na grade desse dia.`,
        )
        continue
      }
    } else if (titulares.has(substitutoId) || suplentes.has(substitutoId)) {
      avisos.push(
        `Permuta não aplicada em ${celula.data}: o substituto já está na grade desse dia.`,
      )
      continue
    }
    celula.oficialId = substitutoId
  }

  return resultado
}

export function conflitoTitularSuplenteNoDia(celulas: CelulaGerada[], dia: string): boolean {
  const doDia = celulas.filter((item) => item.data === dia && item.oficialId)
  const titulares = new Set(
    doDia.filter((item) => item.papel === 'titular').map((item) => item.oficialId),
  )
  return doDia.some(
    (item) => item.papel === 'suplente' && titulares.has(item.oficialId),
  )
}

export function gerarSemana(entrada: {
  semana: SemanaEscala
  oficiais: Oficial[]
  ausencias: Ausencia[]
  permutas: Permuta[]
}): ResultadoGeracao {
  const avisos: string[] = []
  const dias = diasUteisDaSemana(entrada.semana)
  const filaTitular = filaRotacao(entrada.oficiais, 'ordemTitular')
  const filaSuplente = filaRotacao(entrada.oficiais, 'ordemSuplente')
  const cursorTitular = {
    i: Math.max(0, entrada.semana.ancoraTitular - 1),
  }
  const cursorSuplente = {
    i: Math.max(0, entrada.semana.ancoraSuplente - 1),
  }

  const celulas: CelulaGerada[] = []

  for (const dia of dias) {
    const titularesDoDia: string[] = []
    for (let posicao = 1; posicao <= 3; posicao += 1) {
      const oficial = proximoElegivel(
        filaTitular,
        cursorTitular,
        (candidato) =>
          !oficialAusenteNoDia(entrada.ausencias, candidato.id, dia) &&
          !titularesDoDia.includes(candidato.id),
      )
      if (!oficial) {
        avisos.push(`Falta titular ${posicao} em ${dia}.`)
      } else {
        titularesDoDia.push(oficial.id)
      }
      celulas.push({
        semanaId: entrada.semana.id,
        data: dia,
        papel: 'titular',
        posicao,
        oficialId: oficial?.id ?? '',
      })
    }

    const suplentesDoDia: string[] = []
    for (let posicao = 1; posicao <= 2; posicao += 1) {
      const oficial = proximoElegivel(
        filaSuplente,
        cursorSuplente,
        (candidato) =>
          !oficialAusenteNoDia(entrada.ausencias, candidato.id, dia) &&
          !titularesDoDia.includes(candidato.id) &&
          !suplentesDoDia.includes(candidato.id),
      )
      if (oficial) suplentesDoDia.push(oficial.id)
      if (!oficial) {
        avisos.push(`Falta suplente ${posicao} em ${dia}.`)
      }
      celulas.push({
        semanaId: entrada.semana.id,
        data: dia,
        papel: 'suplente',
        posicao,
        oficialId: oficial?.id ?? '',
      })
    }
  }

  const comPermutas = aplicarPermutas(
    celulas,
    entrada.permutas,
    entrada.ausencias,
    avisos,
  )

  return { celulas: comPermutas, avisos }
}
