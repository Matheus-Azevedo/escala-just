import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { toast } from 'sonner'
import { describe, expect, it, vi } from 'vitest'

import { AjudaFuncao } from '@/components/ajuda-funcao'
import { Toaster } from '@/components/ui/sonner'

describe('AjudaFuncao', () => {
  it('abre a frase no clique e fecha ao clicar fora, sem toast', async () => {
    const spy = vi.spyOn(toast, 'message')
    const user = userEvent.setup()
    render(
      <>
        <AjudaFuncao texto="Gerar monta a grade vazia desta semana." />
        <button type="button">Fora</button>
        <Toaster />
      </>,
    )

    await user.click(screen.getByRole('button', { name: 'Ajuda' }))
    expect(screen.getByRole('note')).toHaveTextContent('Gerar monta a grade vazia desta semana.')

    await user.click(screen.getByRole('button', { name: 'Fora' }))
    expect(screen.queryByRole('note')).not.toBeInTheDocument()
    expect(spy).not.toHaveBeenCalled()
  })
})
