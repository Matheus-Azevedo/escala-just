/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useMemo, type ReactNode } from 'react'

import {
  createFirebaseOficiaisService,
  type OficiaisService,
} from '@/services/oficiais'

const OficiaisContext = createContext<OficiaisService | null>(null)

export function OficiaisProvider({
  children,
  service,
}: {
  children: ReactNode
  service?: OficiaisService
}) {
  const value = useMemo(
    () => service ?? createFirebaseOficiaisService(),
    [service],
  )
  return <OficiaisContext.Provider value={value}>{children}</OficiaisContext.Provider>
}

export function useOficiaisService(): OficiaisService {
  const context = useContext(OficiaisContext)
  if (!context) {
    throw new Error('useOficiaisService deve ser usado dentro de OficiaisProvider')
  }
  return context
}