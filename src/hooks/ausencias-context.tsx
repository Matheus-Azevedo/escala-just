/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useMemo, type ReactNode } from 'react'

import {
  createFirebaseAusenciasService,
  type AusenciasService,
} from '@/services/ausencias'

const AusenciasContext = createContext<AusenciasService | null>(null)

export function AusenciasProvider({
  children,
  service,
}: {
  children: ReactNode
  service?: AusenciasService
}) {
  const value = useMemo(
    () => service ?? createFirebaseAusenciasService(),
    [service],
  )
  return <AusenciasContext.Provider value={value}>{children}</AusenciasContext.Provider>
}

export function useAusenciasService(): AusenciasService {
  const context = useContext(AusenciasContext)
  if (!context) {
    throw new Error('useAusenciasService deve ser usado dentro de AusenciasProvider')
  }
  return context
}
