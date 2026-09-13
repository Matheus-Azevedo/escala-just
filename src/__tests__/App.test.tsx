import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'

import { AppTree } from '../App'
import { createMemoryAuthService } from '@/services/auth'

describe('App', () => {
  it('renderiza o título no shell e o login', () => {
    render(
      <MemoryRouter initialEntries={['/login']}>
        <AppTree
          authService={createMemoryAuthService({
            configured: true,
            session: null,
          })}
        />
      </MemoryRouter>,
    )
    expect(
      screen.getByRole('heading', { name: /escala just/i }),
    ).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /entrar/i })).toBeInTheDocument()
  })
})
