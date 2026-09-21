import { describe, expect, it } from 'vitest'

import { type SemanaEscala } from '@/lib/escala'
import {
  SemanasValidacaoError,
  createMemorySemanasService,
} from '@/services/semanas'

const existente: SemanaEscala = {
  id: 's1',
  dataInicio: '2026-09-14',
  dataFim: '2026-09-18',
  estado: 'rascunho',
  feriados: [],
  exibirHorarioPlantao: true,
  ancoraTitular: 1,
  ancoraSuplente: 1,
}

describe('serviço de semanas (memory)', () => {
  it('cria rascunho a partir de uma data', async () => {
    const servico = createMemorySemanasService()
    const criada = await servico.criar({ dataEscolhida: '2026-09-16' })
    expect(criada.estado).toBe('rascunho')
    expect(criada.dataInicio).toBe('2026-09-14')
    expect(criada.dataFim).toBe('2026-09-18')
    expect(criada.ancoraTitular).toBe(1)
    expect(criada.ancoraSuplente).toBe(1)
    expect(criada.exibirHorarioPlantao).toBe(true)
    expect(await servico.listar()).toHaveLength(1)
  })

  it('não persiste segunda duplicada', async () => {
    const servico = createMemorySemanasService([existente])
    await expect(
      servico.criar({ dataEscolhida: '2026-09-16' }),
    ).rejects.toBeInstanceOf(SemanasValidacaoError)
    expect(await servico.listar()).toHaveLength(1)
  })

  it('não persiste feriado fora da semana', async () => {
    const servico = createMemorySemanasService([existente])
    await expect(
      servico.atualizar('s1', { feriados: ['2026-09-20'] }),
    ).rejects.toBeInstanceOf(SemanasValidacaoError)
    const semana = await servico.obter('s1')
    expect(semana?.feriados).toEqual([])
  })
})
