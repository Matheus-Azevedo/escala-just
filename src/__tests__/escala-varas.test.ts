import { describe, expect, it } from 'vitest'

import { rotuloVaraTitular } from '@/lib/escala'

describe('varas dos titulares', () => {
  it('devolve o rótulo fixo de cada posto', () => {
    expect(rotuloVaraTitular(1)).toBe('Juizado da Infância e Juventude')
    expect(rotuloVaraTitular(2)).toBe('2.ª Vara de Família e 3.ª Vara Cível')
    expect(rotuloVaraTitular(3)).toBe('2.ª Vara Criminal')
    expect(rotuloVaraTitular(4)).toBeNull()
  })
})
