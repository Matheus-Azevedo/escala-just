import { describe, expect, it } from 'vitest'

import { substitutoAssumeNoDia, validarEscritaPermuta, type Permuta } from '@/lib/escala'

const permuta: Permuta = {
  id: 'p1',
  afetadoId: 'o1',
  substitutoId: 'o2',
  papel: 'titular',
  dataInicio: '2026-09-14',
  dataFim: '2026-09-16',
}

describe('núcleo de permutas', () => {
  it('recusa o mesmo oficial e intervalo invertido', () => {
    expect(
      validarEscritaPermuta({
        afetadoId: 'o1',
        substitutoId: 'o1',
        papel: 'titular',
        dataInicio: '2026-09-14',
        dataFim: '2026-09-14',
      }),
    ).toEqual({ ok: false, erro: 'mesmo-oficial' })
    expect(
      validarEscritaPermuta({
        afetadoId: 'o1',
        substitutoId: 'o2',
        papel: 'titular',
        dataInicio: '2026-09-18',
        dataFim: '2026-09-14',
      }),
    ).toEqual({ ok: false, erro: 'intervalo-invalido' })
  })

  it('indica substituto no dia/papel coberto', () => {
    expect(substitutoAssumeNoDia([permuta], 'o1', '2026-09-15', 'titular')).toBe(true)
    expect(substitutoAssumeNoDia([permuta], 'o1', '2026-09-15', 'suplente')).toBe(false)
    expect(substitutoAssumeNoDia([permuta], 'o1', '2026-09-21', 'titular')).toBe(false)
    expect(
      substitutoAssumeNoDia(
        [{ ...permuta, papel: 'ambos' }],
        'o1',
        '2026-09-15',
        'suplente',
      ),
    ).toBe(true)
  })
})
