import { describe, expect, it } from 'vitest'

import { oficialAusenteNoDia } from '@/lib/escala'
import {
  AusenciasValidacaoError,
  createMemoryAusenciasService,
} from '@/services/ausencias'

describe('serviço de ausências (memory)', () => {
  it('cria período válido e o predicado cobre o meio', async () => {
    const servico = createMemoryAusenciasService()
    const criada = await servico.criar({
      oficialId: 'o1',
      tipo: 'doenca',
      dataInicio: '2026-09-14',
      dataFim: '2026-09-18',
    })
    expect(criada.tipo).toBe('doenca')
    const lista = await servico.listar()
    expect(lista).toHaveLength(1)
    expect(oficialAusenteNoDia(lista, 'o1', '2026-09-16')).toBe(true)
  })

  it('não persiste intervalo invertido', async () => {
    const servico = createMemoryAusenciasService()
    await expect(
      servico.criar({
        oficialId: 'o1',
        tipo: 'ferias',
        dataInicio: '2026-09-18',
        dataFim: '2026-09-14',
      }),
    ).rejects.toBeInstanceOf(AusenciasValidacaoError)
    expect(await servico.listar()).toHaveLength(0)
  })

  it('persiste motivo opcional em outro e ignora-o nas férias', async () => {
    const servico = createMemoryAusenciasService()
    const outro = await servico.criar({
      oficialId: 'o1',
      tipo: 'outro',
      dataInicio: '2026-09-14',
      dataFim: '2026-09-14',
      motivo: 'formação CEMAN',
    })
    expect(outro.motivo).toBe('formação CEMAN')
    const ferias = await servico.criar({
      oficialId: 'o1',
      tipo: 'ferias',
      dataInicio: '2026-09-15',
      dataFim: '2026-09-16',
      motivo: 'não deve ficar',
    })
    expect(ferias.motivo).toBe('')
  })
})
