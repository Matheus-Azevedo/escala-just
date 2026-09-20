import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { afterEach, describe, expect, it } from 'vitest'

import { AppTree } from '../App'
import { createMemoryAuthService } from '@/services/auth'
import { createMemoryOficiaisService } from '@/services/oficiais'

function renderRota(
  path: string,
  auth: Parameters<typeof createMemoryAuthService>[0],
) {
  const authService = createMemoryAuthService(auth)
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AppTree
        authService={authService}
        oficiaisService={createMemoryOficiaisService()}
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

  it('editor autenticado vê o placeholder T-02', async () => {
    renderRota('/editor', {
      configured: true,
      session: { uid: 'u3', email: 'editor@exemplo.com' },
      papel: 'editor',
    })
    expect(
      await screen.findByRole('heading', { name: /área da editora/i }),
    ).toBeInTheDocument()
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

  it('editor autenticado vê T-04 em /editor/oficiais', async () => {
    renderRota('/editor/oficiais', {
      configured: true,
      session: { uid: 'u5', email: 'editor@exemplo.com' },
      papel: 'editor',
    })
    expect(
      await screen.findByRole('heading', { name: /cadastro de oficiais/i }),
    ).toBeInTheDocument()
  })

  it('sem env mostra que a configuração está em falta', () => {
    renderRota('/login', { configured: false })
    expect(
      screen.getByText(/configuração firebase em falta/i),
    ).toBeInTheDocument()
  })
})
