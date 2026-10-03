import { describe, expect, it } from 'vitest'

import type { Oficial, SemanaEscala } from '@/lib/escala'
import { createMemoryCelulasService } from '@/services/celulas'

const semana: SemanaEscala = {
  id: 's1',
  dataInicio: '2026-09-14',
  dataFim: '2026-09-18',
  estado: 'rascunho',
  feriados: [],
  exibirHorarioPlantao: true,
  modoRotacao: 'cadastro',
  ancoraTitular: 1,
  ancoraSuplente: 1,
}

const oficiais: Oficial[] = Array.from({ length: 8 }, (_, i) => ({
  id: `o${i + 1}`,
  nome: `o${i + 1}`,
  foraDaRotacao: false,
  ordemTitular: i + 1,
  ordemSuplente: i + 1,
}))

describe('serviço de células (memory)', () => {
  it('gerar grava 25 células', async () => {
    const servico = createMemoryCelulasService()
    const primeiro = await servico.gerar({
      semana,
      oficiais,
      ausencias: [],
      permutas: [],
    })
    expect(primeiro.celulas).toHaveLength(25)
    expect(await servico.listarDaSemana('s1')).toHaveLength(25)
  })

  it('recalcular substitui em vez de duplicar', async () => {
    const servico = createMemoryCelulasService()
    await servico.gerar({ semana, oficiais, ausencias: [], permutas: [] })
    const segundo = await servico.gerar({
      semana,
      oficiais,
      ausencias: [],
      permutas: [],
    })
    expect(segundo.celulas).toHaveLength(25)
    expect(await servico.listarDaSemana('s1')).toHaveLength(25)
  })

  it('ajustar grava oficial válido', async () => {
    const servico = createMemoryCelulasService()
    const gerado = await servico.gerar({ semana, oficiais, ausencias: [], permutas: [] })
    const alvo = gerado.celulas.find((item) => item.papel === 'titular' && item.posicao === 1)!
    const suplentesDia = new Set(
      gerado.celulas
        .filter((item) => item.data === alvo.data && item.papel === 'suplente' && item.oficialId)
        .map((item) => item.oficialId),
    )
    const livre = oficiais.find(
      (oficial) => oficial.id !== alvo.oficialId && !suplentesDia.has(oficial.id),
    )!
    await servico.ajustar({
      celulaId: alvo.id,
      oficialId: livre.id,
      oficiais,
      ausencias: [],
    })
    const lista = await servico.listarDaSemana('s1')
    expect(lista.find((item) => item.id === alvo.id)?.oficialId).toBe(livre.id)
  })

  it('ajustar recusa colisão RN-006', async () => {
    const servico = createMemoryCelulasService()
    const gerado = await servico.gerar({ semana, oficiais, ausencias: [], permutas: [] })
    const titular = gerado.celulas.find(
      (item) => item.data === '2026-09-14' && item.papel === 'titular' && item.posicao === 1,
    )!
    const suplente = gerado.celulas.find(
      (item) => item.data === '2026-09-14' && item.papel === 'suplente' && item.posicao === 1,
    )!
    await expect(
      servico.ajustar({
        celulaId: suplente.id,
        oficialId: titular.oficialId,
        oficiais,
        ausencias: [],
      }),
    ).rejects.toThrow(/titular e suplente/i)
    const lista = await servico.listarDaSemana('s1')
    expect(lista.find((item) => item.id === suplente.id)?.oficialId).toBe(suplente.oficialId)
  })

  it('limpar remove células da semana', async () => {
    const servico = createMemoryCelulasService()
    await servico.gerar({ semana, oficiais, ausencias: [], permutas: [] })
    expect(await servico.listarDaSemana('s1')).toHaveLength(25)
    await servico.limpar('s1')
    expect(await servico.listarDaSemana('s1')).toHaveLength(0)
  })

  it('gerar alfabético persiste o primeiro nome', async () => {
    const servico = createMemoryCelulasService()
    const lista: Oficial[] = [
      { id: 'z', nome: 'Zeca', foraDaRotacao: false, ordemTitular: 1, ordemSuplente: 1 },
      { id: 'a', nome: 'Ana', foraDaRotacao: false, ordemTitular: 2, ordemSuplente: 2 },
      ...oficiais.slice(2),
    ]
    const gerado = await servico.gerar({
      semana: { ...semana, modoRotacao: 'alfabetica' },
      oficiais: lista,
      ausencias: [],
      permutas: [],
    })
    const primeiro = gerado.celulas.find(
      (item) => item.data === '2026-09-14' && item.papel === 'titular' && item.posicao === 1,
    )
    expect(primeiro?.oficialId).toBe('a')
  })
})

