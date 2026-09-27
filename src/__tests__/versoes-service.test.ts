import { describe, expect, it } from 'vitest'

import type { CelulaGrade } from '@/lib/escala'
import { createMemoryVersoesService } from '@/services/versoes'

const celulas: CelulaGrade[] = [
  {
    id: 'c1',
    semanaId: 's1',
    data: '2026-09-14',
    papel: 'titular',
    posicao: 1,
    oficialId: 'o1',
  },
]

describe('serviço de versões (memory)', () => {
  it('guardar e listar da mais recente', async () => {
    const servico = createMemoryVersoesService()
    const primeira = await servico.guardar({
      semanaId: 's1',
      origem: 'gerar',
      celulas,
      agora: new Date('2026-09-20T10:00:00.000Z'),
    })
    const segunda = await servico.guardar({
      semanaId: 's1',
      origem: 'recalcular',
      celulas,
      agora: new Date('2026-09-21T10:00:00.000Z'),
    })
    const lista = await servico.listar()
    expect(lista.map((item) => item.id)).toEqual([segunda.id, primeira.id])
    expect(lista[0]?.origem).toBe('recalcular')
    expect(await servico.obter(primeira.id)).toEqual(primeira)
  })
})
