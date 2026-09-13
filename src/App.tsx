import type { ReactNode } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router'

import { AppShell } from '@/components/app-shell'
import { HomeRedirect } from '@/components/home-redirect'
import { RequireAuth } from '@/components/require-auth'
import { Button } from '@/components/ui/button'
import { AuthProvider, useAuth } from '@/hooks/auth-context'
import { EditorPage } from '@/pages/editor-page'
import { LeitorPage } from '@/pages/leitor-page'
import { LoginPage } from '@/pages/login-page'
import type { AuthService } from '@/services/auth'

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/editor"
        element={
          <RequireAuth papel="editor">
            <EditorPage />
          </RequireAuth>
        }
      />
      <Route
        path="/leitor"
        element={
          <RequireAuth>
            <LeitorPage />
          </RequireAuth>
        }
      />
      <Route path="/" element={<HomeRedirect />} />
    </Routes>
  )
}

function AuthenticatedShell({ children }: { children: ReactNode }) {
  const { state, logout } = useAuth()
  const loading = state.status === 'loading'

  return (
    <AppShell
      loading={loading}
      headerAction={
        state.status === 'ready' || state.status === 'no-profile' ? (
          <Button type="button" variant="outline" onClick={() => void logout()}>
            Sair
          </Button>
        ) : null
      }
    >
      {state.status === 'unconfigured' ? (
        <p className="text-sm text-muted-foreground" role="status">
          Configuração Firebase em falta. Copie <code>.env.example</code> para{' '}
          <code>.env.local</code>.
        </p>
      ) : (
        children
      )}
    </AppShell>
  )
}

export function AppTree({ authService }: { authService?: AuthService }) {
  return (
    <AuthProvider service={authService}>
      <AuthenticatedShell>
        <AppRoutes />
      </AuthenticatedShell>
    </AuthProvider>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AppTree />
    </BrowserRouter>
  )
}

export default App
