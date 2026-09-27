import { describe, expect, it } from 'vitest'

import { formatarInstanteBr, rotuloOrigemVersao } from '@/lib/escala'

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
})
