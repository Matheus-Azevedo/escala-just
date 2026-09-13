import type { ReactNode } from 'react'
import { Navigate } from 'react-router'

import { useAuth } from '@/hooks/auth-context'
import type { Papel } from '@/lib/escala'

type RequireAuthProps = {
  children: ReactNode
  papel?: Papel
}

export function RequireAuth({ children, papel }: RequireAuthProps) {
  const { state } = useAuth()

  if (state.status === 'loading' || state.status === 'unconfigured') {
    return null
  }

  if (state.status === 'anonymous') {
    return <Navigate to="/login" replace />
  }

  if (state.status === 'no-profile') {
    return (
      <p className="text-sm text-muted-foreground" role="status">
        Perfil não configurado. Peça à central para criar o documento
        usuarios com o seu papel.
      </p>
    )
  }

  if (papel === 'editor' && state.papel === 'leitor') {
    return <Navigate to="/leitor" replace />
  }

  return children
}
