import type { ReactNode } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router'

import { AppShell } from '@/components/app-shell'
import { HomeRedirect } from '@/components/home-redirect'
import { RequireAuth } from '@/components/require-auth'
import { Button } from '@/components/ui/button'
import { Toaster } from '@/components/ui/sonner'
import { AuthProvider, useAuth } from '@/hooks/auth-context'
import { OficiaisProvider } from '@/hooks/oficiais-context'
import { SemanasProvider } from '@/hooks/semanas-context'
import { EditorPage } from '@/pages/editor-page'
import { LeitorPage } from '@/pages/leitor-page'
import { LoginPage } from '@/pages/login-page'
import { OficiaisPage } from '@/pages/oficiais-page'
import { SemanaPage } from '@/pages/semana-page'
import { SemanasListaPage } from '@/pages/semanas-lista-page'
import type { AuthService } from '@/services/auth'
import type { OficiaisService } from '@/services/oficiais'
import type { SemanasService } from '@/services/semanas'

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
        path="/editor/oficiais"
        element={
          <RequireAuth papel="editor">
            <OficiaisPage />
          </RequireAuth>
        }
      />
      <Route
        path="/editor/semanas"
        element={
          <RequireAuth papel="editor">
            <SemanasListaPage />
          </RequireAuth>
        }
      />
      <Route
        path="/editor/semanas/:id"
        element={
          <RequireAuth papel="editor">
            <SemanaPage />
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
          <Button
            type="button"
            variant="outline"
            className="hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive"
            onClick={() => void logout()}
          >
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

export function AppTree({
  authService,
  oficiaisService,
  semanasService,
}: {
  authService?: AuthService
  oficiaisService?: OficiaisService
  semanasService?: SemanasService
}) {
  return (
    <AuthProvider service={authService}>
      <OficiaisProvider service={oficiaisService}>
        <SemanasProvider service={semanasService}>
          <AuthenticatedShell>
            <AppRoutes />
          </AuthenticatedShell>
          <Toaster />
        </SemanasProvider>
      </OficiaisProvider>
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
