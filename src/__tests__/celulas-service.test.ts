import { describe, expect, it } from 'vitest'

import type { Oficial, SemanaEscala } from '@/lib/escala'
import { createMemoryCelulasService } from '@/services/celulas'

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

const oficiais: Oficial[] = Array.from({ length: 8 }, (_, i) => ({
  id: `o${i + 1}`,
  nome: `o${i + 1}`,
  foraDaRotacao: false,
  ordemTitular: i + 1,
  ordemSuplente: i + 1,
}))

describe('serviço de células (memory)', () => {
  it('gerar grava 25 células', async () => {
    const servico = createMemoryCelulasService()
    const primeiro = await servico.gerar({
      semana,
      oficiais,
      ausencias: [],
      permutas: [],
    })
    expect(primeiro.celulas).toHaveLength(25)
    expect(await servico.listarDaSemana('s1')).toHaveLength(25)
  })

  it('recalcular substitui em vez de duplicar', async () => {
    const servico = createMemoryCelulasService()
    await servico.gerar({ semana, oficiais, ausencias: [], permutas: [] })
    const segundo = await servico.gerar({
      semana,
      oficiais,
      ausencias: [],
      permutas: [],
    })
    expect(segundo.celulas).toHaveLength(25)
    expect(await servico.listarDaSemana('s1')).toHaveLength(25)
  })
})
