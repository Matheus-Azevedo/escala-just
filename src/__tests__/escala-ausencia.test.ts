import { describe, expect, it } from 'vitest'

import {
  intervaloAusenciaValido,
  motivoAusencia,
  oficialAusenteNoDia,
  validarEscritaAusencia,
  type Ausencia,
} from '@/lib/escala'

const ausencia: Ausencia = {
  id: 'a1',
  oficialId: 'o1',
  tipo: 'ferias',
  dataInicio: '2026-09-14',
  dataFim: '2026-09-18',
}

describe('núcleo de ausências', () => {
  it('recusa intervalo invertido', () => {
    expect(intervaloAusenciaValido('2026-09-18', '2026-09-14')).toBe(false)
    expect(
      validarEscritaAusencia({
        oficialId: 'o1',
        tipo: 'ferias',
        dataInicio: '2026-09-18',
        dataFim: '2026-09-14',
      }),
    ).toEqual({ ok: false, erro: 'intervalo-invalido' })
  })

  it('indica ausência no dia coberto e fora do intervalo', () => {
    expect(oficialAusenteNoDia([ausencia], 'o1', '2026-09-16')).toBe(true)
    expect(oficialAusenteNoDia([ausencia], 'o1', '2026-09-21')).toBe(false)
    expect(oficialAusenteNoDia([ausencia], 'o2', '2026-09-16')).toBe(false)
  })

  it('guarda motivo só no tipo outro', () => {
    expect(motivoAusencia('outro', '  formação  ')).toBe('formação')
    expect(motivoAusencia('outro', '   ')).toBeUndefined()
    expect(motivoAusencia('ferias', 'formação')).toBeUndefined()
  })
})
