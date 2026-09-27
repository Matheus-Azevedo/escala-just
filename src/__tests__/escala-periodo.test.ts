import { describe, expect, it } from 'vitest'

import {
  agruparSemanasPorMes,
  rotuloMesAno,
  semanasDoPeriodo,
  type SemanaEscala,
} from '@/lib/escala'

function semana(id: string, dataInicio: string, dataFim: string): SemanaEscala {
  return {
    id,
    dataInicio,
    dataFim,
    estado: 'rascunho',
    feriados: [],
    exibirHorarioPlantao: true,
    ancoraTitular: 1,
    ancoraSuplente: 1,
  }
}

describe('semanasDoPeriodo', () => {
  it('lista as segundas do mês', () => {
    const semanas = semanasDoPeriodo({ tipo: 'mes', ano: 2026, mes: 9 })
    expect(semanas.map((item) => item.dataInicio)).toEqual([
      '2026-09-07',
      '2026-09-14',
      '2026-09-21',
      '2026-09-28',
    ])
    expect(semanas.every((item) => item.dataFim > item.dataInicio)).toBe(true)
  })

  it('lista as segundas do ano', () => {
    const semanas = semanasDoPeriodo({ tipo: 'ano', ano: 2026 })
    expect(semanas[0]?.dataInicio).toBe('2026-01-05')
    expect(semanas.at(-1)?.dataInicio.startsWith('2026-')).toBe(true)
    expect(semanas.length).toBeGreaterThan(50)
  })
})

describe('agruparSemanasPorMes', () => {
  it('separa agosto e setembro', () => {
    const grupos = agruparSemanasPorMes([
      semana('s2', '2026-09-07', '2026-09-11'),
      semana('s1', '2026-08-31', '2026-09-04'),
    ])
    expect(grupos.map((grupo) => grupo.rotulo)).toEqual([
      rotuloMesAno('2026-09-07'),
      rotuloMesAno('2026-08-31'),
    ])
    expect(grupos[0]?.semanas[0]?.id).toBe('s2')
  })
})
