import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { afterEach, describe, expect, it } from 'vitest'

import { AppTree } from '../App'
import { buttonVariants } from '@/components/ui/button'
import { createMemoryAuthService } from '@/services/auth'
import { createMemoryOficiaisService } from '@/services/oficiais'
import { createMemoryAusenciasService } from '@/services/ausencias'
import { createMemoryCelulasService } from '@/services/celulas'
import { createMemoryPermutasService } from '@/services/permutas'
import { createMemorySemanasService } from '@/services/semanas'
import { createMemoryVersoesService } from '@/services/versoes'
import type { CelulaGrade, Oficial, SemanaEscala, VersaoEscala } from '@/lib/escala'

const semanaMemoria: SemanaEscala = {
  id: 's1',
  dataInicio: '2026-09-14',
  dataFim: '2026-09-18',
  estado: 'rascunho',
  feriados: [],
  exibirHorarioPlantao: true,
  ancoraTitular: 1,
  ancoraSuplente: 1,
}

function renderRota(
  path: string,
  auth: Parameters<typeof createMemoryAuthService>[0],
  semanas: SemanaEscala[] = [],
  oficiais: Oficial[] = [],
  celulas: CelulaGrade[] = [],
  versoes: VersaoEscala[] = [],
) {
  const authService = createMemoryAuthService(auth)
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AppTree
        authService={authService}
        oficiaisService={createMemoryOficiaisService(oficiais)}
        semanasService={createMemorySemanasService(semanas)}
        ausenciasService={createMemoryAusenciasService()}
        permutasService={createMemoryPermutasService()}
        celulasService={createMemoryCelulasService(celulas)}
        versoesService={createMemoryVersoesService(versoes)}
      />
    </MemoryRouter>,
  )
}

describe('guardas de rota', () => {
  afterEach(() => {
    cleanup()
  })

  it('anónimo em /editor vai para o login', () => {
    renderRota('/editor', { configured: true, session: null })
    expect(screen.getByRole('heading', { name: /entrar/i })).toBeInTheDocument()
    expect(
      screen.queryByRole('heading', { name: /área da editora/i }),
    ).not.toBeInTheDocument()
  })

  it('leitor em /editor é redirecionado para /leitor', async () => {
    renderRota('/editor', {
      configured: true,
      session: { uid: 'u1', email: 'leitor@exemplo.com' },
      papel: 'leitor',
    })
    expect(
      await screen.findByRole('heading', { name: /consulta da escala/i }),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('heading', { name: /área da editora/i }),
    ).not.toBeInTheDocument()
  })

  it('sem documento de perfil não abre área protegida', async () => {
    renderRota('/editor', {
      configured: true,
      session: { uid: 'u2', email: 'sem@exemplo.com' },
      papel: null,
    })
    expect(
      await screen.findByText(/perfil não configurado/i),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('heading', { name: /área da editora/i }),
    ).not.toBeInTheDocument()
  })

  it('editor autenticado vê o hub em /editor', async () => {
    renderRota('/editor', {
      configured: true,
      session: { uid: 'u3', email: 'editor@exemplo.com' },
      papel: 'editor',
    })
    expect(
      await screen.findByRole('heading', { name: /área da editora/i }),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /^semanas$/i })).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: /cadastro de oficiais/i }),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /^histórico$/i })).toBeInTheDocument()
    expect(screen.queryByLabelText(/data de referência/i)).not.toBeInTheDocument()
  })

  it('T-02 mostra checkbox de continuidade', async () => {
    renderRota('/editor/semanas', {
      configured: true,
      session: { uid: 'u3c', email: 'editor@exemplo.com' },
      papel: 'editor',
    })
    expect(
      await screen.findByRole('heading', { name: /semanas/i }),
    ).toBeInTheDocument()
    const caixa = screen.getByLabelText(/continuar da semana anterior/i)
    expect(caixa).toBeDisabled()
  })

  it('criar semana com continuidade herda âncoras', async () => {
    const user = userEvent.setup()
    const oficiais: Oficial[] = Array.from({ length: 8 }, (_, i) => ({
      id: `o${i + 1}`,
      nome: `o${i + 1}`,
      foraDaRotacao: false,
      ordemTitular: i + 1,
      ordemSuplente: i + 1,
    }))
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
    renderRota(
      '/editor/semanas',
      {
        configured: true,
        session: { uid: 'u3d', email: 'editor@exemplo.com' },
        papel: 'editor',
      },
      [semanaMemoria],
      oficiais,
      celulas,
    )
    expect(
      await screen.findByRole('heading', { name: /semanas/i }),
    ).toBeInTheDocument()
    const caixa = await screen.findByLabelText(/continuar da semana anterior/i)
    expect(caixa).toBeEnabled()
    await user.click(caixa)
    await user.type(screen.getByLabelText(/data de referência/i), '21/09/2026')
    await user.click(screen.getByRole('button', { name: /criar semana/i }))
    expect(await screen.findByText(/semana criada/i)).toBeInTheDocument()
    const detalhes = screen.getAllByRole('link', { name: /detalhes/i })
    await user.click(detalhes[0])
    expect(
      await screen.findByRole('heading', { name: /parâmetros da semana/i }),
    ).toBeInTheDocument()
    expect(screen.getByLabelText(/âncora dos titulares/i)).toHaveValue(8)
    expect(screen.getByLabelText(/âncora dos suplentes/i)).toHaveValue(2)
  })

  it('editor autenticado vê T-02 em /editor/semanas', async () => {
    renderRota('/editor/semanas', {
      configured: true,
      session: { uid: 'u3', email: 'editor@exemplo.com' },
      papel: 'editor',
    })
    expect(
      await screen.findByRole('heading', { name: /semanas/i }),
    ).toBeInTheDocument()
    expect(screen.getByLabelText(/data de referência/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /^voltar$/i })).toBeInTheDocument()
    expect(
      screen.queryByRole('link', { name: /cadastro de oficiais/i }),
    ).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^gerar$/i })).not.toBeInTheDocument()
  })

  it('login inválido permanece em /login com erro', async () => {
    const user = userEvent.setup()
    renderRota('/login', { configured: true, session: null })

    await user.type(document.getElementById('login-email') as HTMLInputElement, 'invalido@exemplo.com')
    await user.type(document.getElementById('login-password') as HTMLInputElement, 'errada')
    await user.click(screen.getAllByRole('button', { name: /^entrar$/i })[0])

    expect(await screen.findByText(/credenciais inválidas/i)).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /entrar/i })).toBeInTheDocument()
  })

  it('leitor em /editor/semanas vai para /leitor', async () => {
    renderRota('/editor/semanas', {
      configured: true,
      session: { uid: 'u4b', email: 'leitor@exemplo.com' },
      papel: 'leitor',
    })
    expect(
      await screen.findByRole('heading', { name: /consulta da escala/i }),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('heading', { name: /^semanas$/i }),
    ).not.toBeInTheDocument()
  })

  it('leitor em /editor/oficiais vai para /leitor', async () => {
    renderRota('/editor/oficiais', {
      configured: true,
      session: { uid: 'u4', email: 'leitor@exemplo.com' },
      papel: 'leitor',
    })
    expect(
      await screen.findByRole('heading', { name: /consulta da escala/i }),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('heading', { name: /cadastro de oficiais/i }),
    ).not.toBeInTheDocument()
  })

  it('leitor em /editor/ausencias vai para /leitor', async () => {
    renderRota('/editor/ausencias', {
      configured: true,
      session: { uid: 'u4c', email: 'leitor@exemplo.com' },
      papel: 'leitor',
    })
    expect(
      await screen.findByRole('heading', { name: /consulta da escala/i }),
    ).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: /^ausências$/i })).not.toBeInTheDocument()
  })

  it('leitor em /editor/permutas vai para /leitor', async () => {
    renderRota('/editor/permutas', {
      configured: true,
      session: { uid: 'u4d', email: 'leitor@exemplo.com' },
      papel: 'leitor',
    })
    expect(
      await screen.findByRole('heading', { name: /consulta da escala/i }),
    ).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: /^permutas$/i })).not.toBeInTheDocument()
  })

  it('editor autenticado vê T-07 em /editor/permutas', async () => {
    renderRota('/editor/permutas', {
      configured: true,
      session: { uid: 'u5c', email: 'editor@exemplo.com' },
      papel: 'editor',
    })
    expect(await screen.findByRole('heading', { name: /^permutas$/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^gerar$/i })).not.toBeInTheDocument()
  })

  it('editor autenticado vê T-06 em /editor/ausencias', async () => {
    renderRota('/editor/ausencias', {
      configured: true,
      session: { uid: 'u5b', email: 'editor@exemplo.com' },
      papel: 'editor',
    })
    expect(await screen.findByRole('heading', { name: /^ausências$/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^gerar$/i })).not.toBeInTheDocument()
  })

  it('editor autenticado vê T-04 em /editor/oficiais', async () => {
    renderRota('/editor/oficiais', {
      configured: true,
      session: { uid: 'u5', email: 'editor@exemplo.com' },
      papel: 'editor',
    })
    expect(
      await screen.findByRole('heading', { name: /cadastro de oficiais/i }),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /^voltar$/i })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /^semanas$/i })).not.toBeInTheDocument()
  })

  it('leitor em /editor/semanas/:id vai para /leitor', async () => {
    renderRota('/editor/semanas/s1', {
      configured: true,
      session: { uid: 'u6', email: 'leitor@exemplo.com' },
      papel: 'leitor',
    }, [semanaMemoria])
    expect(
      await screen.findByRole('heading', { name: /consulta da escala/i }),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('heading', { name: /parâmetros da semana/i }),
    ).not.toBeInTheDocument()
  })

  it('leitor em /editor/semanas/:id/grade vai para /leitor', async () => {
    renderRota(
      '/editor/semanas/s1/grade',
      {
        configured: true,
        session: { uid: 'u8', email: 'leitor@exemplo.com' },
        papel: 'leitor',
      },
      [semanaMemoria],
    )
    expect(
      await screen.findByRole('heading', { name: /consulta da escala/i }),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('heading', { name: /grade da semana/i }),
    ).not.toBeInTheDocument()
  })

  it('editor autenticado vê T-05 e a grade em /editor/semanas/:id', async () => {
    renderRota(
      '/editor/semanas/s1',
      {
        configured: true,
        session: { uid: 'u7', email: 'editor@exemplo.com' },
        papel: 'editor',
      },
      [semanaMemoria],
    )
    expect(
      await screen.findByRole('heading', { name: /parâmetros da semana/i }),
    ).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /grade da semana/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^gerar$/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /exportar csv/i })).toBeInTheDocument()
  })

  it('editor vê select na grade depois de gerar', async () => {
    const user = userEvent.setup()
    const oficiais: Oficial[] = Array.from({ length: 8 }, (_, i) => ({
      id: `o${i + 1}`,
      nome: `Oficial ${i + 1}`,
      foraDaRotacao: false,
      ordemTitular: i + 1,
      ordemSuplente: i + 1,
    }))
    renderRota(
      '/editor/semanas/s1',
      {
        configured: true,
        session: { uid: 'u7', email: 'editor@exemplo.com' },
        papel: 'editor',
      },
      [semanaMemoria],
      oficiais,
    )
    await user.click(await screen.findByRole('button', { name: /^gerar$/i }))
    expect(await screen.findAllByRole('combobox')).not.toHaveLength(0)
  })

  it('leitor em /leitor vê semanas sem Gerar', async () => {
    renderRota(
      '/leitor',
      {
        configured: true,
        session: { uid: 'u10', email: 'leitor@exemplo.com' },
        papel: 'leitor',
      },
      [semanaMemoria],
    )
    expect(
      await screen.findByRole('heading', { name: /consulta da escala/i }),
    ).toBeInTheDocument()
    expect(screen.getByText(/14\/09\/2026/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /^consultar$/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^gerar$/i })).not.toBeInTheDocument()
  })

  it('leitor em /leitor/semanas/:id vê nomes sem edição', async () => {
    const oficiais: Oficial[] = [
      {
        id: 'o1',
        nome: 'Ana Silva',
        foraDaRotacao: false,
        ordemTitular: 1,
        ordemSuplente: 1,
      },
    ]
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
    renderRota(
      '/leitor/semanas/s1',
      {
        configured: true,
        session: { uid: 'u11', email: 'leitor@exemplo.com' },
        papel: 'leitor',
      },
      [semanaMemoria],
      oficiais,
      celulas,
    )
    expect(await screen.findByText('Ana Silva')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /grade da semana/i })).toBeInTheDocument()
    expect(screen.getByText(/titular 1/i)).toBeInTheDocument()
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^gerar$/i })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /exportar csv/i })).toBeInTheDocument()
  })

  it('editor em /editor/semanas/:id/grade vai para os detalhes da semana', async () => {
    renderRota(
      '/editor/semanas/s1/grade',
      {
        configured: true,
        session: { uid: 'u9', email: 'editor@exemplo.com' },
        papel: 'editor',
      },
      [semanaMemoria],
    )
    expect(
      await screen.findByRole('heading', { name: /parâmetros da semana/i }),
    ).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /grade da semana/i })).toBeInTheDocument()
  })

  it('editor vê o histórico e abre snapshot só-leitura', async () => {
    const oficiais: Oficial[] = [
      {
        id: 'o1',
        nome: 'Ana Silva',
        foraDaRotacao: false,
        ordemTitular: 1,
        ordemSuplente: 1,
      },
    ]
    const versao: VersaoEscala = {
      id: 'v1',
      semanaId: 's1',
      criadoEm: '2026-09-20T12:00:00.000Z',
      origem: 'gerar',
      celulas: [
        {
          id: 'c1',
          semanaId: 's1',
          data: '2026-09-14',
          papel: 'titular',
          posicao: 1,
          oficialId: 'o1',
        },
      ],
    }
    renderRota(
      '/editor/historico',
      {
        configured: true,
        session: { uid: 'u13', email: 'editor@exemplo.com' },
        papel: 'editor',
      },
      [semanaMemoria],
      oficiais,
      [],
      [versao],
    )
    expect(await screen.findByRole('heading', { name: /^histórico$/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /^abrir$/i })).toBeInTheDocument()

    cleanup()
    renderRota(
      '/editor/historico/v1',
      {
        configured: true,
        session: { uid: 'u13', email: 'editor@exemplo.com' },
        papel: 'editor',
      },
      [semanaMemoria],
      oficiais,
      [],
      [versao],
    )
    expect(await screen.findByText('Ana Silva')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /grade da semana/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^gerar$/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument()
  })

  it('leitor em /editor/historico vai para /leitor', async () => {
    renderRota('/editor/historico', {
      configured: true,
      session: { uid: 'u14', email: 'leitor@exemplo.com' },
      papel: 'leitor',
    })
    expect(
      await screen.findByRole('heading', { name: /consulta da escala/i }),
    ).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: /^histórico$/i })).not.toBeInTheDocument()
  })

  it('login usa Input do kit e copy sem T-0', () => {
    renderRota('/login', { configured: true, session: null })
    expect(document.getElementById('login-email')?.getAttribute('data-slot')).toBe(
      'input',
    )
    expect(document.body.textContent ?? '').not.toMatch(/T-0/)
    expect(buttonVariants({ variant: 'default' })).toContain('hover:bg-primary/80')
    expect(buttonVariants({ variant: 'default' })).not.toContain('[a]:hover')
  })

  it('cadastro de oficiais sem códigos T-0', async () => {
    renderRota('/editor/oficiais', {
      configured: true,
      session: { uid: 'u12', email: 'editor@exemplo.com' },
      papel: 'editor',
    })
    expect(
      await screen.findByRole('heading', { name: /cadastro de oficiais/i }),
    ).toBeInTheDocument()
    expect(document.body.textContent ?? '').not.toMatch(/T-0/)
  })

  it('sem env mostra que a configuração está em falta', () => {
    renderRota('/login', { configured: false })
    expect(
      screen.getByText(/configuração firebase em falta/i),
    ).toBeInTheDocument()
  })
})
