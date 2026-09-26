import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { afterEach, describe, expect, it } from 'vitest'

import { AppTree } from '../App'
import { createMemoryAuthService } from '@/services/auth'
import { createMemoryOficiaisService } from '@/services/oficiais'
import { createMemoryAusenciasService } from '@/services/ausencias'
import { createMemoryCelulasService } from '@/services/celulas'
import { createMemoryPermutasService } from '@/services/permutas'
import { createMemorySemanasService } from '@/services/semanas'
import type { SemanaEscala } from '@/lib/escala'

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
) {
  const authService = createMemoryAuthService(auth)
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AppTree
        authService={authService}
        oficiaisService={createMemoryOficiaisService()}
        semanasService={createMemorySemanasService(semanas)}
        ausenciasService={createMemoryAusenciasService()}
        permutasService={createMemoryPermutasService()}
        celulasService={createMemoryCelulasService()}
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
    expect(screen.queryByLabelText(/data de referência/i)).not.toBeInTheDocument()
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

  it('sem env mostra que a configuração está em falta', () => {
    renderRota('/login', { configured: false })
    expect(
      screen.getByText(/configuração firebase em falta/i),
    ).toBeInTheDocument()
  })
})
