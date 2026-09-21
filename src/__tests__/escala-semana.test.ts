import { describe, expect, it } from 'vitest'

import {
  feriadoNoIntervalo,
  intervaloSegundaSextaValido,
  recortarSemana,
  segundaDuplicada,
  validarCriacaoSemana,
  validarEscritaSemana,
  type SemanaEscala,
} from '@/lib/escala'

const semana14: SemanaEscala = {
  id: 's1',
  dataInicio: '2026-09-14',
  dataFim: '2026-09-18',
  estado: 'rascunho',
  feriados: [],
  exibirHorarioPlantao: true,
  ancoraTitular: 1,
  ancoraSuplente: 1,
}

describe('núcleo da semana', () => {
  it('recorta uma quarta para segunda–sexta', () => {
    expect(recortarSemana('2026-09-16')).toEqual({
      dataInicio: '2026-09-14',
      dataFim: '2026-09-18',
    })
  })

  it('recusa intervalo que não é segunda–sexta dessa semana', () => {
    expect(intervaloSegundaSextaValido('2026-09-16', '2026-09-18')).toBe(false)
    expect(intervaloSegundaSextaValido('2026-09-14', '2026-09-17')).toBe(false)
    expect(intervaloSegundaSextaValido('2026-09-14', '2026-09-18')).toBe(true)
  })

  it('recusa segunda duplicada', () => {
    expect(segundaDuplicada('2026-09-14', [semana14])).toBe(true)
    expect(validarCriacaoSemana([semana14], '2026-09-16')).toEqual({
      ok: false,
      erro: 'segunda-duplicada',
    })
  })

  it('aceita feriado dentro da semana e recusa fora', () => {
    expect(feriadoNoIntervalo('2026-09-15', '2026-09-14', '2026-09-18')).toBe(true)
    expect(feriadoNoIntervalo('2026-09-20', '2026-09-14', '2026-09-18')).toBe(false)
    expect(
      validarEscritaSemana([semana14], { feriados: ['2026-09-20'] }, semana14),
    ).toEqual({ ok: false, erro: 'feriado-fora' })
    expect(
      validarEscritaSemana([semana14], { feriados: ['2026-09-15'] }, semana14).ok,
    ).toBe(true)
  })
})
