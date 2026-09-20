import { describe, expect, it } from 'vitest'

import { TETO_ROTACAO, type Oficial } from '@/lib/escala'
import {
  OficiaisValidacaoError,
  createMemoryOficiaisService,
} from '@/services/oficiais'

function ativos(quantidade: number): Oficial[] {
  return Array.from({ length: quantidade }, (_, indice) => ({
    id: `o${indice + 1}`,
    nome: `Oficial ${indice + 1}`,
    foraDaRotacao: false,
    ordemTitular: indice + 1,
    ordemSuplente: indice + 1,
  }))
}

describe('serviço de oficiais (memory)', () => {
  it('cria oficial válido', async () => {
    const servico = createMemoryOficiaisService()
    const criado = await servico.criar({ nome: '  Maria  ' })
    expect(criado.nome).toBe('Maria')
    expect(criado.ordemTitular).toBe(1)
    const lista = await servico.listar()
    expect(lista).toHaveLength(1)
    expect(lista[0]?.id).toBe(criado.id)
  })

  it('não persiste o 25.º ativo', async () => {
    const servico = createMemoryOficiaisService(ativos(TETO_ROTACAO))
    await expect(servico.criar({ nome: 'Extra', foraDaRotacao: false })).rejects.toBeInstanceOf(
      OficiaisValidacaoError,
    )
    expect(await servico.listar()).toHaveLength(TETO_ROTACAO)
  })

  it('persiste fora da rotação quando já há 24 ativos', async () => {
    const servico = createMemoryOficiaisService(ativos(TETO_ROTACAO))
    const criado = await servico.criar({
      nome: 'Presidente sindicato',
      foraDaRotacao: true,
    })
    expect(criado.foraDaRotacao).toBe(true)
    expect(await servico.listar()).toHaveLength(TETO_ROTACAO + 1)
  })
})