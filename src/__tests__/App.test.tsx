import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'

import { AppShell } from '@/components/app-shell'
import { AppRoutes } from '../App'

describe('App', () => {
  it('renderiza o título no shell e o login', () => {
    render(
      <MemoryRouter initialEntries={['/login']}>
        <AppShell>
          <AppRoutes />
        </AppShell>
      </MemoryRouter>,
    )
    expect(
      screen.getByRole('heading', { name: /escala just/i }),
    ).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /entrar/i })).toBeInTheDocument()
  })
})
