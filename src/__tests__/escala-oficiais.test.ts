import { describe, expect, it } from 'vitest'

import {
  TETO_ROTACAO,
  nomeDuplicado,
  nomeValido,
  ordenarPorNome,
  podeIncluirNaRotacao,
  proximasOrdens,
  validarEscritaOficial,
  type Oficial,
} from '@/lib/escala'

function oficial(parcial: Partial<Oficial> & Pick<Oficial, 'id' | 'nome'>): Oficial {
  return {
    foraDaRotacao: false,
    ordemTitular: 1,
    ordemSuplente: 1,
    ...parcial,
  }
}

function ativos(quantidade: number): Oficial[] {
  return Array.from({ length: quantidade }, (_, indice) =>
    oficial({
      id: `o${indice + 1}`,
      nome: `Oficial ${indice + 1}`,
      ordemTitular: indice + 1,
      ordemSuplente: indice + 1,
    }),
  )
}

describe('funções puras de oficiais', () => {
  it('recusa o 25.º ativo e aceita fora da rotação', () => {
    const lista = ativos(TETO_ROTACAO)
    expect(podeIncluirNaRotacao(lista, { foraDaRotacao: false })).toBe(false)
    expect(podeIncluirNaRotacao(lista, { foraDaRotacao: true })).toBe(true)
    expect(validarEscritaOficial(lista, { nome: 'Novo', foraDaRotacao: false })).toEqual({
      ok: false,
      erro: 'teto-24',
    })
    expect(validarEscritaOficial(lista, { nome: 'Sindicato', foraDaRotacao: true }).ok).toBe(
      true,
    )
  })

  it('rejeita nome vazio e duplicado case-insensitive', () => {
    const lista = [oficial({ id: '1', nome: 'Ana' })]
    expect(nomeValido('')).toBe(false)
    expect(nomeValido('   ')).toBe(false)
    expect(nomeDuplicado('  ana  ', lista)).toBe(true)
    expect(validarEscritaOficial(lista, { nome: '' })).toEqual({
      ok: false,
      erro: 'nome-vazio',
    })
    expect(validarEscritaOficial(lista, { nome: '  ANA  ' })).toEqual({
      ok: false,
      erro: 'nome-duplicado',
    })
  })

  it('atribui max+1 nas duas filas e ordena pt-BR 1..n', () => {
    const lista = [
      oficial({ id: 'a', nome: 'Carlos', ordemTitular: 3, ordemSuplente: 5 }),
      oficial({ id: 'b', nome: 'Ana', ordemTitular: 1, ordemSuplente: 2 }),
    ]
    expect(proximasOrdens(lista)).toEqual({ ordemTitular: 4, ordemSuplente: 6 })

    const comZeca = [
      ...lista,
      oficial({ id: 'c', nome: 'Érica', ordemTitular: 2, ordemSuplente: 1 }),
    ]
    const ordenados = ordenarPorNome(comZeca)
    expect(ordenados.map((item) => item.nome)).toEqual(['Ana', 'Carlos', 'Érica'])
    expect(ordenados.map((item) => item.ordemTitular)).toEqual([1, 2, 3])
    expect(ordenados.map((item) => item.ordemSuplente)).toEqual([1, 2, 3])
  })
})