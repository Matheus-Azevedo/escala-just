import { describe, expect, it } from 'vitest'

import {
  conflitoTitularSuplenteNoDia,
  gerarSemana,
  type Ausencia,
  type Oficial,
  type Permuta,
  type SemanaEscala,
} from '@/lib/escala'

const semana: SemanaEscala = {
  id: 's1',
  dataInicio: '2026-09-14',
  dataFim: '2026-09-18',
  estado: 'rascunho',
  feriados: ['2026-09-16'],
  exibirHorarioPlantao: true,
  modoRotacao: 'cadastro',
  ancoraTitular: 1,
  ancoraSuplente: 1,
}

function oficial(id: string, ordem: number): Oficial {
  return {
    id,
    nome: id,
    foraDaRotacao: false,
    ordemTitular: ordem,
    ordemSuplente: ordem,
  }
}

function oficiais(n: number): Oficial[] {
  return Array.from({ length: n }, (_, i) => oficial(`o${i + 1}`, i + 1))
}

function celula(
  resultado: ReturnType<typeof gerarSemana>,
  data: string,
  papel: 'titular' | 'suplente',
  posicao: number,
) {
  return resultado.celulas.find(
    (item) => item.data === data && item.papel === papel && item.posicao === posicao,
  )
}

describe('gerarSemana', () => {
  it('preenche 3+2 em cada dia útil mesmo com feriado', () => {
    const resultado = gerarSemana({
      semana,
      oficiais: oficiais(8),
      ausencias: [],
      permutas: [],
    })
    expect(resultado.celulas).toHaveLength(25)
    const quarta = resultado.celulas.filter((item) => item.data === '2026-09-16')
    expect(quarta.filter((item) => item.papel === 'titular')).toHaveLength(3)
    expect(quarta.filter((item) => item.papel === 'suplente')).toHaveLength(2)
    expect(quarta.every((item) => item.oficialId)).toBe(true)
  })

  it('usa âncoras independentes', () => {
    const resultado = gerarSemana({
      semana: { ...semana, ancoraTitular: 1, ancoraSuplente: 4 },
      oficiais: oficiais(8),
      ausencias: [],
      permutas: [],
    })
    expect(celula(resultado, '2026-09-14', 'titular', 1)?.oficialId).toBe('o1')
    expect(celula(resultado, '2026-09-14', 'suplente', 1)?.oficialId).toBe('o4')
  })

  it('salta titular ausente', () => {
    const ausencias: Ausencia[] = [
      {
        id: 'a1',
        oficialId: 'o4',
        tipo: 'ferias',
        dataInicio: '2026-09-15',
        dataFim: '2026-09-15',
      },
    ]
    const resultado = gerarSemana({
      semana,
      oficiais: oficiais(8),
      ausencias,
      permutas: [],
    })
    expect(celula(resultado, '2026-09-15', 'titular', 1)?.oficialId).toBe('o5')
  })

  it('não coloca o mesmo oficial como titular e suplente', () => {
    const resultado = gerarSemana({
      semana,
      oficiais: oficiais(4),
      ausencias: [],
      permutas: [],
    })
    expect(conflitoTitularSuplenteNoDia(resultado.celulas, '2026-09-14')).toBe(false)
    expect(celula(resultado, '2026-09-14', 'suplente', 2)?.oficialId).toBe('')
    expect(resultado.avisos.some((aviso) => /suplente/i.test(aviso))).toBe(true)
  })

  it('aplica permuta de titular', () => {
    const permutas: Permuta[] = [
      {
        id: 'p1',
        afetadoId: 'o1',
        substitutoId: 'o8',
        papel: 'titular',
        dataInicio: '2026-09-14',
        dataFim: '2026-09-14',
      },
    ]
    const resultado = gerarSemana({
      semana,
      oficiais: oficiais(8),
      ausencias: [],
      permutas,
    })
    expect(celula(resultado, '2026-09-14', 'titular', 1)?.oficialId).toBe('o8')
  })

  it('não aplica permuta que viola RN-006', () => {
    const permutas: Permuta[] = [
      {
        id: 'p1',
        afetadoId: 'o4',
        substitutoId: 'o1',
        papel: 'suplente',
        dataInicio: '2026-09-14',
        dataFim: '2026-09-14',
      },
    ]
    const resultado = gerarSemana({
      semana,
      oficiais: oficiais(8),
      ausencias: [],
      permutas,
    })
    expect(celula(resultado, '2026-09-14', 'suplente', 1)?.oficialId).toBe('o4')
    expect(resultado.avisos.some((aviso) => /não aplicada/i.test(aviso))).toBe(true)
  })

  it('primeira geração alfabética começa no A', () => {
    const lista = oficiaisForaDeOrdem()
    const resultado = gerarSemana({
      semana,
      oficiais: lista,
      ausencias: [],
      permutas: [],
      inicio: 'alfabetico',
    })
    expect(celula(resultado, '2026-09-14', 'titular', 1)?.oficialId).toBe('a')
    expect(celula(resultado, '2026-09-14', 'titular', 2)?.oficialId).toBe('b')
  })

  it('modo âncoras não recomeça no A', () => {
    const resultado = gerarSemana({
      semana: { ...semana, ancoraTitular: 3, ancoraSuplente: 3 },
      oficiais: oficiaisForaDeOrdem(),
      ausencias: [],
      permutas: [],
      inicio: 'ancoras',
    })
    expect(celula(resultado, '2026-09-14', 'titular', 1)?.oficialId).toBe('b')
  })

  it('permuta não reordena o resto da fila alfabética', () => {
    const permutas: Permuta[] = [
      {
        id: 'p1',
        afetadoId: 'a',
        substitutoId: 'g',
        papel: 'titular',
        dataInicio: '2026-09-14',
        dataFim: '2026-09-14',
      },
    ]
    const resultado = gerarSemana({
      semana,
      oficiais: oficiaisForaDeOrdem(),
      ausencias: [],
      permutas,
      inicio: 'alfabetico',
    })
    expect(celula(resultado, '2026-09-14', 'titular', 1)?.oficialId).toBe('g')
    expect(celula(resultado, '2026-09-14', 'titular', 2)?.oficialId).toBe('b')
  })
})

function oficiaisForaDeOrdem(): Oficial[] {
  const linhas: Array<[string, string, number]> = [
    ['z', 'Zeca', 1],
    ['a', 'Ana', 2],
    ['b', 'Bruno', 3],
    ['c', 'Caio', 4],
    ['d', 'Davi', 5],
    ['e', 'Eva', 6],
    ['f', 'Fabio', 7],
    ['g', 'Guto', 8],
  ]
  return linhas.map(([id, nome, ordem]) => ({
    id,
    nome,
    foraDaRotacao: false,
    ordemTitular: ordem,
    ordemSuplente: ordem,
  }))
}
