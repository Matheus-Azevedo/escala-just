import { describe, expect, it } from 'vitest'

import {
  agruparVersoesPorMes,
  formatarInstanteBr,
  rotuloMesAno,
  rotuloOrigemVersao,
  type SemanaEscala,
  type VersaoEscala,
} from '@/lib/escala'

describe('histórico de versões (puro)', () => {
  it('formata instante em português', () => {
    expect(formatarInstanteBr('2026-09-27T18:05:00.000Z')).toMatch(
      /\d{2}\/\d{2}\/2026 \d{2}:\d{2}/,
    )
  })

  it('rótulo da origem', () => {
    expect(rotuloOrigemVersao('gerar')).toBe('Gerar')
    expect(rotuloOrigemVersao('recalcular')).toBe('Recalcular')
  })

  it('agrupa snapshots pelo mês da segunda da semana', () => {
    const semanas: SemanaEscala[] = [
      {
        id: 's2',
        dataInicio: '2026-09-07',
        dataFim: '2026-09-11',
        estado: 'rascunho',
        feriados: [],
        exibirHorarioPlantao: true,
        ancoraTitular: 1,
        ancoraSuplente: 1,
      },
      {
        id: 's1',
        dataInicio: '2026-08-31',
        dataFim: '2026-09-04',
        estado: 'rascunho',
        feriados: [],
        exibirHorarioPlantao: true,
        ancoraTitular: 1,
        ancoraSuplente: 1,
      },
    ]
    const versoes: VersaoEscala[] = [
      { id: 'v1', semanaId: 's1', criadoEm: '2026-09-01T10:00:00.000Z', origem: 'gerar', celulas: [] },
      { id: 'v2', semanaId: 's2', criadoEm: '2026-09-08T10:00:00.000Z', origem: 'gerar', celulas: [] },
    ]
    const grupos = agruparVersoesPorMes(versoes, semanas)
    expect(grupos.map((grupo) => grupo.rotulo)).toEqual([
      rotuloMesAno('2026-09-07'),
      rotuloMesAno('2026-08-31'),
    ])
    expect(grupos[0]?.versoes[0]?.id).toBe('v2')
  })
})
