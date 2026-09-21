/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useMemo, type ReactNode } from 'react'

import {
  createFirebaseSemanasService,
  type SemanasService,
} from '@/services/semanas'

const SemanasContext = createContext<SemanasService | null>(null)

export function SemanasProvider({
  children,
  service,
}: {
  children: ReactNode
  service?: SemanasService
}) {
  const value = useMemo(
    () => service ?? createFirebaseSemanasService(),
    [service],
  )
  return <SemanasContext.Provider value={value}>{children}</SemanasContext.Provider>
}

export function useSemanasService(): SemanasService {
  const context = useContext(SemanasContext)
  if (!context) {
    throw new Error('useSemanasService deve ser usado dentro de SemanasProvider')
  }
  return context
}
