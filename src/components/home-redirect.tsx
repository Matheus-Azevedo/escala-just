import { Navigate } from 'react-router'

import { useAuth } from '@/hooks/auth-context'

export function HomeRedirect() {
  const { state } = useAuth()

  if (state.status === 'loading' || state.status === 'unconfigured') {
    return null
  }

  if (state.status === 'ready' && state.papel === 'editor') {
    return <Navigate to="/editor" replace />
  }

  if (state.status === 'ready' && state.papel === 'leitor') {
    return <Navigate to="/leitor" replace />
  }

  return <Navigate to="/login" replace />
}
