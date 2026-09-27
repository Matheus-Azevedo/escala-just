import { describe, expect, it } from 'vitest'

import {
  escalaParaCsv,
  podeExportarEscala,
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

const oficiais: Oficial[] = [
  {
    id: 'o1',
    nome: 'Ana Silva',
    foraDaRotacao: false,
    ordemTitular: 1,
    ordemSuplente: 1,
  },
]

const celula = (parcial: Partial<CelulaGrade> & Pick<CelulaGrade, 'papel' | 'posicao'>): CelulaGrade => ({
  id: parcial.id ?? 'c1',
  semanaId: 's1',
  data: parcial.data ?? '2026-09-14',
  papel: parcial.papel,
  posicao: parcial.posicao,
  oficialId: parcial.oficialId ?? 'o1',
})

describe('exportar escala', () => {
  it('gera CSV com nomes', () => {
    const csv = escalaParaCsv(
      semana,
      [celula({ papel: 'titular', posicao: 1 })],
      oficiais,
    )
    expect(csv.startsWith('Dia;Vaga;Oficial')).toBe(true)
    expect(csv).toContain('14/09/2026;Titular 1;Ana Silva')
  })

  it('recusa RN-006', () => {
    expect(
      podeExportarEscala([
        celula({ id: 'a', papel: 'titular', posicao: 1 }),
        celula({ id: 'b', papel: 'suplente', posicao: 1 }),
      ]),
    ).toEqual({ ok: false, erro: 'rn-006' })
  })

  it('recusa grade vazia', () => {
    expect(podeExportarEscala([])).toEqual({ ok: false, erro: 'vazia' })
  })
})
