import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { AtalhoPwa } from '@/components/atalho-pwa'
import { AuthProvider } from '@/hooks/auth-context'
import { LoginPage } from '@/pages/login-page'
import { createMemoryAuthService } from '@/services/auth'

function matchMediaStandalone(matches: boolean) {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: query.includes('standalone') ? matches : false,
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
    onchange: null,
  }))
}

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

describe('atalho PWA no login', () => {
  it('sem pedido de instalação mostra os passos e o formulário de entrar', () => {
    matchMediaStandalone(false)
    render(
      <MemoryRouter>
        <AuthProvider service={createMemoryAuthService({ configured: true, session: null })}>
          <LoginPage />
        </AuthProvider>
      </MemoryRouter>,
    )
    expect(screen.getByRole('button', { name: /^entrar$/i })).toBeInTheDocument()
    expect(screen.getByText(/partilhar/i)).toBeInTheDocument()
    expect(screen.getByText(/adicionar à tela de início/i)).toBeInTheDocument()
  })

  it('com beforeinstallprompt o toque chama prompt()', async () => {
    matchMediaStandalone(false)
    const prompt = vi.fn().mockResolvedValue(undefined)
    render(<AtalhoPwa />)
    window.dispatchEvent(Object.assign(new Event('beforeinstallprompt'), { prompt }))
    await userEvent.click(await screen.findByRole('button', { name: /adicionar à tela inicial/i }))
    expect(prompt).toHaveBeenCalledOnce()
  })

  it('em standalone não mostra o bloco', () => {
    matchMediaStandalone(true)
    render(<AtalhoPwa />)
    expect(screen.queryByText(/tela inicial/i)).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /adicionar à tela inicial/i })).not.toBeInTheDocument()
  })
})
