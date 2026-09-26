import { describe, expect, it } from 'vitest'

import { substitutoAssumeNoDia } from '@/lib/escala'
import { PermutasValidacaoError, createMemoryPermutasService } from '@/services/permutas'

describe('serviço de permutas (memory)', () => {
  it('cria período válido e o predicado cobre o meio', async () => {
    const servico = createMemoryPermutasService()
    await servico.criar({
      afetadoId: 'o1',
      substitutoId: 'o2',
      papel: 'titular',
      dataInicio: '2026-09-14',
      dataFim: '2026-09-16',
    })
    const lista = await servico.listar()
    expect(lista).toHaveLength(1)
    expect(substitutoAssumeNoDia(lista, 'o1', '2026-09-15', 'titular')).toBe(true)
  })

  it('não persiste o mesmo oficial', async () => {
    const servico = createMemoryPermutasService()
    await expect(
      servico.criar({
        afetadoId: 'o1',
        substitutoId: 'o1',
        papel: 'titular',
        dataInicio: '2026-09-14',
        dataFim: '2026-09-14',
      }),
    ).rejects.toBeInstanceOf(PermutasValidacaoError)
    expect(await servico.listar()).toHaveLength(0)
  })
})
