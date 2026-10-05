import { describe, expect, it } from 'vitest'

import { meusDias, oficiaisPorNome, type CelulaGrade, type Oficial } from '@/lib/escala'

function celula(parcial: Partial<CelulaGrade> & Pick<CelulaGrade, 'id' | 'data' | 'papel' | 'posicao' | 'oficialId'>): CelulaGrade {
  return { semanaId: 's1', ...parcial }
}

describe('meusDias', () => {
  it('devolve só o oficial, titular antes de suplente no mesmo dia, por data', () => {
    const lista = meusDias(
      [
        celula({ id: 'c2', data: '2026-09-15', papel: 'suplente', posicao: 1, oficialId: 'o1' }),
        celula({ id: 'c3', data: '2026-09-14', papel: 'titular', posicao: 2, oficialId: 'o9' }),
        celula({ id: 'c1', data: '2026-09-16', papel: 'titular', posicao: 1, oficialId: 'o1' }),
        celula({ id: 'c4', data: '2026-09-15', papel: 'titular', posicao: 3, oficialId: 'o1' }),
      ],
      'o1',
    )
    expect(lista.map((item) => item.id)).toEqual(['c4', 'c2', 'c1'])
    expect(lista[0]?.papel).toBe('titular')
    expect(lista[1]?.papel).toBe('suplente')
  })

  it('pesquisa por parte do nome, sem distinguir maiúsculas', () => {
    const oficiais: Oficial[] = [
      { id: 'o1', nome: 'Ana Silva', foraDaRotacao: false, ordemTitular: 1, ordemSuplente: 1 },
      { id: 'o2', nome: 'Bruno', foraDaRotacao: false, ordemTitular: 2, ordemSuplente: 2 },
    ]
    expect(oficiaisPorNome(oficiais, '  silva ').map((item) => item.id)).toEqual(['o1'])
    expect(oficiaisPorNome(oficiais, '   ')).toEqual([])
  })

  it('sem oficial não inventa dias', () => {
    expect(
      meusDias([celula({ id: 'c1', data: '2026-09-14', papel: 'titular', posicao: 1, oficialId: 'o1' })], '  '),
    ).toEqual([])
  })
})