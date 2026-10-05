import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { OficiaisProvider } from '@/hooks/oficiais-context'
import type { Oficial } from '@/lib/escala'
import { OficiaisPage } from '@/pages/oficiais-page'
import { createMemoryOficiaisService } from '@/services/oficiais'

const oficiais: Oficial[] = [
  {
    id: 'a',
    nome: 'Ana',
    foraDaRotacao: false,
    ordemTitular: 1,
    ordemSuplente: 1,
  },
  {
    id: 'b',
    nome: 'Bruno',
    foraDaRotacao: true,
    ordemTitular: 2,
    ordemSuplente: 2,
  },
]

function renderPagina() {
  return render(
    <MemoryRouter>
      <OficiaisProvider service={createMemoryOficiaisService(oficiais)}>
        <OficiaisPage />
      </OficiaisProvider>
    </MemoryRouter>,
  )
}

describe('cadastro de oficiais — editar', () => {
  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
  })

  it('rola até ao formulário e foca o nome, também no segundo clique', async () => {
    const scroll = vi.fn()
    HTMLElement.prototype.scrollIntoView = scroll
    const user = userEvent.setup()
    renderPagina()

    const botoes = await screen.findAllByRole('button', { name: 'Editar' })
    expect(botoes).toHaveLength(2)

    await user.click(botoes[1]!)
    const nome = screen.getByLabelText('Nome')
    expect(nome).toHaveValue('Bruno')
    expect(nome).toHaveFocus()
    expect(scroll).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' })

    scroll.mockClear()
    await user.click(botoes[1]!)
    expect(nome).toHaveFocus()
    expect(scroll).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' })
  })
})
