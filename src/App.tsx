import { BrowserRouter, Navigate, Route, Routes } from 'react-router'

import { AppShell } from '@/components/app-shell'
import { EditorPage } from '@/pages/editor-page'
import { LeitorPage } from '@/pages/leitor-page'
import { LoginPage } from '@/pages/login-page'

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/editor" element={<EditorPage />} />
      <Route path="/leitor" element={<LeitorPage />} />
      <Route path="/" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AppShell>
        <AppRoutes />
      </AppShell>
    </BrowserRouter>
  )
}

export default App
