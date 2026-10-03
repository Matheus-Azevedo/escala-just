import { describe, expect, it } from 'vitest'

import {
  ancorasContinuacao,
  gerarSemana,
  semanaOrigemContinuacao,
  type Oficial,
  type SemanaEscala,
} from '@/lib/escala'

const semanaAnterior: SemanaEscala = {
  id: 's1',
  dataInicio: '2026-09-14',
  dataFim: '2026-09-18',
  estado: 'rascunho',
  feriados: [],
  exibirHorarioPlantao: true,
  modoRotacao: 'cadastro',
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

describe('continuidade de âncoras', () => {
  it('devolve as âncoras do fim das filas após gerar', () => {
    const lista = oficiais(8)
    const gerada = gerarSemana({
      semana: semanaAnterior,
      oficiais: lista,
      ausencias: [],
      permutas: [],
    })
    const ancoras = ancorasContinuacao({
      origem: semanaAnterior,
      oficiais: lista,
      ausencias: [],
      permutas: [],
    })
    expect(ancoras.ancoraTitular).toBe(gerada.proximaAncoraTitular)
    expect(ancoras.ancoraSuplente).toBe(gerada.proximaAncoraSuplente)
    expect(ancoras.ancoraTitular).toBe(8)
    expect(ancoras.ancoraSuplente).toBe(2)
  })

  it('escolhe a última semana gerada anterior', () => {
    const maisAntiga: SemanaEscala = {
      ...semanaAnterior,
      id: 's0',
      dataInicio: '2026-09-07',
      dataFim: '2026-09-11',
    }
    const origem = semanaOrigemContinuacao(
      [semanaAnterior, maisAntiga],
      new Set(['s0', 's1']),
      '2026-09-21',
    )
    expect(origem?.id).toBe('s1')
  })

  it('sem células não há origem', () => {
    expect(
      semanaOrigemContinuacao([semanaAnterior], new Set(), '2026-09-21'),
    ).toBeUndefined()
  })

  it('continuidade alfabética gera a semana seguinte no índice herdado', () => {
    const oficiaisAlfa: Oficial[] = [
      { id: 'z', nome: 'Zeca', foraDaRotacao: false, ordemTitular: 1, ordemSuplente: 1 },
      { id: 'a', nome: 'Ana', foraDaRotacao: false, ordemTitular: 2, ordemSuplente: 2 },
      ...oficiais(6).slice(2),
    ]
    const origem: SemanaEscala = {
      ...semanaAnterior,
      modoRotacao: 'alfabetica',
    }
    const ancoras = ancorasContinuacao({
      origem,
      oficiais: oficiaisAlfa,
      ausencias: [],
      permutas: [],
    })
    const novaSemana: SemanaEscala = {
      ...semanaAnterior,
      id: 's2',
      dataInicio: '2026-09-21',
      dataFim: '2026-09-25',
      modoRotacao: 'alfabetica',
      ancoraTitular: ancoras.ancoraTitular,
      ancoraSuplente: ancoras.ancoraSuplente,
    }
    const gerada = gerarSemana({
      semana: novaSemana,
      oficiais: oficiaisAlfa,
      ausencias: [],
      permutas: [],
      inicio: 'alfabetico',
    })
    expect(gerada.celulas.find(
      (item) => item.data === '2026-09-21' && item.papel === 'titular' && item.posicao === 1,
    )?.oficialId).not.toBe('a')
    expect(ancoras.ancoraTitular).toBeGreaterThan(1)
  })

  it('continuidade alfabética usa fila por nome', () => {
    const oficiaisAlfa: Oficial[] = [
      { id: 'z', nome: 'Zeca', foraDaRotacao: false, ordemTitular: 1, ordemSuplente: 1 },
      { id: 'a', nome: 'Ana', foraDaRotacao: false, ordemTitular: 2, ordemSuplente: 2 },
      ...oficiais(6).slice(2),
    ]
    const origem: SemanaEscala = {
      ...semanaAnterior,
      modoRotacao: 'alfabetica',
    }
    const ancoras = ancorasContinuacao({
      origem,
      oficiais: oficiaisAlfa,
      ausencias: [],
      permutas: [],
    })
    const gerada = gerarSemana({
      semana: origem,
      oficiais: oficiaisAlfa,
      ausencias: [],
      permutas: [],
      inicio: 'alfabetico',
    })
    expect(ancoras.ancoraTitular).toBe(gerada.proximaAncoraTitular)
    expect(
      gerada.celulas.find(
        (item) => item.data === '2026-09-14' && item.papel === 'titular' && item.posicao === 1,
      )?.oficialId,
    ).toBe('a')
  })

  it('não trata semana posterior como origem', () => {
    const futura: SemanaEscala = {
      ...semanaAnterior,
      id: 's2',
      dataInicio: '2026-09-21',
      dataFim: '2026-09-25',
    }
    expect(
      semanaOrigemContinuacao([futura], new Set(['s2']), '2026-09-14'),
    ).toBeUndefined()
  })
})
