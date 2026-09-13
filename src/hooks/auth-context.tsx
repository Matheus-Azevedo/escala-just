/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

import type { Papel } from '@/lib/escala'
import {
  createFirebaseAuthService,
  type AuthService,
  type AuthSession,
} from '@/services/auth'

export type AuthState =
  | { status: 'loading' }
  | { status: 'unconfigured' }
  | { status: 'anonymous' }
  | { status: 'no-profile'; session: AuthSession }
  | { status: 'ready'; session: AuthSession; papel: Papel }

type AuthContextValue = {
  state: AuthState
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

type AuthProviderProps = {
  children: ReactNode
  service?: AuthService
}

export function AuthProvider({ children, service }: AuthProviderProps) {
  const auth = useMemo(() => service ?? createFirebaseAuthService(), [service])
  const [state, setState] = useState<AuthState>(() =>
    auth.isConfigured() ? { status: 'loading' } : { status: 'unconfigured' },
  )

  useEffect(() => {
    if (!auth.isConfigured()) {
      return
    }

    return auth.subscribe((session) => {
      if (!session) {
        setState({ status: 'anonymous' })
        return
      }

      void auth.fetchPapel(session.uid).then((papel) => {
        if (!papel) {
          setState({ status: 'no-profile', session })
          return
        }
        setState({ status: 'ready', session, papel })
      })
    })
  }, [auth])

  const value = useMemo<AuthContextValue>(
    () => ({
      state,
      login: (email, password) => auth.login(email, password),
      logout: () => auth.logout(),
    }),
    [auth, state],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider')
  }
  return context
}
