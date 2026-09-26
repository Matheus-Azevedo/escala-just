import { describe, expect, it } from 'vitest'

import {
  gerarSemana,
  oficiaisElegiveisParaCelula,
  validarAjusteCelula,
  type CelulaGrade,
  type Oficial,
  type SemanaEscala,
} from '@/lib/escala'

const semana: SemanaEscala = {
  id: 's1',
  dataInicio: '2026-09-14',
  dataFim: '2026-09-18',
  estado: 'rascunho',
  feriados: [],
  exibirHorarioPlantao: true,
  ancoraTitular: 1,
  ancoraSuplente: 1,
}

function oficiais(n: number): Oficial[] {
  return Array.from({ length: n }, (_, i) => ({
    id: `o${i + 1}`,
    nome: `o${i + 1}`,
    foraDaRotacao: false,
    ordemTitular: i + 1,
    ordemSuplente: i + 1,
  }))
}

function comIds(lista: ReturnType<typeof gerarSemana>['celulas']): CelulaGrade[] {
  return lista.map((celula, indice) => ({ id: `c${indice + 1}`, ...celula }))
}

describe('ajuste de célula', () => {
  const lista = oficiais(8)
  const celulas = comIds(gerarSemana({ semana, oficiais: lista, ausencias: [], permutas: [] }).celulas)

  it('aceita troca válida', () => {
    const titular = celulas.find((item) => item.papel === 'titular' && item.posicao === 1)!
    const suplentesDia = new Set(
      celulas
        .filter((item) => item.data === titular.data && item.papel === 'suplente' && item.oficialId)
        .map((item) => item.oficialId),
    )
    const livre = lista.find(
      (oficial) => oficial.id !== titular.oficialId && !suplentesDia.has(oficial.id),
    )!
    expect(
      validarAjusteCelula({
        celulas,
        celulaId: titular.id,
        oficialId: livre.id,
        oficiais: lista,
        ausencias: [],
      }),
    ).toEqual({ ok: true })
  })

  it('recusa RN-006', () => {
    const dia = '2026-09-14'
    const titular = celulas.find(
      (item) => item.data === dia && item.papel === 'titular' && item.posicao === 1,
    )!
    const suplente = celulas.find(
      (item) => item.data === dia && item.papel === 'suplente' && item.posicao === 1,
    )!
    expect(
      validarAjusteCelula({
        celulas,
        celulaId: suplente.id,
        oficialId: titular.oficialId,
        oficiais: lista,
        ausencias: [],
      }),
    ).toEqual({ ok: false, erro: 'rn-006' })
  })

  it('elegíveis do suplente excluem o titular do dia', () => {
    const dia = '2026-09-14'
    const titular = celulas.find(
      (item) => item.data === dia && item.papel === 'titular' && item.posicao === 1,
    )!
    const suplente = celulas.find(
      (item) => item.data === dia && item.papel === 'suplente' && item.posicao === 1,
    )!
    const elegiveis = oficiaisElegiveisParaCelula({
      celulas,
      celula: suplente,
      oficiais: lista,
      ausencias: [],
    })
    expect(elegiveis.map((item) => item.id)).not.toContain(titular.oficialId)
  })
})
