/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useMemo, type ReactNode } from 'react'

import {
  createFirebaseVersoesService,
  type VersoesService,
} from '@/services/versoes'

const VersoesContext = createContext<VersoesService | null>(null)

export function VersoesProvider({
  children,
  service,
}: {
  children: ReactNode
  service?: VersoesService
}) {
  const value = useMemo(
    () => service ?? createFirebaseVersoesService(),
    [service],
  )
  return <VersoesContext.Provider value={value}>{children}</VersoesContext.Provider>
}

export function useVersoesService(): VersoesService {
  const context = useContext(VersoesContext)
  if (!context) {
    throw new Error('useVersoesService deve ser usado dentro de VersoesProvider')
  }
  return context
}
